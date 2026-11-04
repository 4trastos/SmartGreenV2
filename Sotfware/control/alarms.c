#include "../incl/smartgreen.h"

void    db_save_cooler_waits(t_smartgreen *smartgreen, int i)
{
    char            sql[160];
    t_cooler_state  *c = &smartgreen->coolers[i];

    snprintf(sql, sizeof(sql), "UPDATE cooler_state SET prewet_wait=%d, run_wait=%d WHERE unit_id=%d",
        c->prewet_wait, c->run_wait, c->unit_id);
    sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
}

int     ft_cooler_silent(t_cooler_state *c)
{
    time_t ref;

    if (c->comms_lost)
        return (1);
    ref = c->last_ok_read ? c->last_ok_read : c->watch_since;
    if (!ref || !c->last_try_read)
        return (0);
    return (c->last_try_read - ref > 5);
}

// Guarda el estado de comunicación en la BD (sobrevive a reinicios del controlador)
void    ft_save_comms_state(t_smartgreen *smartgreen, int i)
{
    char            sql[400];
    t_cooler_state  *c = &smartgreen->coolers[i];

    snprintf(sql, sizeof(sql),
        "UPDATE cooler_state SET comms_lost=%d, comms_events=%d, comms_events_since=%ld, power_events=%d, power_events_since=%ld, "
        "water_stops=%d, water_stops_since=%ld WHERE unit_id=%d",
        c->comms_lost, c->comms_events, (long)c->comms_events_since, c->power_events, (long)c->power_events_since,
        c->water_stops, (long)c->water_stops_since, c->unit_id);
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

// Tiempo sin respuesta para dar por perdida la comunicación (config, por defecto 60 s)
static int  ft_lost_seconds(t_smartgreen *smartgreen)
{
    static int lost_s = -1;

    if (lost_s == -1)
    {
        lost_s = db_read_config(smartgreen, "comms_lost_seconds");
        if (lost_s <= 0)
            lost_s = COMMS_LOST_SECONDS;
    }
    return (lost_s);
}

// Cuenta un evento en una ventana de 24 h; devuelve cuántos lleva
static int  ft_count_event(int *events, time_t *since, time_t now)
{
    if (now - *since > COMMS_WINDOW)
    {
        *events = 0;
        *since = now;
    }
    return (++(*events));
}

// Salidas de UN evaporativo, saltándose el control de su zona
static void ft_water_outputs(t_smartgreen *smartgreen, int unit, int r50)
{
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE_USER, unit, 51, 0);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE_USER, unit, 52, 0);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE_USER, unit, 50, r50);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE_USER, unit, 49, REG49_APAGADO);
}

void    ft_check_water(t_smartgreen *smartgreen, int i, time_t now)
{
    static int      detect_s = -1, refill_s = -1, wet_s = -1;
    t_cooler_state  *c = &smartgreen->coolers[i];
    int             z = ft_find_zone(smartgreen, c->zone_id);
    char            msg[256];

    if (detect_s == -1)
    {
        detect_s = db_read_config(smartgreen, "water_detect_seconds");
        refill_s = db_read_config(smartgreen, "no_water_fault_seconds");
        wet_s    = db_read_config(smartgreen, "prewet_delay_water");
        if (detect_s <= 0) detect_s = 20;
        if (refill_s <= 0) refill_s = 120;
        if (wet_s <= 0)    wet_s = 30;
    }
    int wait_s = (c->run_wait > 0) ? c->run_wait : refill_s;     // espera de este evaporativo
    if (z == -1 || c->broken_cooler)
        return;

    // Si apagan la zona (o este evaporativo) durante la parada: cerrar el agua y salir de la parada
    if (c->water_stop && (strcmp(smartgreen->zone_params[z].on_off, "ON") != 0 || c->user_off))
    {
        c->water_stop = 0;
        c->no_water_since = 0;
        ft_water_outputs(smartgreen, c->unit_id, REG50_SOLENOID_OFF);   // solenoide cerrado, todo parado
        printf("[AGUA] Evaporativo unit_id=%d: parada de agua cancelada (apagado)\n", c->unit_id); fflush(stdout);
        return;
    }

    // ── 1: parado, esperando el agua ──
    if (c->water_stop == 1)
    {
        if (c->salinity_us >= 10.0f)
        {
            int n = ft_count_event(&c->water_stops, &c->water_stops_since, now);

            ft_save_comms_state(smartgreen, i);
            if (n >= COMMS_MAX_EVENTS)
            {
                c->water_stop = 0;                              // antes de ft_cooler_fault, para que sus órdenes pasen
                snprintf(msg, sizeof(msg), "🔴 CRITICO: Evaporativo unit_id=%d se queda sin agua repetidamente (%d paradas en 24 h) — "
                    "CAUDAL INSUFICIENTE: revise la presion del suministro, el filtro y el solenoide", c->unit_id, n);
                ft_cooler_fault(smartgreen, i, msg, 1);
                return;
            }
            c->water_stop = 2;                                  // agua de vuelta: mojar paneles antes de arrancar
            c->water_stop_since = now;
            snprintf(msg, sizeof(msg), "🟡 Evaporativo unit_id=%d: vuelve el agua (parada %d/%d en 24 h), reanudando",
                c->unit_id, n, COMMS_MAX_EVENTS);
            db_save_error(smartgreen, c->unit_id, msg);
            printf("[AGUA] %s\n", msg); fflush(stdout);
        }
        else if (now - c->water_stop_since >= wait_s)
        {
            c->water_stop = 0;
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Evaporativo unit_id=%d NO LLEGA AGUA en %d s — revise el suministro, el solenoide y el sensor de agua",
                c->unit_id, wait_s);
            ft_cooler_fault(smartgreen, i, msg, 1);
        }
        return;
    }

    // ── 2: agua de vuelta, mojando los paneles (solenoide abierto) ──
    if (c->water_stop == 2)
    {
        if (now - c->water_stop_since >= wet_s)
        {
            c->water_stop = 0;
            c->no_water_since = 0;
            c->need_resync = 1;                                 // el control de su zona vuelve a arrancarlo
            printf("[AGUA] Evaporativo unit_id=%d reanudado\n", c->unit_id); fflush(stdout);
        }
        return;
    }

    // ── 0: funcionando. ¿Debería haber agua? ──
    int with_water = strcmp(smartgreen->zone_params[z].on_off, "ON") == 0
        && smartgreen->zone_params[z].pump_on                  // bomba ordenada (en AUTO la decide el control de humedad)
        && strcmp(smartgreen->zone_params[z].cool_fan_mode, "FAN") != 0
        && strcmp(smartgreen->zone_params[z].cool_fan_mode, "IMD") != 0
        && strcmp(smartgreen->zone_params[z].prewet_in_progress, "yes") != 0
        && !c->imd && !c->user_off && !c->draining && !c->comms_lost;

    if (!with_water || c->salinity_us >= 10.0f)
    {
        c->no_water_since = 0;
        return;
    }
    if (c->no_water_since == 0)
    {
        c->no_water_since = now;
        return;
    }
    if (now - c->no_water_since < detect_s)
        return;

    // Sin agua 20 s seguidos: PARADA (proteger la bomba y no meter aire caliente)
    c->water_stop = 1;
    c->water_stop_since = now;
    c->no_water_since = 0;
    ft_water_outputs(smartgreen, c->unit_id, REG50_SOLENOID_ON);   // R50=24: solenoide abierto, drenaje cerrado, bomba y fan parados
    snprintf(msg, sizeof(msg), "🟡 Evaporativo unit_id=%d sin agua: parado, intentando llenar (%d s)", c->unit_id, wait_s);
    db_save_error(smartgreen, c->unit_id, msg);
    printf("[AGUA] %s\n", msg); fflush(stdout);

    // ¿Se han quedado sin agua TODOS los evaporativos que funcionan? → corte del suministro general
    int total = 0, stopped = 0;
    for (int k = 0; k < smartgreen->num_coolers; k++)
    {
        if (smartgreen->coolers[k].broken_cooler || smartgreen->coolers[k].user_off || smartgreen->coolers[k].comms_lost)
            continue;
        total++;
        if (smartgreen->coolers[k].water_stop == 1)
            stopped++;
    }
    if (total > 1 && stopped == total)
    {
        db_save_error(smartgreen, 0, "🟡 Ningun evaporativo recibe agua: posible CORTE DEL SUMINISTRO GENERAL (llave de paso)");
        printf("[AGUA] Ningun evaporativo recibe agua: posible corte del suministro general\n"); fflush(stdout);
    }
}

// ¿Ningún equipo del bus contesta? (todos los coolers sin respuesta y todos los sensores fallando)
// Con menos de 2 equipos no se puede distinguir un fallo del bus de uno de la placa
static int  ft_all_silent(t_smartgreen *smartgreen)
{
    if (smartgreen->num_coolers + smartgreen->num_sensors < 2 || smartgreen->num_coolers == 0)
        return (0);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (!ft_cooler_silent(&smartgreen->coolers[i]))
            return (0);
    for (int s = 0; s < smartgreen->num_sensors; s++)
        if (smartgreen->sensors[s].error_count == 0)
            return (0);
    return (1);
}

// FALLO DEL BUS: caen todos los equipos a la vez → el problema es el cable común o la conexión al controlador.
// Un solo aviso, y NO se suma corte a ninguna placa (si no, un cable defectuoso dejaría todos los equipos averiados)
void    ft_check_bus(t_smartgreen *smartgreen, time_t now)
{
    char    msg[256];
    int     silent = ft_all_silent(smartgreen);

    if (smartgreen->setup_mode)
        return;
    if (!smartgreen->bus_lost && silent)
    {
        time_t newest = 0;

        for (int i = 0; i < smartgreen->num_coolers; i++)
        {
            t_cooler_state *c = &smartgreen->coolers[i];
            time_t ref = c->last_ok_read ? c->last_ok_read : c->watch_since;
            if (ref > newest)
                newest = ref;
        }
        if (newest && now - newest < ft_lost_seconds(smartgreen))
            return;                                             // todavía no ha pasado el tiempo de aviso
        smartgreen->bus_lost = 1;
        smartgreen->bus_lost_since = newest;
        for (int i = 0; i < smartgreen->num_coolers; i++)
        {
            t_cooler_state *c = &smartgreen->coolers[i];
            c->lost_in_bus = 1;
            if (!c->comms_lost)
            {
                c->comms_lost = 1;
                c->comms_lost_since = c->last_ok_read ? c->last_ok_read : c->watch_since;
            }
            ft_save_comms_state(smartgreen, i);
        }
        int n = ft_count_event(&smartgreen->bus_events, &smartgreen->bus_events_since, now);
        db_update_config(smartgreen, "bus_events", smartgreen->bus_events);
        db_update_config(smartgreen, "bus_events_since", (int)smartgreen->bus_events_since);
        snprintf(msg, sizeof(msg), "🔴 Sin comunicacion con NINGUN equipo (corte %d/%d en 24 h) — revise el cable del bus y su conexion al controlador",
            n, COMMS_MAX_EVENTS);
        db_save_error(smartgreen, 0, msg);
        printf("[BUS] %s\n", msg); fflush(stdout);
        if (n >= COMMS_MAX_EVENTS)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Cortes de comunicacion repetidos en todo el sistema (%d en 24 h) — revise el cable del bus y su conexion al controlador", n);
            for (int i = 0; i < smartgreen->num_coolers; i++)
                ft_cooler_fault(smartgreen, i, msg, 1);
        }
    }
    else if (smartgreen->bus_lost && !silent)
    {
        smartgreen->bus_lost = 0;
        snprintf(msg, sizeof(msg), "🟢 Comunicacion con el bus recuperada tras %ld s", (long)(now - smartgreen->bus_lost_since));
        db_save_error(smartgreen, 0, msg);
        printf("[BUS] %s\n", msg); fflush(stdout);
    }
}

// Comunicación de UNA placa. La causa de un corte se sabe AL VOLVER:
//   - la placa se reinició (R27 sube) → se quedó SIN TENSIÓN
//   - no se reinició                  → fallo de COMUNICACIÓN (cable o conexión)
//   - cayó con todo el bus            → fallo del BUS (lo cuenta ft_check_bus, no la placa)
void    ft_check_comms(t_smartgreen *smartgreen, int i, time_t now)
{
    t_cooler_state  *c = &smartgreen->coolers[i];
    int             lost_s = ft_lost_seconds(smartgreen);
    char            msg[256];
    time_t          ref;
    int             answering;

    if (smartgreen->setup_mode)
        return;
    if (c->watch_since == 0)
        c->watch_since = now;
    answering = (c->last_ok_read != 0 && now - c->last_ok_read < lost_s);
    ref = c->last_ok_read ? c->last_ok_read : c->watch_since;

    // PÉRDIDA (si caen todos, no se avisa aquí: es un fallo del bus y lo gestiona ft_check_bus)
    if (!c->comms_lost && !answering && now - ref >= lost_s && !ft_all_silent(smartgreen))
    {
        c->comms_lost = 1;
        c->comms_lost_since = ref;
        c->lost_in_bus = 0;
        ft_save_comms_state(smartgreen, i);
        snprintf(msg, sizeof(msg), "🔴 Sin comunicacion con el evaporativo unit_id=%d — revise su cable y su alimentacion", c->unit_id);
        db_save_error(smartgreen, c->unit_id, msg);
        printf("[COMMS] %s\n", msg); fflush(stdout);
    }
    // RECUPERACIÓN: aquí se decide la causa y se cuenta
    else if (c->comms_lost && answering)
    {
        time_t  since = c->comms_lost_since ? c->comms_lost_since : c->watch_since;
        long    secs = (long)(now - since);
        int     rebooted = (c->prev_cold_starts >= 0 && c->cold_starts > c->prev_cold_starts);
        int     n;

        c->comms_lost = 0;
        c->need_resync = 1;                                     // pudo perder tensión o el estado: reenviar
        if (c->lost_in_bus)
        {
            c->lost_in_bus = 0;                                 // ya contado como fallo del bus
            printf("[COMMS] unit_id=%d recuperado tras %ld s (fallo del bus)\n", c->unit_id, secs); fflush(stdout);
        }
        else if (rebooted)
        {
            n = ft_count_event(&c->power_events, &c->power_events_since, now);
            snprintf(msg, sizeof(msg), "🟢 Evaporativo unit_id=%d recuperado tras %ld s: se quedo SIN TENSION (corte %d/%d en 24 h)",
                c->unit_id, secs, n, COMMS_MAX_EVENTS);
            db_save_error(smartgreen, c->unit_id, msg);
            printf("[COMMS] %s\n", msg); fflush(stdout);
            if (n >= COMMS_MAX_EVENTS)
            {
                snprintf(msg, sizeof(msg), "🔴 CRITICO: El evaporativo unit_id=%d se queda sin tension repetidamente (%d en 24 h) — revise su alimentacion y su placa",
                    c->unit_id, n);
                ft_cooler_fault(smartgreen, i, msg, 1);
            }
        }
        else
        {
            n = ft_count_event(&c->comms_events, &c->comms_events_since, now);
            snprintf(msg, sizeof(msg), "🟢 Evaporativo unit_id=%d recuperado tras %ld s: fallo de COMUNICACION, cable o conexion (corte %d/%d en 24 h)",
                c->unit_id, secs, n, COMMS_MAX_EVENTS);
            db_save_error(smartgreen, c->unit_id, msg);
            printf("[COMMS] %s\n", msg); fflush(stdout);
            if (n >= COMMS_MAX_EVENTS)
            {
                snprintf(msg, sizeof(msg), "🔴 CRITICO: Cortes de comunicacion repetidos con el evaporativo unit_id=%d (%d en 24 h) — revise su cable y sus conexiones",
                    c->unit_id, n);
                ft_cooler_fault(smartgreen, i, msg, 1);
            }
        }
        ft_save_comms_state(smartgreen, i);
    }
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
    
    ft_check_bus(smartgreen, now);

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
        int with_water = zone_on && !smartgreen->coolers[i].imd 
            && !smartgreen->coolers[i].user_off
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

        // 💧 Agua: parada, rellenado y averías A/B
        ft_check_water(smartgreen, i, now);

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
