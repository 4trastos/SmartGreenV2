#include "../incl/smartgreen.h"

// Guarda el estado de comunicación en la BD (sobrevive a reinicios del controlador)
void    ft_save_comms_state(t_smartgreen *smartgreen, int i)
{
    char sql[200];

    snprintf(sql, sizeof(sql), "UPDATE cooler_state SET comms_lost=%d, comms_events=%d, comms_events_since=%ld WHERE unit_id=%d",
        smartgreen->coolers[i].comms_lost, smartgreen->coolers[i].comms_events,
        (long)smartgreen->coolers[i].comms_events_since, smartgreen->coolers[i].unit_id);
    sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
}

void    ft_check_board(t_smartgreen *smartgreen, int i)
{
    t_cooler_state  *c = &smartgreen->coolers[i];
    char            msg[256];
    char            sql[256];

    if (c->board_fw == 0)                                       
        return;
    // R27 = arranques de la placa: si sube, se ha reiniciado (corte de tensión, aunque sea de 1 s)
    if (c->prev_cold_starts >= 0 && c->cold_starts > c->prev_cold_starts)
    {
        snprintf(msg, sizeof(msg), "🔄 Placa reiniciada unit_id=%d (arranque nº %d): reenviando estado", c->unit_id, c->cold_starts);
        db_save_error(smartgreen, c->unit_id, msg);
        printf("[PLACA] %s\n", msg); fflush(stdout);
        c->need_resync = 1;
    }

    c->prev_cold_starts = c->cold_starts;

    if (c->fp_fw == 0 && c->fp_r10 == 0 && c->fp_r17 == 0 && c->fp_r44 == 0)
    {
        snprintf(msg, sizeof(msg), "🔧 Placa registrada unit_id=%d (fw %d.%d, id %04X-%04X-%04X-%04X)", c->unit_id, c->board_fw >> 8, c->board_fw & 0xFF, c->board_r10, c->board_r16, c->board_r17, c->board_r44);
    }
    else if (c->board_fw != c->fp_fw || c->board_r10 != c->fp_r10 || c->board_r16 != c->fp_r16 || c->board_r17 != c->fp_r17 || c->board_r44 != c->fp_r44)
    {
        snprintf(msg, sizeof(msg), "🔧 Placa sustituida unit_id=%d: fw %d.%d id %04X-%04X-%04X-%04X → fw %d.%d id %04X-%04X-%04X-%04X",
            c->unit_id, c->fp_fw >> 8, c->fp_fw & 0xFF, c->fp_r10, c->fp_r16, c->fp_r17, c->fp_r44, c->board_fw >> 8, c->board_fw & 0xFF, c->board_r10, c->board_r16, c->board_r17, c->board_r44);
        c->need_resync = 1;                                     // placa nueva: arranca con valores por defecto
        c->hb_fail = 0;
        c->hb_disabled = 0;                                     // la nueva puede aceptar heartbeat
        c->comms_events = 0;                                    // el corte del cambio de placa no cuenta
        ft_save_comms_state(smartgreen, i);       
    }
    else
        return;                                                 

    db_save_error(smartgreen, c->unit_id, msg);
    printf("[PLACA] %s\n", msg); fflush(stdout);
    c->fp_fw = c->board_fw;
    c->fp_r10 = c->board_r10;
    c->fp_r16 = c->board_r16;
    c->fp_r17 = c->board_r17;
    c->fp_r44 = c->board_r44;
    snprintf(sql, sizeof(sql), "UPDATE cooler_state SET board_fw=%d, board_r10=%d, board_r16=%d, board_r17=%d, board_r44=%d WHERE unit_id=%d", c->fp_fw, c->fp_r10, c->fp_r16, c->fp_r17, c->fp_r44, c->unit_id);
    sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
}

void    ft_check_comms(t_smartgreen *smartgreen, int i, time_t now)
{
    static int      lost_s = -1;
    t_cooler_state  *c = &smartgreen->coolers[i];
    char            msg[256];
    time_t          ref;
    int             answering;

    if (smartgreen->setup_mode)
        return;
    if (lost_s == -1)
    {
        lost_s = db_read_config(smartgreen, "comms_lost_seconds");
        if (lost_s <= 0)
            lost_s = COMMS_LOST_SECONDS;
    }
    if (c->watch_since == 0)
        c->watch_since = now;                           // empezamos a vigilar (arranque o setup)

    // ¿Ha contestado la placa DE VERDAD hace poco? (lectura real, no el arranque)
    answering = (c->last_ok_read != 0 && now - c->last_ok_read < lost_s);
    ref = c->last_ok_read ? c->last_ok_read : c->watch_since;

    if (!c->comms_lost && !answering && now - ref >= lost_s)
    {
        // Corte NUEVO (si venía cortado antes del reinicio, comms_lost ya es 1 y no se cuenta otra vez)
        if (now - c->comms_events_since > COMMS_WINDOW)
        {
            c->comms_events = 0;
            c->comms_events_since = now;
        }
        c->comms_events++;
        c->comms_lost = 1;
        c->comms_lost_since = ref;
        ft_save_comms_state(smartgreen, i);
        if (c->comms_events >= COMMS_MAX_EVENTS)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d cortes de comunicacion repetidos (%d en 24 h) — revisar cable o placa",
                c->unit_id, c->comms_events);
            ft_cooler_fault(smartgreen, i, msg, 1);
        }
        else
        {
            snprintf(msg, sizeof(msg), "🔴 Sin comunicacion con la placa unit_id=%d (corte %d/%d en 24 h)",
                c->unit_id, c->comms_events, COMMS_MAX_EVENTS);
            db_save_error(smartgreen, c->unit_id, msg);
            printf("[COMMS] %s\n", msg); fflush(stdout);
        }
    }
    else if (c->comms_lost && answering)               // vuelve a contestar (lectura real)
    {
        time_t since = c->comms_lost_since ? c->comms_lost_since : c->watch_since;

        c->comms_lost = 0;
        c->need_resync = 1;                             // pudo perder tensión: reenviar estado
        ft_save_comms_state(smartgreen, i);
        snprintf(msg, sizeof(msg), "🟢 Comunicacion recuperada con la placa unit_id=%d tras %ld s",
            c->unit_id, (long)(now - since));
        db_save_error(smartgreen, c->unit_id, msg);
        printf("[COMMS] %s\n", msg); fflush(stdout);
    }
}

// Aviso amarillo: el cooler solo puede funcionar en modo FAN hasta que el técnico rearme
void    ft_cooler_warning(t_smartgreen *smartgreen, int cooler_idx, const char *msg, int is_pump)
{
    t_cooler_state  *c = &smartgreen->coolers[cooler_idx];
    char            sql[128];

    db_save_error(smartgreen, c->unit_id, msg);
    printf("[AVISO] %s\n", msg); fflush(stdout);

    pthread_mutex_lock(&smartgreen->data_mutex);
    if (is_pump)
        c->fault_pump = 1;
    else
        c->fault_solenoid = 1;
    pthread_mutex_unlock(&smartgreen->data_mutex);

    snprintf(sql, sizeof(sql), "UPDATE cooler_state SET %s=1 WHERE unit_id=%d", is_pump ? "fault_pump" : "fault_solenoid", c->unit_id);
    sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);

    // Cerrar el agua: bomba OFF, solenoide OFF, drenaje cerrado, fan 0
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, c->unit_id, 50, REG50_SOLENOID_OFF);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, c->unit_id, 51, 0);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, c->unit_id, 52, 0);
}

// 1 si algún cooler de la zona tiene un aviso que obliga a modo FAN
int     ft_zone_fan_only(t_smartgreen *smartgreen, int zone_id)
{
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id
            && (smartgreen->coolers[i].fault_solenoid || smartgreen->coolers[i].fault_pump))
            return (1);
    return (0);
}

void    ft_cooler_fault(t_smartgreen *smartgreen, int cooler_idx, const char *msg, int grave)
{
    t_cooler_state  *c = &smartgreen->coolers[cooler_idx];
    int             z = ft_find_zone(smartgreen, c->zone_id);
    int             healthy = 0;
    char            sql[128];

    db_save_error(smartgreen, c->unit_id, msg);
    printf("[AVERIA%s] %s\n", grave ? " GRAVE" : "", msg); fflush(stdout);

    ft_cooler_onoff(smartgreen, c->unit_id, 0);         // primero apagar ESTE cooler

    pthread_mutex_lock(&smartgreen->data_mutex);
    c->alarm_fault = 1;
    c->last_off = get_timestamp();
    if (grave)
        c->broken_cooler = 1;
    // Zona OFF solo si no queda ningún cooler sano en ella
    for (int j = 0; j < smartgreen->num_coolers; j++)
        if (smartgreen->coolers[j].zone_id == c->zone_id && !smartgreen->coolers[j].broken_cooler)
            healthy++;
    if (z != -1 && healthy == 0)
    {
        ft_strcpy(smartgreen->zone_params[z].on_off, "OFF", sizeof(smartgreen->zone_params->on_off));
        db_update_zone_params(smartgreen, &smartgreen->zone_params[z]);
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);

    if (grave)
    {
        snprintf(sql, sizeof(sql), "UPDATE cooler_state SET broken_cooler=1, last_off=%ld WHERE unit_id=%d", (long)c->last_off, c->unit_id);
        sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
    }
}

void    ft_check_alarms(t_smartgreen *smartgreen)
{
    time_t              warranty_end;
    time_t              now = get_timestamp();
    char                msg[256];
    t_drain_args        *drain_args = NULL;
    static int          sal_trigger = -1;           // leídos UNA vez: tras cambiar la config se reinicia el controlador
    static int          sal_drain_type = -1;
    static int          nowater_s = -1;

    if (sal_trigger == -1)
    {
        sal_trigger    = db_read_config(smartgreen, "salinity_trigger");
        sal_drain_type = db_read_config(smartgreen, "drain_type");
        if (sal_trigger <= 0)
            sal_trigger = 4275;
    }

      if (nowater_s == -1)
    {
        nowater_s = db_read_config(smartgreen, "no_water_fault_seconds");
        if (nowater_s <= 0)
            nowater_s = nowater_s;
    }

    // Alarma Modbus (puerto serie)
    if (!smartgreen->modbus_ctx && !g_alarm_modbus)
    {
        db_save_error(smartgreen, 0, "🔴 CRITICO: Sin comunicacion Modbus");
        g_alarm_modbus = 1;
    }
    else if (smartgreen->modbus_ctx && g_alarm_modbus)
        g_alarm_modbus = 0;

    // Coolers
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        // Comunicación y placa: primero, porque sin comunicación el resto de datos son viejos
        ft_check_comms(smartgreen, i, now);
        if (smartgreen->coolers[i].comms_lost)
            continue;
        ft_check_board(smartgreen, i);

        int z = ft_find_zone(smartgreen, smartgreen->coolers[i].zone_id);
        int zone_on = (z != -1 && strcmp(smartgreen->zone_params[z].on_off, "ON") == 0);
        int with_water = zone_on                                                        // funcionando CON agua
            && strcmp(smartgreen->zone_params[z].cool_fan_mode, "FAN") != 0
            && strcmp(smartgreen->zone_params[z].cool_fan_mode, "IMD") != 0
            && strcmp(smartgreen->zone_params[z].prewet_in_progress, "yes") != 0
            && smartgreen->coolers[i].pump_on;

        warranty_end = smartgreen->coolers[i].install_date + (smartgreen->coolers[i].warranty_months * 30 * 24 * 3600);

        // 🟡 Salinidad alta → renovar agua (solo si drain_type = por salinidad)
        if (with_water
            && sal_drain_type == 0
            && smartgreen->coolers[i].water_present
            && smartgreen->coolers[i].salinity_us >= sal_trigger
            && !smartgreen->coolers[i].alarm_salinity)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Salinidad alta cooler unit_id=%d (%.1f uS)", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].salinity_us);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_salinity = 1;
            drain_args = malloc(sizeof(t_drain_args));
            if (drain_args)
            {
                drain_args->smartgreen = smartgreen;
                drain_args->unit_id = smartgreen->coolers[i].unit_id;
                drain_args->zone_id = smartgreen->coolers[i].zone_id;
                drain_args->reason = DRAIN_SALINITY;
                pthread_t   tid;
                pthread_create(&tid, NULL, ft_drain_thread, drain_args);
                pthread_detach(tid);
            }
        }
        else if ((!smartgreen->coolers[i].water_present || smartgreen->coolers[i].salinity_us < sal_trigger) && smartgreen->coolers[i].alarm_salinity)
            smartgreen->coolers[i].alarm_salinity = 0;          // rearme: la salinidad ha bajado

        // 🟡 Sin agua — solo cuando DEBERÍA haberla (funcionando con bomba, sin FAN/IMD/prewet)
        if (with_water && smartgreen->coolers[i].salinity_us < 10.0 && !smartgreen->coolers[i].alarm_water)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Sin agua cooler unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_water = 1;
        }
        else if ((smartgreen->coolers[i].salinity_us >= 10.0 || !with_water) && smartgreen->coolers[i].alarm_water)
            smartgreen->coolers[i].alarm_water = 0;

        // 🟡 Sin agua MANTENIDO funcionando → proteger la bomba (no se distingue corte de agua de sensor roto)
        if (with_water && smartgreen->coolers[i].salinity_us < 10.0)
        {
            if (smartgreen->coolers[i].no_water_since == 0)
                smartgreen->coolers[i].no_water_since = now;
            else if (now - smartgreen->coolers[i].no_water_since >= NO_WATER_FAULT_SECONDS && !smartgreen->coolers[i].fault_solenoid)
            {
                snprintf(msg, sizeof(msg), "🟡 AVISO: Cooler unit_id=%d sin agua %d s funcionando — revisar suministro, solenoide y sensor de agua. Solo modo FAN",
                    smartgreen->coolers[i].unit_id, NO_WATER_FAULT_SECONDS);
                ft_cooler_warning(smartgreen, i, msg, 0);          // para la bomba y cierra el agua
                // La zona sigue encendida, pero solo ventilando (igual que en el prewet)
                pthread_mutex_lock(&smartgreen->data_mutex);
                ft_strcpy(smartgreen->zone_params[z].cool_fan_mode, "FAN", sizeof(smartgreen->zone_params->cool_fan_mode));
                smartgreen->zone_params[z].pump_on = 0;
                if (smartgreen->zone_params[z].fan_speed_cmd <= 0)
                    smartgreen->zone_params[z].fan_speed_cmd = 3;
                db_update_zone_params(smartgreen, &smartgreen->zone_params[z]);
                pthread_mutex_unlock(&smartgreen->data_mutex);
                smartgreen->coolers[i].no_water_since = 0;
            }
        }
        else
            smartgreen->coolers[i].no_water_since = 0;              // hay agua o no se espera: reiniciar

        // 🔴 Garantía vencida  (pendiente: pasará a información, no alarma)
        if (now > warranty_end && !smartgreen->coolers[i].alarm_warranty)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Garantía vencida unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_warranty = 1;
        }
        // 🟡 Garantía próxima a vencer
        else if (now <= warranty_end && warranty_end - now < 30 * 24 * 3600 && !smartgreen->coolers[i].alarm_warranty)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Garantía vence en menos de 30 días unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_warranty = 1;
        }
    }

    // Sensores
    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        int     is_ext = (strcmp(smartgreen->sensors[i].type, "EXT") == 0);
        float   tmin = is_ext ? -30.0f : 0.0f;          // exterior: puede helar
        float   tmax = is_ext ?  60.0f : 50.0f;

        // 🔴 sensor sin señal
        if (!smartgreen->sensors[i].valid && !smartgreen->sensors[i].alarm_signal)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Sensor sin señal sensor_id=%d", smartgreen->sensors[i].sensor_id);
            db_save_error(smartgreen, smartgreen->sensors[i].sensor_id, msg);
            smartgreen->sensors[i].alarm_signal = 1;
        }
        else if (smartgreen->sensors[i].valid && smartgreen->sensors[i].alarm_signal)
            smartgreen->sensors[i].alarm_signal = 0;

        // 🟡 temperatura fuera de rango
        if (smartgreen->sensors[i].valid && (smartgreen->sensors[i].temperature < tmin || smartgreen->sensors[i].temperature > tmax) && !smartgreen->sensors[i].alarm_temp)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Temperatura fuera de rango sensor_id=%d (%.1f C)",
                     smartgreen->sensors[i].sensor_id, smartgreen->sensors[i].temperature);
            db_save_error(smartgreen, smartgreen->sensors[i].sensor_id, msg);
            smartgreen->sensors[i].alarm_temp = 1;
        }
        else if ((!smartgreen->sensors[i].valid || (smartgreen->sensors[i].temperature >= tmin && smartgreen->sensors[i].temperature <= tmax)) && smartgreen->sensors[i].alarm_temp)
            smartgreen->sensors[i].alarm_temp = 0;
    }
}
