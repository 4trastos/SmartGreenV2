#include "../incl/smartgreen.h"

// Huella: registra la placa la primera vez y detecta si la han sustituido
void    ft_check_board(t_smartgreen *smartgreen, int i)
{
    t_cooler_state  *c = &smartgreen->coolers[i];
    char            msg[256];
    char            sql[256];

    if (c->board_fw == 0)                                       // todavía sin leer
        return;
    if (c->fp_fw == 0 && c->fp_r10 == 0 && c->fp_r17 == 0 && c->fp_r44 == 0)
    {
        snprintf(msg, sizeof(msg), "🔧 Placa registrada unit_id=%d (fw %d.%d, id %04X-%04X-%04X-%04X)",
            c->unit_id, c->board_fw >> 8, c->board_fw & 0xFF, c->board_r10, c->board_r16, c->board_r17, c->board_r44);
    }
    else if (c->board_fw != c->fp_fw || c->board_r10 != c->fp_r10 || c->board_r16 != c->fp_r16
          || c->board_r17 != c->fp_r17 || c->board_r44 != c->fp_r44)
    {
        snprintf(msg, sizeof(msg), "🔧 Placa sustituida unit_id=%d: fw %d.%d id %04X-%04X-%04X-%04X → fw %d.%d id %04X-%04X-%04X-%04X",
            c->unit_id, c->fp_fw >> 8, c->fp_fw & 0xFF, c->fp_r10, c->fp_r16, c->fp_r17, c->fp_r44,
            c->board_fw >> 8, c->board_fw & 0xFF, c->board_r10, c->board_r16, c->board_r17, c->board_r44);
        c->need_resync = 1;                                     // placa nueva: arranca con valores por defecto
        c->hb_fail = 0;
        c->hb_disabled = 0;                                     // la nueva puede aceptar heartbeat
        c->comms_events = 0;                                    // el corte del cambio de placa no cuenta
    }
    else
        return;                                                 // la misma placa de siempre

    db_save_error(smartgreen, c->unit_id, msg);
    printf("[PLACA] %s\n", msg); fflush(stdout);
    c->fp_fw = c->board_fw;   c->fp_r10 = c->board_r10;   c->fp_r16 = c->board_r16;
    c->fp_r17 = c->board_r17; c->fp_r44 = c->board_r44;
    snprintf(sql, sizeof(sql), "UPDATE cooler_state SET board_fw=%d, board_r10=%d, board_r16=%d, board_r17=%d, board_r44=%d WHERE unit_id=%d",
        c->fp_fw, c->fp_r10, c->fp_r16, c->fp_r17, c->fp_r44, c->unit_id);
    sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
}

// Comunicación: aviso tras COMMS_LOST_SECONDS; se quita sola; cortes repetidos → avería grave
void    ft_check_comms(t_smartgreen *smartgreen, int i, time_t now)
{
    t_cooler_state  *c = &smartgreen->coolers[i];
    char            msg[256];
    time_t          ref;

    if (c->last_ok_read == 0)
        c->last_ok_read = now;          // sin lecturas aún (arranque, setup o recarga): empezar a contar desde ahora
    ref = c->last_ok_read;

    if (!c->comms_lost && now - ref >= COMMS_LOST_SECONDS)
    {
        if (now - c->comms_events_since > COMMS_WINDOW)
        {
            c->comms_events = 0;
            c->comms_events_since = now;
        }
        c->comms_events++;
        c->comms_lost = 1;
        c->comms_lost_since = ref;
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
    else if (c->comms_lost && now - ref < COMMS_LOST_SECONDS)   // vuelve a contestar
    {
        c->comms_lost = 0;
        c->need_resync = 1;                                     // pudo perder tensión: reenviar estado
        snprintf(msg, sizeof(msg), "🟢 Comunicacion recuperada con la placa unit_id=%d tras %ld s",
            c->unit_id, (long)(now - c->comms_lost_since));
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

    if (sal_trigger == -1)
    {
        sal_trigger    = db_read_config(smartgreen, "salinity_trigger");
        sal_drain_type = db_read_config(smartgreen, "drain_type");
        if (sal_trigger <= 0)
            sal_trigger = 4275;
    }

    // Alarma Modbus
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
        ft_check_comms(smartgreen, i, now);
        if (smartgreen->coolers[i].comms_lost)
            continue;                           // sin comunicación: el resto de datos son viejos
        ft_check_board(smartgreen, i);

        int z = ft_find_zone(smartgreen, smartgreen->coolers[i].zone_id);
        int zone_on = (z != -1 && strcmp(smartgreen->zone_params[z].on_off, "ON") == 0);
        int with_water = zone_on                                                        // funcionando CON agua
            && strcmp(smartgreen->zone_params[z].cool_fan_mode, "FAN") != 0
            && strcmp(smartgreen->zone_params[z].cool_fan_mode, "IMD") != 0
            && strcmp(smartgreen->zone_params[z].prewet_in_progress, "yes") != 0
            && smartgreen->coolers[i].pump_on;

        warranty_end = smartgreen->coolers[i].install_date + (smartgreen->coolers[i].warranty_months * 30 * 24 * 3600);

        // // 🔴 Sin comunicación
        // if (smartgreen->coolers[i].error_count >= MAX_COOLER_ERRORS && !smartgreen->coolers[i].alarm_comms)
        // {
        //     snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d sin comunicacion (errors=%d)", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].error_count);
        //     db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
        //     smartgreen->coolers[i].alarm_comms = 1;
        // }
        // else if (smartgreen->coolers[i].error_count < MAX_COOLER_ERRORS && smartgreen->coolers[i].alarm_comms)
        //     smartgreen->coolers[i].alarm_comms = 0;

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

        // 🔴 Garantía vencida
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
        if (smartgreen->sensors[i].valid && (smartgreen->sensors[i].temperature < 0.0f || smartgreen->sensors[i].temperature > 50.0f) && !smartgreen->sensors[i].alarm_temp)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Temperatura fuera de rango sensor_id=%d (%.1f C)",
                     smartgreen->sensors[i].sensor_id, smartgreen->sensors[i].temperature);
            db_save_error(smartgreen, smartgreen->sensors[i].sensor_id, msg);
            smartgreen->sensors[i].alarm_temp = 1;
        }
        else if ((!smartgreen->sensors[i].valid || (smartgreen->sensors[i].temperature >= 0.0f && smartgreen->sensors[i].temperature <= 50.0f)) && smartgreen->sensors[i].alarm_temp)
            smartgreen->sensors[i].alarm_temp = 0;
    }
}