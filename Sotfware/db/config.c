#include "../incl/smartgreen.h"

void    ft_init_config(t_smartgreen *smartgreen)
{
    db_save_config(smartgreen, "num_coolers",               1);
    db_save_config(smartgreen, "num_sensors",               2);
    db_save_config(smartgreen, "num_zones",                 1);
    db_save_config(smartgreen, "water_manager",             0);                     // 0=ms, 1=tm, 2=nc, 3=nw
    db_save_config(smartgreen, "salinity_trigger",          SALINITY_TRIGGER);      // 0=4275 uS, 4=2305 uS
    db_save_config(smartgreen, "water_seal_opening_speed",  3);                     // valor × 16=0-15
    db_save_config(smartgreen, "prewet_selector",           1);                     // 0=no, 1=yes (256=yes)
    db_save_config(smartgreen, "auto_restart",              0);                     // 0=standby, 1=restart (512=restart)
    db_save_config(smartgreen, "temperature_unit",          0);                     // 0=C, 1=F (1024=F)
    db_save_config(smartgreen, "tank_drain_delay",          3);                     // 0=instant,1=3Hrs(4096=3Hrs),2=12Hrs(8192=12Hrs),3=3Days(12288=3Days)
    db_save_config(smartgreen, "refresh_interval",          5);
    db_save_config(smartgreen, "refresh_sensor_interval",   30); 
    db_save_config(smartgreen, "refresh_coolers",           30);
    db_save_config(smartgreen, "history_interval",          300);
    db_save_config(smartgreen, "salinity_drain_delay",      120);                   // tiempo total
    db_save_config(smartgreen, "salinity_drain_interval",   30);
    db_save_config(smartgreen, "prewet_delay_pump",         120);
    db_save_config(smartgreen, "prewet_delay_solenoid",     9);
    db_save_config(smartgreen, "prewet_delay_water",        30);
    db_save_config(smartgreen, "prewet_max_wait",           90);
    db_save_config(smartgreen, "prewet_check_interval",     30);
    db_save_config(smartgreen, "modbus_retries",            1);
    db_save_config(smartgreen, "num_schedulers",            1);                     // 0 por defecto, el técnico añade los que quiera
    db_save_config(smartgreen, "hours_running",             0);                     // segundos totales fan_on=1
    db_save_config(smartgreen, "install_date",              get_timestamp());       // timestamp instalación
    db_save_config(smartgreen, "warranty_months",           24);                    // meses de garantía
    db_save_config(smartgreen, "maint_plan",                0);                     // 0=solo cierre, 1=apertura+cierre
    db_save_config(smartgreen, "maint_legionella",          0);                     // 0=no, 1=si
    db_save_config(smartgreen, "maint_opening_date",        0);                     // timestamp apertura prevista
    db_save_config(smartgreen, "maint_closing_date",        0);                     // timestamp cierre previsto
    db_save_config(smartgreen, "maint_legionella_date",     0);                     // timestamp legionela prevista
    db_save_config(smartgreen, "free_cooling_temp",         0);                     // temperatura free cooling (0=desactivado)
    db_save_config(smartgreen, "min_setpoint_temp",         18);                    // temperatura mínima setpoint
    db_save_config(smartgreen, "max_setpoint_temp",         35);                    // temperatura máxima setpoint
    db_save_config(smartgreen, "min_setpoint_fan",          0);                     // velocidad mínima ventilador
    db_save_config(smartgreen, "max_setpoint_fan",          10);                    // velocidad máxima ventilador
    db_save_config(smartgreen, "min_setpoint_hum",          20);                    // humedad mínima setpoint
    db_save_config(smartgreen, "max_setpoint_hum",          85);                    // humedad máxima setpoint
    db_save_config(smartgreen, "broadcast_coolers",         0);                     // 0=individual, 1=broadcast
    db_save_config(smartgreen, "use_exterior_sensor",       1);                     // 0=no, 1=si
    db_save_config(smartgreen, "auto_libera_individual",    120);                   // segundos antes de liberar control individual
    db_save_config(smartgreen, "hours_show_errors",         12);                    // horas que se muestran errores
    db_save_config(smartgreen, "retry_fault_auto",          1);                     // 0=no, 1=si reintentar fault automáticamente
    db_save_config(smartgreen, "sensor_1_id",               175);                   // unit_id primer sensor
    db_save_config(smartgreen, "sensor_2_id",               177);
    db_save_config(smartgreen, "sensor_1_offset",           -4);                    // offset corrección
    db_save_config(smartgreen, "sensor_1_humidity_offset",  25);                    // offset correciión humnedad
    db_save_config(smartgreen, "sensor_2_offset",           0);
    db_save_config(smartgreen, "sensor_2_humidity_offset",  28);
    db_save_config(smartgreen, "last_repair",               0);
}

int ft_init_data(t_smartgreen *smartgreen)
{
    int i;
    int new_inst;

    smartgreen->coolers = NULL;
    if (smartgreen->num_coolers > 0)
    {
        i = 0;
        smartgreen->coolers = malloc(sizeof(t_cooler_state) * smartgreen->num_coolers);
        if (!smartgreen->coolers)
            return (-1);
        while (i < smartgreen->num_coolers)
        {
            smartgreen->coolers[i].unit_id = MODBUS_FIRST_COOLER + i;
            smartgreen->coolers[i].zone_id = 1;
            smartgreen->coolers[i].is_extractor = 0;
            smartgreen->coolers[i].error_count = 0;
            smartgreen->coolers[i].drain_valve_open = 0;
            smartgreen->coolers[i].drain_valve_confirm = 0;
            smartgreen->coolers[i].cool_mode_on = 0;
            smartgreen->coolers[i].fan_on = 0;
            smartgreen->coolers[i].fault_present = 0;
            smartgreen->coolers[i].inlet_valve_open = 0;
            smartgreen->coolers[i].actual_fan_speed = 0;
            smartgreen->coolers[i].fan_speed_confirmed = 0;
            smartgreen->coolers[i].most_recent_fault = 0;
            smartgreen->coolers[i].water_present = 0;
            smartgreen->coolers[i].pump_on = 0;
            smartgreen->coolers[i].solenoid_on = 0;
            smartgreen->coolers[i].salinity_ppm = 0.00;
            smartgreen->coolers[i].salinity_us = 0.00;
            smartgreen->coolers[i].last_read = 0;
            smartgreen->coolers[i].last_mod = 0;
            smartgreen->coolers[i].alarm_fault = 0;
            smartgreen->coolers[i].alarm_salinity = 0;
            smartgreen->coolers[i].alarm_water = 0;
            smartgreen->coolers[i].alarm_comms = 0;
            smartgreen->coolers[i].alarm_warranty = 0;
            smartgreen->coolers[i].alarm_maint_opening = 0;
            smartgreen->coolers[i].alarm_maint_closing = 0;
            smartgreen->coolers[i].alarm_maint_legionella = 0;
            smartgreen->coolers[i].hours_running = 0;
            smartgreen->coolers[i].install_date = get_timestamp();
            smartgreen->coolers[i].warranty_months = 24;
            smartgreen->coolers[i].disabled = 0;
            smartgreen->coolers[i].ramp_rate = 0;
            smartgreen->coolers[i].cold_starts = 0;
            smartgreen->coolers[i].fan_starts = 0;
            smartgreen->coolers[i].fan_hours = 0;
            smartgreen->coolers[i].tank_drains = 0;
            smartgreen->coolers[i].avg_tank_fill = 0;
            smartgreen->coolers[i].fan_speed_z1 = 0;
            smartgreen->coolers[i].fan_speed_z2 = 0;
            smartgreen->coolers[i].fan_speed_z3 = 0;
            smartgreen->coolers[i].fan_speed_z4 = 0;
            smartgreen->coolers[i].fan_speed_z5 = 0;
            smartgreen->coolers[i].extended_status = 0;
            smartgreen->coolers[i].modbus_addr = 0;
            smartgreen->coolers[i].r0_config = 0;
            smartgreen->coolers[i].prev_fan_starts = -1;
            smartgreen->coolers[i].fan_zero_ticks  = 0;
            smartgreen->coolers[i].fan_running  = 0;
            smartgreen->coolers[i].last_off = 0;

            if (db_save_cooler(smartgreen, &smartgreen->coolers[i]) == -1)
                return (-1);
            if (db_save_history(smartgreen, "CO", &smartgreen->coolers[i], NULL) == -1)
                return (-1);
            i++;
        }
    }

    smartgreen->sensors = NULL;
    if (smartgreen->num_sensors > 0)
    {
        i = 0;
        smartgreen->sensors = malloc(sizeof(t_sensor_state) * smartgreen->num_sensors);
        if (!smartgreen->sensors)
            return (-1);
        while (i < smartgreen->num_sensors)
        {
            if (i == 0)
            {
                smartgreen->sensors[i].sensor_id = db_read_config(smartgreen, "sensor_1_id");
                ft_strcpy(smartgreen->sensors[i].type, "INT", sizeof(smartgreen->sensors->type));
                ft_strcpy(smartgreen->sensors[i].name, "Interior", sizeof(smartgreen->sensors->name));
                smartgreen->sensors[i].offset_val = db_read_config(smartgreen, "sensor_1_offset");
                smartgreen->sensors[i].humidity_offset_val = db_read_config(smartgreen, "sensor_1_humidity_offset");
            }
            else if (i == 1)
            {
                smartgreen->sensors[i].sensor_id = db_read_config(smartgreen, "sensor_2_id");
                ft_strcpy(smartgreen->sensors[i].type, "EXT", sizeof(smartgreen->sensors->type));
                ft_strcpy(smartgreen->sensors[i].name, "Exterior", sizeof(smartgreen->sensors->name));
                smartgreen->sensors[i].offset_val = db_read_config(smartgreen, "sensor_2_offset");
                smartgreen->sensors[i].humidity_offset_val = db_read_config(smartgreen, "sensor_2_humidity_offset");
            }
            smartgreen->sensors[i].zone_id = 1;
            smartgreen->sensors[i].temperature = -200.00;
            smartgreen->sensors[i].humidity = -200.00;
            smartgreen->sensors[i].flags = 0;
            smartgreen->sensors[i].valid = 0;
            smartgreen->sensors[i].error_count = 0;
            smartgreen->sensors[i].last_read = 0;
            smartgreen->sensors[i].last_mod = get_timestamp();
            smartgreen->sensors[i].alarm_signal = 0;
            smartgreen->sensors[i].alarm_temp = 0;
            smartgreen->sensors[i].disabled = 0;
        
            if (db_save_sensor(smartgreen, &smartgreen->sensors[i]) == -1)
                return (-1);
            if (db_save_sensor_zone(smartgreen, &smartgreen->sensors[i]) == -1)
                return (-1);
            if (db_save_history(smartgreen, "SE", NULL, &smartgreen->sensors[i]) == -1)
                return (-1);    
            i++;
        } 
    }

    smartgreen->zone_params = NULL;
    if (smartgreen->num_zones > 0)
    {
        i = 0;
        smartgreen->zones = malloc(sizeof(t_zones) * smartgreen->num_zones);
        if (!smartgreen->zones)
            return (-1);
        smartgreen->zone_params = malloc(sizeof(t_zone_params) * smartgreen->num_zones);
        if (!smartgreen->zone_params)
            return(-1);
        while (i < smartgreen->num_zones)
        {
            smartgreen->zone_params[i].zone_id = i + 1;
            smartgreen->zone_params[i].fan_speed_cmd = 3;
            smartgreen->zone_params[i].target_temp = 20.0;
            smartgreen->zone_params[i].humidity_min = 60.0;
            smartgreen->zone_params[i].humidity_max = 85.0;
            smartgreen->zone_params[i].integral = 00.0;
            smartgreen->zone_params[i].pump_on = 0;
            smartgreen->zone_params[i].humidity_control = 0;
            ft_strcpy(smartgreen->zone_params[i].cool_fan_mode, "AUTO", sizeof(smartgreen->zone_params->cool_fan_mode));
            ft_strcpy(smartgreen->zone_params[i].drain_valve, "close", sizeof(smartgreen->zone_params->drain_valve));
            ft_strcpy(smartgreen->zone_params[i].solenoid, "on", sizeof(smartgreen->zone_params->solenoid));
            ft_strcpy(smartgreen->zone_params[i].on_off, "OFF", sizeof(smartgreen->zone_params->on_off));
            ft_strcpy(smartgreen->zone_params[i].inmediate_drain, "no", sizeof(smartgreen->zone_params->inmediate_drain));
            ft_strcpy(smartgreen->zone_params[i].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
            smartgreen->zone_params[i].last_prewet = 0;
            smartgreen->zone_params[i].last_drain = 0;
            smartgreen->zone_params[i].last_pump_time = 0;

            smartgreen->zones[i].id = smartgreen->zone_params[i].zone_id;
            ft_strcpy(smartgreen->zones[i].name, "Zona de Prueba", sizeof(smartgreen->zones[i].name));
            smartgreen->zones[i].enabled = 1;

            if (db_save_zone_params(smartgreen, &smartgreen->zone_params[i]) == -1)
                return (-1);
            if (db_save_zones(smartgreen, &smartgreen->zones[i]) == -1)
                return (-1);
            i++;
        }
    }

    smartgreen->scheduler = NULL;
    if (smartgreen->num_schedulers > 0)
    {
        i = 0;
        smartgreen->scheduler = malloc(sizeof(t_scheduler_entry) * smartgreen->num_schedulers);
        if (!smartgreen->scheduler)
            return (-1);

        new_inst = db_read_config(smartgreen, "new_installation");

        while (i < smartgreen->num_schedulers)
        {
            smartgreen->scheduler[i].id = i + 1;
            ft_strcpy(smartgreen->scheduler[i].name, "PROGRAMADOR", sizeof(smartgreen->scheduler->name));
            smartgreen->scheduler[i].zone_id = i + 1;
            smartgreen->scheduler[i].active = 1;
            ft_strcpy(smartgreen->scheduler[i].action, "ON", sizeof(smartgreen->scheduler->action));
            ft_strcpy(smartgreen->scheduler[i].hour, "08:00", sizeof(smartgreen->scheduler->hour));
            smartgreen->scheduler[i].mon = 0;
            smartgreen->scheduler[i].tue = 0;
            smartgreen->scheduler[i].wed = 0;
            smartgreen->scheduler[i].thu = 0;
            smartgreen->scheduler[i].fri = 0;
            smartgreen->scheduler[i].sat = 0;
            smartgreen->scheduler[i].sun = 0;
            ft_strcpy(smartgreen->scheduler[i].mode, "AUTO", sizeof(smartgreen->scheduler->mode));
            smartgreen->scheduler[i].target_temp = 0.00;

            if (new_inst != 1)
                if (db_save_scheduler(smartgreen, &smartgreen->scheduler[i]) == -1)
                    return (-1);
            i++;
        }
    }
    
    if (new_inst != 1)
        db_save_config(smartgreen, "new_installation", 1);
    return (0);
}

int db_read_config(t_smartgreen *smartgreen, const char *key)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT value FROM config WHERE key = ?;";
    int             rc;
    int             result = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "db_read_config prepare error: %s\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_text(stmt, 1, key, -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW)
        result = sqlite3_column_int(stmt, 0);
    else
        result = -1;
    sqlite3_finalize(stmt);
    return (result);
}

void    ft_init_struct(t_smartgreen *smartgreen)
{
    smartgreen->num_coolers = db_read_config(smartgreen, "num_coolers");
    if (smartgreen->num_coolers < 0)
        smartgreen->num_coolers = 0;
    if (smartgreen->num_coolers > MODBUS_MAX_COOLERS)
    {
        fprintf(stderr, "ERROR: num_coolers (%d) exceeds the maximum allowed (%d)\n", smartgreen->num_coolers, MODBUS_MAX_COOLERS);
        smartgreen->num_coolers = MODBUS_MAX_COOLERS;
    }
    
    smartgreen->num_sensors = db_read_config(smartgreen, "num_sensors");
    if (smartgreen->num_sensors < 0)
        smartgreen->num_sensors = 0;
    
    smartgreen->num_zones = db_read_config(smartgreen, "num_zones");
    if (smartgreen->num_zones < 0)
        smartgreen->num_zones = 0;
    
    smartgreen->num_schedulers = db_read_config(smartgreen, "num_schedulers");
    if (smartgreen->num_schedulers < 0)
        smartgreen->num_schedulers = 0;
}