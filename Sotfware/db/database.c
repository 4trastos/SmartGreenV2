#include "../incl/smartgreen.h"

int     db_save_sensor_zone(t_smartgreen *smartgreen, t_sensor_state *sensor)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_SENSOR_ZONE;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The sensor_zone database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1, sensor->sensor_id);
    sqlite3_bind_int(stmt, 2, sensor->zone_id);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Sensor_zone inserted correctly\n");
    else
    {
        printf("Error sensor_zone inserting %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }

    sqlite3_finalize(stmt);
    return (0);
}

int     db_save_zones(t_smartgreen *smartgreen, t_zones *zones)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_ZONES;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The zones database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1, zones->id);
    sqlite3_bind_text(stmt, 2, zones->name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, zones->enabled);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Zones inserted correctly\n");
    else
    {
        printf("Error zones inserting %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return(-1);
    }

    sqlite3_finalize(stmt);
    return(0);
}

int db_save_history(t_smartgreen *smartgreen, const char *device_type, t_cooler_state *cooler, t_sensor_state *sensor)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_HISTOTY;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The history database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 2, get_timestamp());
    sqlite3_bind_int(stmt, 3, cooler ? cooler->unit_id : 0);
    sqlite3_bind_int(stmt, 4, cooler ? cooler->zone_id : 0);
    sqlite3_bind_text(stmt, 5, device_type, -1 , SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 6, sensor ? sensor->temperature : 0);
    sqlite3_bind_double(stmt, 7, sensor ? sensor->humidity : 0);
    sqlite3_bind_int(stmt, 8, smartgreen->zone_params ? smartgreen->zone_params->fan_speed_cmd : 0);
    sqlite3_bind_double(stmt, 9, smartgreen->zone_params ? smartgreen->zone_params->target_temp : 0.0);
    sqlite3_bind_double(stmt, 10, smartgreen->zone_params ? smartgreen->zone_params->humidity_min : 0.0);
    sqlite3_bind_double(stmt, 11, smartgreen->zone_params ? smartgreen->zone_params->humidity_max : 0.0);
    sqlite3_bind_int(stmt, 12, smartgreen->zone_params ? smartgreen->zone_params->pump_on : 0);
    sqlite3_bind_text(stmt, 13, smartgreen->zone_params ? smartgreen->zone_params->cool_fan_mode : "N/A", -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 14, cooler ? cooler->water_present : 0);
    sqlite3_bind_double(stmt, 15, cooler ? cooler->salinity_ppm : 0);
    sqlite3_bind_double(stmt, 16, cooler ? cooler->salinity_us : 0);
    sqlite3_bind_int(stmt, 17, cooler ? cooler->drain_valve_open : 0);
    sqlite3_bind_text(stmt, 18, smartgreen->zone_params ? smartgreen->zone_params->solenoid : "N/A", -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 19, cooler ? cooler->cool_mode_on : 0);
    sqlite3_bind_int(stmt, 20, cooler ? cooler->fault_present : 0);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("History inserted correctly\n");
    else
    {
        printf("Error history inserting %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }

    sqlite3_finalize(stmt);
    return (0);
}

int     db_save_zone_params(t_smartgreen *smartgreen, t_zone_params *zone_params)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_ZONE_PARAMS;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The zone params database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1, zone_params->zone_id);
    sqlite3_bind_int(stmt, 2, zone_params->fan_speed_cmd);
    sqlite3_bind_double(stmt, 3, zone_params->target_temp);
    sqlite3_bind_double(stmt, 4, zone_params->humidity_min);
    sqlite3_bind_double(stmt,5, zone_params->humidity_max);
    sqlite3_bind_int(stmt, 6, zone_params->pump_on);
    sqlite3_bind_text(stmt, 7, zone_params->cool_fan_mode, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 8, zone_params->drain_valve, -1 , SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 9, zone_params->solenoid, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 10, zone_params->on_off, -1 , SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 11, zone_params->inmediate_drain, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 12, zone_params->prewet_in_progress, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 13, zone_params->last_prewet);
    sqlite3_bind_int(stmt, 14, zone_params->last_drain);
    sqlite3_bind_int(stmt, 15, zone_params->last_pump_time);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Zone params inserted correctly\n");
    else
    {
        printf("Error zone params inserting %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    sqlite3_finalize(stmt);
    return(0);
}

int db_save_config(t_smartgreen *smartgreen, const char *key, int value)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_CONFIG;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The config database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_text(stmt, 1, key, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 2, value);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Config inserted correctly\n");
    else
    {
        printf("Error config inserting %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }

    sqlite3_finalize(stmt);
    return (0);
}

int db_save_sensor(t_smartgreen *smartgreen, t_sensor_state *sensor)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_INSERT_SENSOR;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The sensor_state database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return(-1);
    }

    sqlite3_bind_int(stmt, 1, sensor->sensor_id);
    sqlite3_bind_int(stmt, 2, sensor->zone_id);
    sqlite3_bind_text(stmt, 3, sensor->type, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, sensor->name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 5, sensor->temperature);
    sqlite3_bind_double(stmt, 6, sensor->humidity);
    sqlite3_bind_int(stmt, 7, sensor->flags);
    sqlite3_bind_int(stmt, 8, sensor->valid);
    sqlite3_bind_int(stmt, 9, sensor->offset_val);
    sqlite3_bind_int(stmt, 10, sensor->error_count);
    sqlite3_bind_int(stmt, 11, sensor->last_read);
    sqlite3_bind_int(stmt, 12, sensor->last_mod);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Sensor inserted correctly\n");
    else
    {
        printf("Error Sensor inserting: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }

    sqlite3_finalize((stmt));
    return (0);
}

int db_save_cooler(t_smartgreen *smartgreen, t_cooler_state *cooler)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_INSERT_COOLER;
    int             rc;
    
    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);          // Pepare the consultation
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The cooler_state database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }
 
    sqlite3_bind_int(stmt, 1, cooler->unit_id);                                     // Vincular valores (bind)
    sqlite3_bind_int(stmt, 2, cooler->zone_id);
    sqlite3_bind_int(stmt, 3, cooler->is_extractor);
    sqlite3_bind_int(stmt, 4, cooler->error_count);
    sqlite3_bind_int(stmt, 5, cooler->drain_valve_open);
    sqlite3_bind_int(stmt, 6, cooler->drain_valve_confirm);
    sqlite3_bind_int(stmt, 7, cooler->cool_mode_on);
    sqlite3_bind_int(stmt, 8, cooler->fan_on);
    sqlite3_bind_int(stmt, 9, cooler->fault_present);
    sqlite3_bind_int(stmt, 10, cooler->inlet_valve_open);
    sqlite3_bind_int(stmt, 11, cooler->actual_fan_speed);
    sqlite3_bind_int(stmt, 12, cooler->fan_speed_confirmed);
    sqlite3_bind_int(stmt, 13, cooler->most_recent_fault);
    sqlite3_bind_int(stmt, 14, cooler->water_present);
    sqlite3_bind_int(stmt, 15, cooler->pump_on);
    sqlite3_bind_int(stmt, 16, cooler->pump_on);
    sqlite3_bind_double(stmt, 17, cooler->salinity_ppm);
    sqlite3_bind_double(stmt, 18, cooler->salinity_us);
    sqlite3_bind_int(stmt, 19, cooler->last_read);
    sqlite3_bind_int(stmt, 20, cooler->last_mod);

    rc = sqlite3_step(stmt);                                                        // Run and clean
    if (rc == SQLITE_DONE)
        printf("Cooler inserted correctly\n");
    else
    {
        printf("Error Cooler inserting: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    sqlite3_finalize(stmt);
    return (0);
}

int db_init(t_smartgreen *smartgreen)
{
    char    *err_msg = NULL;
    int     db;

    db = sqlite3_open(DB_PATH, &smartgreen->db);
    if (db != SQLITE_OK)
    {
        fprintf(stderr, "The database could not be opened: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }
    printf("Successful database connection.\n");

    db = sqlite3_exec(smartgreen->db, SCHEMA_SQL, NULL, NULL, &err_msg);
    if (db != SQLITE_OK)
    {
        fprintf(stderr, "The database could not be created: ( %s )\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(smartgreen->db);
        return (-1);
    }
    printf("Tables created/verified correctly\n");
    return (0);
}
