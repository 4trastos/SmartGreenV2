#include "../incl/smartgreen.h"
#ifndef MIN
# define MIN(a,b) ((a)<(b)?(a):(b))
#endif

int ft_is_quiet_mode(t_smartgreen *smartgreen)
{
    static int  quiet_mode = -1;        // leídos UNA vez: tras cambiar la config se reinicia el controlador
    static int  start;
    static int  end;
    time_t      now;
    struct tm   tm_info;
    int         current;

    if (quiet_mode == -1)
    {
        quiet_mode = db_read_config(smartgreen, "quiet_mode");
        start      = db_read_config(smartgreen, "quiet_start");
        end        = db_read_config(smartgreen, "quiet_end");
        if (quiet_mode < 0)
            quiet_mode = 0;             // clave inexistente → OFF
    }

    if (quiet_mode == 0)
        return (0);                     // OFF
    if (quiet_mode == 1)
        return (1);                     // 24H — siempre activo

    // TIME — comprobar horario
    now = get_timestamp();
    localtime_r(&now, &tm_info);        // localtime_r: se llama desde varios hilos (scheduler y API)
    current = tm_info.tm_hour * 100 + tm_info.tm_min;

    if (start <= end)
        return (current >= start && current < end);
    return (current >= start || current < end);     // cruza medianoche ej: 2200 → 0600
}

// int ft_is_quiet_mode(t_smartgreen *smartgreen)
// {
//     int quiet_mode  = db_read_config(smartgreen, "quiet_mode");
//     if (quiet_mode == 0) return 0;  // OFF

//     if (quiet_mode == 1) return 1;  // 24H — siempre activo

//     // TIME — comprobar horario
//     time_t      now = get_timestamp();
//     struct tm   *tm_info = localtime(&now);
//     int         current = tm_info->tm_hour * 100 + tm_info->tm_min;
//     int         start = db_read_config(smartgreen, "quiet_start");
//     int         end   = db_read_config(smartgreen, "quiet_end");

//     if (start <= end)
//         return (current >= start && current < end);
//     else  // cruza medianoche ej: 2200 → 0600
//         return (current >= start || current < end);
// }

int ft_quiet_max_speed(t_smartgreen *smartgreen)
{
    static int  max_speed = -1;         // leído UNA vez

    if (max_speed == -1)
    {
        max_speed = db_read_config(smartgreen, "quiet_max_speed");
        if (max_speed < 1 || max_speed > 10)
            max_speed = 3;              // clave inexistente o valor fuera de rango
    }
    return (max_speed);
    // return db_read_config(smartgreen, "quiet_max_speed");
}

int     scheduler_is_active_now(t_scheduler_entry *scheduler, int hour, int min)
{
    int sched_hour;
    int sched_min;

    if (sscanf(scheduler->hour, "%d:%d", &sched_hour, &sched_min) != 2)
        return (0);
    if (sched_hour == hour && sched_min == min)
        return (1);
    return (0);
}

int     scheduler_is_active_today(t_scheduler_entry *scheduler, int day)
{
    int active_today = 0;

    switch (day)
    {
        case 1:
            active_today = scheduler->mon;
            break;
        case 2:
            active_today = scheduler->tue;
            break;
        case 3:
            active_today = scheduler->wed;
            break;
        case 4:
            active_today = scheduler->thu;
            break;
        case 5:
            active_today = scheduler->fri;
            break;
        case 6:
            active_today = scheduler->sat;
            break;
        case 7:
            active_today = scheduler->sun;
            break;
        default:
            break;
    }

    return (active_today);
}

void    scheduler_run(t_smartgreen *smartgreen)
{
    setenv("TZ", "Europe/Madrid", 1);
    tzset();
    struct tm   *tm_info;
    time_t      last_read = get_timestamp();
    time_t      last_history = get_timestamp();
    time_t      last_scheduler = get_timestamp();
    time_t      last_sensor_read = get_timestamp();
    time_t      last_drain_check = get_timestamp();
    time_t      now;
    int         read_interval = db_read_config(smartgreen, "refresh_interval");
    int         sensor_interval = db_read_config(smartgreen, "refresh_sensor_interval");
    int         history_interval = db_read_config(smartgreen, "history_interval");
    int         safety_h = db_read_config(smartgreen, "drain_safety_hours");
    int         drain_periodic = db_read_config(smartgreen, "drain_periodic");
    int         current_day;
    int         current_hour;
    int         current_min;
    int         zone_idx;
    int         on = 0;
    int         new_speed = 0;
    int         r50 = 0;
    // int         startup_drain_done = 0;
    static int  heartbeat_tick = 0;
    float       error = 0.0f;

    if (read_interval < 0)
        read_interval = SCHEDULER_READ_MIN;
    if (history_interval < 0)
        history_interval = HISTORY_INTERVAL;
    if (sensor_interval < 0)
        sensor_interval = 30;
    smartgreen->read_interval = read_interval;

    while (!g_sigint_received && !g_sigterm_received && !g_update_pending)
    {
        now = get_timestamp();

        // Lectura periódica — encolar lecturas
        if (now - last_read >= read_interval)
        {
            if (!smartgreen->modbus_ctx)
                ft_modbus_init(smartgreen);
            if (smartgreen->modbus_ctx)
            {
                for (int i = 0; i < smartgreen->num_coolers; i++)
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_READ_COOLER, smartgreen->coolers[i].unit_id, 0, 0);
                
                // DRAIN SAFETY — vaciar la cubeta a las 72h (por defecto) de estar apagado (una sola vez por apagado)
                for (int h = 0; h < smartgreen->num_zones; h++)
                {
                    if (strcmp(smartgreen->zone_params[h].on_off, "OFF") != 0)
                        continue;
                    for (int i = 0; i < smartgreen->num_coolers; i++)
                    {
                        if (smartgreen->coolers[i].zone_id != smartgreen->zone_params[h].zone_id)
                            continue;
                        if (smartgreen->coolers[i].last_off > 0 && (now - smartgreen->coolers[i].last_off) >= (safety_h * 3600))
                        {
                            char sql_drain[128];

                            // last_off = 0 marca "ya drenado": no se repite y el próximo ON hará prewet
                            smartgreen->coolers[i].last_off = 0;
                            snprintf(sql_drain, sizeof(sql_drain), "UPDATE cooler_state SET last_off=0 WHERE unit_id=%d", smartgreen->coolers[i].unit_id);
                            sqlite3_exec(smartgreen->db, sql_drain, NULL, NULL, NULL);

                            t_drain_args *drain_args = malloc(sizeof(t_drain_args));
                            if (drain_args)
                            {
                                drain_args->smartgreen = smartgreen;
                                drain_args->zone_id    = smartgreen->zone_params[h].zone_id;
                                drain_args->unit_id    = smartgreen->coolers[i].unit_id;
                                drain_args->reason     = DRAIN_SAFETY;
                                pthread_t tid;
                                pthread_create(&tid, NULL, ft_drain_thread, drain_args);
                                pthread_detach(tid);
                            }
                        }
                    }
                }

                // ← Control AUTO por zona
                for (int z = 0; z < smartgreen->num_zones; z++)
                {
                    if (strcmp(smartgreen->zone_params[z].prewet_in_progress, "yes") == 0)
                        continue;
                    if (strcmp(smartgreen->zone_params[z].on_off, "ON") == 0 && strcmp(smartgreen->zone_params[z].cool_fan_mode, "AUTO") == 0)
                    {
                        new_speed = ft_auto_fan_speed(smartgreen, z, &error);

                        // Quiet mode — limitar velocidad
                        if (ft_is_quiet_mode(smartgreen))
                        {
                            int max_q = ft_quiet_max_speed(smartgreen);
                            if (new_speed > max_q)
                                new_speed = max_q;
                        }

                        if (error < 0)
                        {
                            // Standby — resetear integral para arranque limpio
                            smartgreen->zone_params[z].integral = 0.0f;
                            smartgreen->zone_params[z].fan_speed_cmd = 0;
                            smartgreen->zone_params[z].pump_on = 0;
                            for (int i = 0; i < smartgreen->num_coolers; i++)
                                if (smartgreen->coolers[i].zone_id == smartgreen->zone_params[z].zone_id)
                                {
                                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 0, 0));
                                    ft_cooler_outputs(smartgreen, smartgreen->coolers[i].unit_id, 0, 1, 0);    // R50=24: bomba y fan OFF
                                }
                        }
                        else
                        {
                            // Normal — pump+fan a velocidad calculada
                            // Viene de standby: el standby pone fan 0 y bomba 0
                            int from_standby = (smartgreen->zone_params[z].fan_speed_cmd == 0 && smartgreen->zone_params[z].pump_on == 0);
                            // Hay que enviar: viene de standby o del prewet (fan 0)
                            int need_send = (smartgreen->zone_params[z].fan_speed_cmd == 0);

                            if (from_standby)
                                smartgreen->zone_params[z].pump_on = 1;
                            // pump_on NO se fuerza a 1 en cada ciclo: lo decide el control de humedad
                            if (new_speed != smartgreen->zone_params[z].fan_speed_cmd || need_send)
                            {
                                smartgreen->zone_params[z].fan_speed_cmd = new_speed;
                                for (int i = 0; i < smartgreen->num_coolers; i++)
                                    if (smartgreen->coolers[i].zone_id == smartgreen->zone_params[z].zone_id)
                                    {
                                        if (from_standby)
                                            ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, 1);             // ← arranque completo
                                        r50 = calculate_register_50(0, smartgreen->zone_params[z].pump_on, new_speed);
                                        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
                                        ft_cooler_outputs(smartgreen, smartgreen->coolers[i].unit_id, smartgreen->zone_params[z].pump_on, 1, new_speed);
                                    }
                            }
                            ft_auto_humidity_control(smartgreen, z);
                        }
                    }
                    else if (strcmp(smartgreen->zone_params[z].on_off, "ON") == 0 && strcmp(smartgreen->zone_params[z].cool_fan_mode, "FAN") == 0)
                    {
                        // Apagar bomba si estaba encendida
                        if (smartgreen->zone_params[z].pump_on)
                        {
                            smartgreen->zone_params[z].pump_on = 0;
                        }
                        // Enviar velocidad siempre
                        for (int i = 0; i < smartgreen->num_coolers; i++)
                            if (smartgreen->coolers[i].zone_id == smartgreen->zone_params[z].zone_id)
                            {
                                int sq = ft_is_quiet_mode(smartgreen) ? MIN(smartgreen->zone_params[z].fan_speed_cmd, ft_quiet_max_speed(smartgreen)) : smartgreen->zone_params[z].fan_speed_cmd;
                                r50 = calculate_register_50(0, 0, sq);
                                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
                                ft_cooler_outputs(smartgreen, smartgreen->coolers[i].unit_id, 0, 0, sq);   // R50=16: sin agua
                            }
                    }
                    else if (strcmp(smartgreen->zone_params[z].on_off, "ON") == 0 && strcmp(smartgreen->zone_params[z].cool_fan_mode, "MANUAL") == 0)
                    {
                        if (!smartgreen->zone_params[z].pump_on)
                        {
                            smartgreen->zone_params[z].pump_on = 1;
                            for (int i = 0; i < smartgreen->num_coolers; i++)
                                if (smartgreen->coolers[i].zone_id == smartgreen->zone_params[z].zone_id)
                                {
                                    int sq = ft_is_quiet_mode(smartgreen) ? MIN(smartgreen->zone_params[z].fan_speed_cmd, ft_quiet_max_speed(smartgreen)) : smartgreen->zone_params[z].fan_speed_cmd;
                                    r50 = calculate_register_50(0, 1, sq);
                                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
                                    ft_cooler_outputs(smartgreen, smartgreen->coolers[i].unit_id, 1, 1, sq);   // R50=31
                                }
                        }
                    }
                    else if (strcmp(smartgreen->zone_params[z].on_off, "ON") == 0 && strcmp(smartgreen->zone_params[z].cool_fan_mode, "IMD") == 0)
                    {
                        // IMD — apagar todo, solo técnico puede operar
                        if (smartgreen->zone_params[z].pump_on)
                        {
                            smartgreen->zone_params[z].pump_on = 0;
                            for (int i = 0; i < smartgreen->num_coolers; i++)
                                if (smartgreen->coolers[i].zone_id == smartgreen->zone_params[z].zone_id)
                                {
                                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 0, 0));
                                }
                        }
                    }
                }
            }
            ft_ws_broadcast_status(smartgreen);
            ft_check_alarms(smartgreen);
            ft_maintenance_alarms(smartgreen);
            last_read = now;
        }

        // Lectura periódica sensores - encolar lecturas
        if (now - last_sensor_read >= sensor_interval)
        {
            for (int i = 0; i < smartgreen->num_sensors; i++)
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_READ_SENSOR, smartgreen->sensors[i].sensor_id, 0, 0);
            last_sensor_read = now;
        }

        // Drenaje periódico — cada 65 minutos por defecto
        if (now - last_drain_check >= (drain_periodic * 60))
        {
            for (int h = 0; h < smartgreen->num_zones; h++)
            {
                if (strcmp(smartgreen->zone_params[h].on_off, "ON") == 0)
                {
                    // Buscar coolers de esta zona
                    for (int i = 0; i < smartgreen->num_coolers; i++)
                        if (smartgreen->coolers[i].zone_id == smartgreen->zone_params[h].zone_id)
                        {  
                            t_drain_args *drain_args = malloc(sizeof(t_drain_args));
                            if (drain_args)
                            {
                                drain_args->smartgreen  = smartgreen;
                                drain_args->zone_id     = smartgreen->zone_params[h].zone_id;
                                drain_args->unit_id     = smartgreen->coolers[i].unit_id;
                                drain_args->reason      = DRAIN_PERIODIC;
                                pthread_t tid;
                                pthread_create(&tid, NULL, ft_drain_thread, drain_args);
                                pthread_detach(tid);
                            }
                        }
                }
            }
            last_drain_check = now;
        }

        // Historial periódico
        if (now - last_history >= history_interval)
        {
            for (int i = 0; i < smartgreen->num_coolers; i++)
                db_save_history(smartgreen, "CO", &smartgreen->coolers[i], NULL);
            for (int i = 0; i < smartgreen->num_sensors; i++)
                db_save_history(smartgreen, "SE", NULL, &smartgreen->sensors[i]);
            last_history = now;
        }

        if (now - last_scheduler >= SCHEDULER_SEQUENCE)
        {
            static int last_sched_hour = -1;
            static int last_sched_min  = -1;

            tm_info = localtime(&now);
            current_day  = (tm_info->tm_wday == 0) ? 7 : tm_info->tm_wday;
            current_hour = tm_info->tm_hour;
            current_min  = tm_info->tm_min;

            if (current_hour != last_sched_hour || current_min != last_sched_min)
            {
                last_sched_hour = current_hour;
                last_sched_min  = current_min;

                db_read_scheduler(smartgreen);
                for (int i = 0; i < smartgreen->num_schedulers; i++)
                {
                    if (!scheduler_is_active_today(&smartgreen->scheduler[i], current_day))
                        continue;
                    if (!scheduler_is_active_now(&smartgreen->scheduler[i], current_hour, current_min))
                        continue;
                    zone_idx = ft_find_zone(smartgreen, smartgreen->scheduler[i].zone_id);
                    if (zone_idx != -1)
                    {
                        pthread_mutex_lock(&smartgreen->data_mutex);
                        ft_strcpy(smartgreen->zone_params[zone_idx].on_off, smartgreen->scheduler[i].action, sizeof(smartgreen->zone_params->on_off));
                        pthread_mutex_unlock(&smartgreen->data_mutex);
                        if (smartgreen->modbus_ctx)
                        {
                            on = (strcmp(smartgreen->scheduler[i].action, "ON") == 0) ? 1 : 0;
                            if (!on)
                            {
                                for (int j = 0; j < smartgreen->num_coolers; j++)
                                    if (smartgreen->coolers[j].zone_id == smartgreen->scheduler[i].zone_id)
                                        ft_cooler_onoff(smartgreen, smartgreen->coolers[j].unit_id, 0);
                            }
                            else if (on && zone_idx != -1)
                            {
                                pthread_mutex_lock(&smartgreen->data_mutex);
                                ft_strcpy(smartgreen->zone_params[zone_idx].cool_fan_mode, smartgreen->scheduler[i].mode, sizeof(smartgreen->zone_params->cool_fan_mode));
                                if (smartgreen->scheduler[i].target_temp > 0)
                                    smartgreen->zone_params[zone_idx].target_temp = smartgreen->scheduler[i].target_temp;
                                db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
                                pthread_mutex_unlock(&smartgreen->data_mutex);

                                int prewet_sel = db_read_config(smartgreen, "prewet_selector");
                                int unit_id = -1;
                                for (int j = 0; j < smartgreen->num_coolers; j++)
                                    if (smartgreen->coolers[j].zone_id == smartgreen->scheduler[i].zone_id)
                                        { unit_id = smartgreen->coolers[j].unit_id; break; }

                                int need_prewet = cooler_need_prewet(smartgreen, zone_idx, unit_id);
                                int already_running = strcmp(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes") == 0;

                                printf("[SCHEDULER] unit_id=%d need_prewet=%d prewet_sel=%d\n",unit_id, need_prewet, prewet_sel);
                                fflush(stdout);

                                if (!already_running)
                                {
                                    if (strcmp(smartgreen->scheduler[i].mode, "FAN") == 0)
                                    {
                                        pthread_mutex_lock(&smartgreen->data_mutex);
                                        smartgreen->zone_params[zone_idx].fan_speed_cmd = smartgreen->scheduler[i].fan_speed > 0 ? smartgreen->scheduler[i].fan_speed : 5;
                                        pthread_mutex_unlock(&smartgreen->data_mutex);
                                        for (int j = 0; j < smartgreen->num_coolers; j++)
                                            if (smartgreen->coolers[j].zone_id == smartgreen->scheduler[i].zone_id)
                                                ft_cooler_onoff(smartgreen, smartgreen->coolers[j].unit_id, 1);
                                    }
                                    else
                                    {
                                        t_prewet_args *args = malloc(sizeof(t_prewet_args));
                                        if (args)
                                        {
                                            args->smartgreen = smartgreen;
                                            args->zone_id = smartgreen->scheduler[i].zone_id;
                                            args->need_prewet = (prewet_sel && need_prewet);
                                            pthread_t tid;
                                            pthread_create(&tid, NULL, prewet_thread, args);
                                            pthread_detach(tid);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            last_scheduler = now;
        }

        // Heartbeat — cada 5 segundos, fuera del read_interval
        if (smartgreen->modbus_ctx)
        {
            heartbeat_tick++;
            for (int i = 0; i < smartgreen->num_coolers; i++)
            {
                int z = ft_find_zone(smartgreen, smartgreen->coolers[i].zone_id);
                if (z != -1 && strcmp(smartgreen->zone_params[z].on_off, "ON") == 0)
                    if (heartbeat_tick % 5 == 0)
                        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_HEARTBEAT, smartgreen->coolers[i].unit_id, 400, 300);
            }
        }

        if (smartgreen->ws_context)
            lws_service(smartgreen->ws_context, 0);

        sleep(1);
    }

    // Si hay update pendiente, guardar estado
    if (g_update_pending)
        printf("[SCHEDULER] Update pending, exiting scheduler loop...\n");
}

int     db_read_scheduler(t_smartgreen *smartgreen)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT id, name, zone_id, active, action, hour, mon, tue, wed, thu, fri, sat, sun, mode, target_temp, fan_speed FROM scheduler WHERE active = 1;";
    int             rc;
    int             idx = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The scheduler database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    if (smartgreen->scheduler)
        free(smartgreen->scheduler);
    smartgreen->scheduler = malloc(sizeof(t_scheduler_entry) * MAX_SCHEDULERS);
    if (!smartgreen->scheduler)
    {
        sqlite3_finalize(stmt);
        return (-1);
    }

    while (sqlite3_step(stmt) == SQLITE_ROW && idx < MAX_SCHEDULERS)
    {
        smartgreen->scheduler[idx].id = sqlite3_column_int(stmt, 0);
        ft_strcpy(smartgreen->scheduler[idx].name, (char *)sqlite3_column_text(stmt, 1), sizeof(smartgreen->scheduler->name));
        smartgreen->scheduler[idx].zone_id = sqlite3_column_int(stmt, 2);
        smartgreen->scheduler[idx].active = sqlite3_column_int64(stmt, 3);
        ft_strcpy(smartgreen->scheduler[idx].action, (char *)sqlite3_column_text(stmt, 4), sizeof(smartgreen->scheduler->action));
        ft_strcpy(smartgreen->scheduler[idx].hour, (char *)sqlite3_column_text(stmt, 5), sizeof(smartgreen->scheduler->hour));
        smartgreen->scheduler[idx].mon = sqlite3_column_int64(stmt, 6);
        smartgreen->scheduler[idx].tue = sqlite3_column_int64(stmt, 7);
        smartgreen->scheduler[idx].wed = sqlite3_column_int64(stmt, 8);
        smartgreen->scheduler[idx].thu = sqlite3_column_int64(stmt, 9);
        smartgreen->scheduler[idx].fri = sqlite3_column_int64(stmt, 10);
        smartgreen->scheduler[idx].sat = sqlite3_column_int64(stmt, 11);
        smartgreen->scheduler[idx].sun = sqlite3_column_int64(stmt, 12);
        ft_strcpy(smartgreen->scheduler[idx].mode, (char *)sqlite3_column_text(stmt, 13), sizeof(smartgreen->scheduler->mode));
        smartgreen->scheduler[idx].target_temp = (float)sqlite3_column_double(stmt, 14);
        smartgreen->scheduler[idx].fan_speed = sqlite3_column_int(stmt, 15);
        idx++;
    }
    smartgreen->num_schedulers = idx;
    sqlite3_finalize(stmt);
    return (0);
}