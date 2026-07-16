#include "../incl/smartgreen.h"

int     db_update_zone_params(t_smartgreen *smartgreen, t_zone_params *zone)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "UPDATE zone_params SET "
                           "fan_speed_cmd=?, target_temp=?, humidity_min=?, humidity_max=?, "
                           "pump_on=?, cool_fan_mode=?, drain_valve=?, solenoid=?, "
                           "on_off=?, inmediate_drain=?, prewet_in_progress=?, "
                           "last_prewet=?, last_drain=?, last_pump_time=? "
                           "WHERE zone_id=?";
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "zone_params update prepare error: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1,  zone->fan_speed_cmd);
    sqlite3_bind_double(stmt, 2,  zone->target_temp);
    sqlite3_bind_double(stmt, 3,  zone->humidity_min);
    sqlite3_bind_double(stmt, 4,  zone->humidity_max);
    sqlite3_bind_int(stmt, 5,  zone->pump_on);
    sqlite3_bind_text(stmt, 6,  zone->cool_fan_mode, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 7,  zone->drain_valve, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 8,  zone->solenoid, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 9,  zone->on_off, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 10, zone->inmediate_drain, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 11, zone->prewet_in_progress, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 12, zone->last_prewet);
    sqlite3_bind_int(stmt, 13, zone->last_drain);
    sqlite3_bind_int(stmt, 14, zone->last_pump_time);
    sqlite3_bind_int(stmt, 15, zone->zone_id);  // WHERE zone_id=?

    while (attemps > DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "zone_params update error: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    sqlite3_finalize(stmt);
    return (-1);
}

int     db_update_config(t_smartgreen *smartgreen, const char *key, int value)
{
    sqlite3_stmt    *stmt;
    const char      *sql = "UPDATE config SET value = ?, last_mod = strftime('%s','now') WHERE key = ?";
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The config database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return(-1);
    }

    sqlite3_bind_int(stmt, 1, value);
    sqlite3_bind_text(stmt, 2, key, -1, SQLITE_TRANSIENT);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("config inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error config: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error config inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int     db_save_maintenance_log(t_smartgreen *smartgreen, t_maintenance_log *maintenance)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_MAINTENANCE;
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The maintenance_log database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return(-1);
    }

    sqlite3_bind_int(stmt, 2, maintenance->unit_id);
    sqlite3_bind_int(stmt, 3, maintenance->timestamp);
    sqlite3_bind_text(stmt, 4, maintenance->type, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, maintenance->description, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt,6, maintenance->technician, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 7, maintenance->next_service);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("maintenance_log insertde correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error maintenance_log: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error: maintenance_log inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int     db_save_scheduler(t_smartgreen *smartgreen, t_scheduler_entry *scheduler)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_SCHEDULER;
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The scheduler database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_text(stmt, 2, scheduler->name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, scheduler->zone_id);
    sqlite3_bind_int(stmt, 4, scheduler->active);
    sqlite3_bind_text(stmt, 5, scheduler->action, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, scheduler->hour, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 7, scheduler->mon);
    sqlite3_bind_int(stmt, 8, scheduler->tue);
    sqlite3_bind_int(stmt, 9, scheduler->wed);
    sqlite3_bind_int(stmt, 10, scheduler->thu);
    sqlite3_bind_int(stmt, 11, scheduler->fri);
    sqlite3_bind_int(stmt, 12, scheduler->sat);
    sqlite3_bind_int(stmt, 13, scheduler->sun);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("Scheduler inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error scheduler: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error scheduler inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int     db_save_sensor_zone(t_smartgreen *smartgreen, t_sensor_state *sensor)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_SENSOR_ZONE;
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The sensor_zone database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1, sensor->sensor_id);
    sqlite3_bind_int(stmt, 2, sensor->zone_id);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("sensor_zone inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error sensor_zone: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error sensor_zone inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int     db_save_zones(t_smartgreen *smartgreen, t_zones *zones)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_ZONES;
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The zones database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1, zones->id);
    sqlite3_bind_text(stmt, 2, zones->name, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, zones->enabled);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("zones inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error zones: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error zones inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int db_save_history(t_smartgreen *smartgreen, const char *device_type, t_cooler_state *cooler, t_sensor_state *sensor)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_HISTOTY;
    int             rc;
    int             attemps = 0;

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

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("history inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error history: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error history inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int     db_save_zone_params(t_smartgreen *smartgreen, t_zone_params *zone_params)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_ZONE_PARAMS;
    int             rc;
    int             attemps = 0;

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

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("zone inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error zone: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error zone inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int db_save_config(t_smartgreen *smartgreen, const char *key, int value)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_CONFIG;
    int             rc;
    int             attemps = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The config database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_text(stmt, 1, key, -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 2, value);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("config inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error config: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error config inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int db_save_sensor(t_smartgreen *smartgreen, t_sensor_state *sensor)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_INSERT_SENSOR;
    int             rc;
    int             attemps = 0;

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
    sqlite3_bind_int(stmt, 13, sensor->alarm_signal);
    sqlite3_bind_int(stmt, 14, sensor->alarm_temp);
    sqlite3_bind_int(stmt, 15, sensor->disabled);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("sensor_state inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error sensor_state: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error sensor_state inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int db_save_cooler(t_smartgreen *smartgreen, t_cooler_state *cooler)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_INSERT_COOLER;
    int             rc;
    int             attemps = 0;
    
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
    sqlite3_bind_int(stmt, 16, cooler->solenoid_on);
    sqlite3_bind_double(stmt, 17, cooler->salinity_ppm);
    sqlite3_bind_double(stmt, 18, cooler->salinity_us);
    sqlite3_bind_int(stmt, 19, cooler->last_read);
    sqlite3_bind_int(stmt, 20, cooler->last_mod);
    sqlite3_bind_int(stmt, 21, cooler->alarm_fault);
    sqlite3_bind_int(stmt, 22, cooler->alarm_salinity);
    sqlite3_bind_int(stmt, 23, cooler->alarm_water);
    sqlite3_bind_int(stmt, 24, cooler->alarm_comms);
    sqlite3_bind_int(stmt, 25, cooler->alarm_warranty);
    sqlite3_bind_int(stmt, 26, cooler->alarm_maint_opening);
    sqlite3_bind_int(stmt, 27, cooler->alarm_maint_closing);
    sqlite3_bind_int(stmt, 28, cooler->alarm_maint_legionella);
    sqlite3_bind_int(stmt, 29, cooler->hours_running);
    sqlite3_bind_int(stmt, 30, cooler->install_date);
    sqlite3_bind_int(stmt, 31, cooler->warranty_months);
    sqlite3_bind_int(stmt, 32, cooler->disabled);
    sqlite3_bind_int(stmt, 33, cooler->ramp_rate);
    sqlite3_bind_int(stmt, 34, cooler->cold_starts);
    sqlite3_bind_int(stmt, 35, cooler->fan_starts);
    sqlite3_bind_int(stmt, 36, cooler->fan_hours);
    sqlite3_bind_int(stmt, 37, cooler->tank_drains);
    sqlite3_bind_int(stmt, 38, cooler->avg_tank_fill);
    sqlite3_bind_int(stmt, 39, cooler->fan_speed_z1);
    sqlite3_bind_int(stmt, 40, cooler->fan_speed_z2);
    sqlite3_bind_int(stmt, 41, cooler->fan_speed_z3);
    sqlite3_bind_int(stmt, 42, cooler->fan_speed_z4);
    sqlite3_bind_int(stmt, 43, cooler->fan_speed_z5);
    sqlite3_bind_int(stmt, 44, cooler->extended_status);
    sqlite3_bind_int(stmt, 45, cooler->modbus_addr);
    sqlite3_bind_int(stmt, 46, cooler->r0_config);

    while (attemps < DB_MAX_RETRIES)
    {
        rc = sqlite3_step(stmt);
        if (rc == SQLITE_DONE)
        {
            printf("cooler_state inserted correctly\n");
            sqlite3_finalize(stmt);
            return (0);
        }
        if (rc == SQLITE_BUSY)
        {
            attemps++;
            usleep(DB_RETRY_DELAY);
            continue;
        }
        fprintf(stderr, "Error cooler_state: %s\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }
    printf("Error cooler_state inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

int db_init(t_smartgreen *smartgreen)
{
    char    *err_msg = NULL;
    int     db;
    int     attempts = 0;

    db = sqlite3_open(DB_PATH, &smartgreen->db);
    if (db != SQLITE_OK)
    {
        fprintf(stderr, "The database could not be opened: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }
    printf("Successful database connection.\n");

    while (attempts < DB_MAX_RETRIES)
    {
        db = sqlite3_exec(smartgreen->db, SCHEMA_SQL, NULL, NULL, &err_msg);
        if (db == SQLITE_OK)
        {
            printf("Tables created/verified correctly\n");
            return (0);
        }
        attempts++;
        if (attempts < DB_MAX_RETRIES)
            usleep(DB_RETRY_DELAY);
    }
    fprintf(stderr, "The database could not be created: ( %s )\n", err_msg);
    sqlite3_free(err_msg);
    sqlite3_close(smartgreen->db);
    return (-1);
}