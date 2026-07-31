#include "../incl/smartgreen.h"

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
    time_t      now;
    int         read_interval = db_read_config(smartgreen, "refresh_interval");
    int         history_interval = db_read_config(smartgreen, "history_interval");
    int         current_day;
    int         current_hour;
    int         current_min;
    int         zone_idx;
    int         on = 0;
    int         z = 0;

    if (read_interval < 0)
        read_interval = SCHEDULER_READ_MIN;
    if (history_interval < 0)
        history_interval = HISTORY_INTERVAL;
    
    smartgreen->read_interval = read_interval;

    while (!g_sigint_received && !g_sigterm_received)
    {
        now = get_timestamp();

        if (now - last_read >= read_interval)
        {
            if (!smartgreen->modbus_ctx)
                ft_modbus_init(smartgreen);                        // intentar reconectar
            if (smartgreen->modbus_ctx)
            {
                for (int i = 0; i < smartgreen->num_coolers; i++)
                    ft_modbus_read_cooler(smartgreen, smartgreen->coolers[i].unit_id);
                for (int i = 0; i < smartgreen->num_sensors; i++)
                    ft_modbus_read_sensor(smartgreen, smartgreen->sensors[i].sensor_id);
                // ft_ws_broadcast_status(smartgreen);             // Enviar estado actualizado por WebSocket
                for (int i = 0; i < smartgreen->num_coolers; i++)
                {
                    z = ft_find_zone(smartgreen, smartgreen->coolers[i].zone_id);
                    if (z != -1 && strcmp(smartgreen->zone_params[z].on_off, "ON") == 0 && strcmp(smartgreen->zone_params[z].prewet_in_progress, "no") == 0)
                    {
                        printf("SCHEDULER: mandando cmd 400 a cooler %d\n", smartgreen->coolers[i].unit_id);
                        ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 400, 300);
                    }
                }
                
            }
            ft_ws_broadcast_status(smartgreen);
            ft_check_alarms(smartgreen);
            ft_maintenance_alarms(smartgreen);
            last_read = now;
        } 

        if (now - last_history >= history_interval)
        {
            for (int i = 0; i < smartgreen->num_coolers; i++)
                db_save_history(smartgreen, "CO", &smartgreen->coolers[i], NULL);
            for (int i = 0; i < smartgreen->num_sensors; i++)
                db_save_history(smartgreen, "SE", NULL, &smartgreen->sensors[i]);
            last_history = now;
        }

        if (now - last_scheduler >= SCHEDULER_SEQUENCE)         // Mirar el horario cada 15 segundos
        {
            tm_info = localtime(&now);

            current_day = (tm_info->tm_wday == 0) ? 7 : tm_info->tm_wday;
            current_hour = tm_info->tm_hour;
            current_min = tm_info->tm_min;

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
                    ft_strcpy(smartgreen->zone_params[zone_idx].on_off, smartgreen->scheduler[i].action, sizeof(smartgreen->zone_params->on_off));
                    if (smartgreen->modbus_ctx)
                    {
                        on = (strcmp(smartgreen->scheduler[i].action, "ON") == 0) ? 1 : 0;
                        for (int j = 0; j < smartgreen->num_coolers; j++)
                            if (smartgreen->coolers[j].zone_id == smartgreen->scheduler[i].zone_id)
                                ft_cooler_onoff(smartgreen, smartgreen->coolers[j].unit_id, on);
                    }
                }
            }
            last_scheduler = now;
        }

        if (smartgreen->ws_context)
            lws_service(smartgreen->ws_context, 0);             // 0 = no blocking

        sleep(1);
    }
    
}

int     db_read_scheduler(t_smartgreen *smartgreen)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT id, name, zone_id, active, action, hour, mon, tue, wed, thu, fri, sat, sun FROM scheduler WHERE active = 1;";
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
        idx++;
    }
    smartgreen->num_schedulers = idx;
    sqlite3_finalize(stmt);
    return (0);
}