#include "../incl/smartgreen.h"

int ft_init_data(t_smartgreen *smartgreen)
{
    int i;

    smartgreen->coolers = NULL;
    if (smartgreen->num_coolers > 0)
    {
        i = 0;
        smartgreen->coolers = malloc(sizeof(t_cooler_state) * smartgreen->num_coolers);
        if (!smartgreen->coolers)
            return (-1);
        while (i < smartgreen->num_coolers)
        {
            smartgreen->coolers[i].unit_id = i + 1;
            smartgreen->coolers[i].zone_id = 1;
            smartgreen->coolers[i].is_extractor = 0;
            smartgreen->coolers[i].error_count = 0;
            smartgreen->coolers[i].drain_valve_open = 0;
            smartgreen->coolers[i].cool_mode_on = 0;
            smartgreen->coolers[i].fan_on = 0;
            smartgreen->coolers[i].fault_present = 0;
            smartgreen->coolers[i].inlet_valve_open = 0;
            smartgreen->coolers[i].actual_fan_speed = 0;
            smartgreen->coolers[i].most_recent_fault = 0;
            smartgreen->coolers[i].water_present = 0;
            smartgreen->coolers[i].salinity_ppm = 0.00;
            smartgreen->coolers[i].salinity_us = 0.00;
            smartgreen->coolers[i].last_read = get_timestamp();
            smartgreen->coolers[i].last_mod = get_timestamp();

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
            smartgreen->sensors[i].sensor_id = i + 1;
            smartgreen->sensors[i].zone_id = 1;
            ft_strcpy(smartgreen->sensors[i].type, "INT", sizeof(smartgreen->sensors->type));
            ft_strcpy(smartgreen->sensors[i].name, "TEST SENSOR", sizeof(smartgreen->sensors->name));
            smartgreen->sensors[i].temperature = -200.00;
            smartgreen->sensors[i].humidity = -200.00;
            smartgreen->sensors[i].flags = 0;
            smartgreen->sensors[i].valid = 0;
            smartgreen->sensors[i].offset_val = 0;
            smartgreen->sensors[i].last_read = get_timestamp();
            smartgreen->sensors[i].last_mod = get_timestamp();
        
            if (db_save_sensor(smartgreen, &smartgreen->sensors[i]) == -1)
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
        smartgreen->zone_params = malloc(sizeof(t_zone_params) * smartgreen->num_zones);
        if (!smartgreen->zone_params)
            return(-1);
        while (i < smartgreen->num_zones)
        {
            smartgreen->zone_params[i].zone_id = i + 1;
            smartgreen->zone_params[i].fan_speed_cmd = 3;
            smartgreen->zone_params[i].target_temp = 25.0;
            smartgreen->zone_params[i].humidity_min = 60.0;
            smartgreen->zone_params[i].humidity_max = 70.0;
            smartgreen->zone_params[i].pump_on = 0;
            ft_strcpy(smartgreen->zone_params[i].cool_fan_mode, "COOL", sizeof(smartgreen->zone_params->cool_fan_mode));
            ft_strcpy(smartgreen->zone_params[i].drain_valve, "close", sizeof(smartgreen->zone_params->drain_valve));
            ft_strcpy(smartgreen->zone_params[i].solenoid, "on", sizeof(smartgreen->zone_params->solenoid));
            ft_strcpy(smartgreen->zone_params[i].on_off, "OFF", sizeof(smartgreen->zone_params->on_off));
            ft_strcpy(smartgreen->zone_params[i].inmediate_drain, "no", sizeof(smartgreen->zone_params->inmediate_drain));
            ft_strcpy(smartgreen->zone_params[i].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
            smartgreen->zone_params[i].last_prewet = 0;
            smartgreen->zone_params[i].last_drain = 0;
            smartgreen->zone_params[i].last_pump_time = 0;

            if (db_save_zone_params(smartgreen, &smartgreen->zone_params[i]) == -1)
                return (-1);
            i++;
        }
    }
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
    
    smartgreen->num_sensors = db_read_config(smartgreen, "num_sensors");
    if (smartgreen->num_sensors < 0)
        smartgreen->num_sensors = 0;
    
    smartgreen->num_zones = db_read_config(smartgreen, "num_zones");
    if (smartgreen->num_zones < 0)
        smartgreen->num_zones = 0;
}