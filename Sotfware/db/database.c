#include "../incl/smartgreen.h"

int db_save_history(t_smartgreen *smartgreen)
{
    (void)smartgreen;
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
    sqlite3_bind_int(stmt, 10, sensor->last_read);
    sqlite3_bind_int(stmt, 11, sensor->last_mod);

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
    sqlite3_bind_int(stmt, 6, cooler->cool_mode_on);
    sqlite3_bind_int(stmt, 7, cooler->fan_on);
    sqlite3_bind_int(stmt, 8, cooler->fault_present);
    sqlite3_bind_int(stmt, 9, cooler->inlet_valve_open);
    sqlite3_bind_int(stmt, 10, cooler->actual_fan_speed);
    sqlite3_bind_int(stmt, 11, cooler->most_recent_fault);
    sqlite3_bind_int(stmt, 12, cooler->water_present);
    sqlite3_bind_double(stmt, 13, cooler->salinity_ppm);
    sqlite3_bind_double(stmt, 14, cooler->salinity_us);
    sqlite3_bind_int(stmt, 15, cooler->last_read);
    sqlite3_bind_int(stmt,16, cooler->last_mod);

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
