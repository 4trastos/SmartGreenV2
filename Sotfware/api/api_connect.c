#include "../incl/smartgreen.h"

enum MHD_Result api_get_cooler(t_smartgreen *smartgreen, struct MHD_Connection *connection, int unit_id)
{
    t_maintenance_log   last_maint;
    char                responsed[4096];
    int                 offset = 0;
    int                 last_closing = 0;
    int                 last_opening = 0;
    int                 last_legionella = 0;
    int                 z = 0;
    int                 fan_speed_display = 0;
    int                 idx = ft_find_cooler(smartgreen, unit_id);

    if (idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Cooler not found\"}"));

    pthread_mutex_lock(&smartgreen->data_mutex);

    if (db_get_last_maintenance(smartgreen, smartgreen->coolers[idx].unit_id, MAINT_CLOSING, &last_maint) == 0)
        last_closing = last_maint.timestamp;
    if (db_get_last_maintenance(smartgreen, smartgreen->coolers[idx].unit_id, MAINT_OPENING, &last_maint) == 0)
        last_opening = last_maint.timestamp;
    if (db_get_last_maintenance(smartgreen, smartgreen->coolers[idx].unit_id, MAINT_LEGIONELLA, &last_maint) == 0)
        last_legionella = last_maint.timestamp;
    z = ft_find_zone(smartgreen, smartgreen->coolers[idx].zone_id);
    fan_speed_display = (z != -1) ? smartgreen->zone_params[z].fan_speed_cmd : 0;

    offset += snprintf(responsed + offset, sizeof(responsed),
        "{"
        "\"unit_id\":%d,\"zone_id\":%d,\"is_extractor\":%d,"
        "\"drain_valve_open\":%d,\"drain_valve_confirm\":%d,"
        "\"cool_mode_on\":%d,\"fan_on\":%d,\"fault_present\":%d,"
        "\"inlet_valve_open\":%d,\"fan_speed_cmd\":%d,\"fan_speed_confirmed\":%d,"
        "\"most_recent_fault\":%d,\"water_present\":%d,\"pump_on\":%d,\"solenoid_on\":%d,"
        "\"salinity_ppm\":%.2f,\"salinity_us\":%.2f,\"error_count\":%d,"
        "\"last_read\":%ld,\"last_mod\":%ld,"
        "\"alarm_fault\":%d,\"alarm_salinity\":%d,\"alarm_water\":%d,\"alarm_comms\":%d,\"alarm_warranty\":%d,"
        "\"hours_running\":%.1f,"
        "\"alarm_maint_closing\":%d,\"alarm_maint_opening\":%d,\"alarm_maint_legionella\":%d,"
        "\"last_closing\":%d,\"last_opening\":%d,\"last_legionella\":%d,"
        "\"disabled\":%d,\"ramp_rate\":%d,\"cold_starts\":%d,\"fan_starts\":%d,"
        "\"fan_hours\":%d,\"tank_drains\":%d,\"avg_tank_fill\":%d,"
        "\"fan_speed_z1\":%d,\"fan_speed_z2\":%d,\"fan_speed_z3\":%d,\"fan_speed_z4\":%d,\"fan_speed_z5\":%d,"
        "\"extended_status\":%d,\"modbus_addr\":%d,\"r0_config\":%d,"
        "\"prev_fan_starts\":%d,\"fan_zero_ticks\":%d,\"fan_running\":%d,\"last_off\":%ld"
        "}",
        smartgreen->coolers[idx].unit_id, smartgreen->coolers[idx].zone_id, smartgreen->coolers[idx].is_extractor,
        smartgreen->coolers[idx].drain_valve_open, smartgreen->coolers[idx].drain_valve_confirm,
        smartgreen->coolers[idx].cool_mode_on, smartgreen->coolers[idx].fan_on, smartgreen->coolers[idx].fault_present,
        smartgreen->coolers[idx].inlet_valve_open, fan_speed_display, smartgreen->coolers[idx].fan_speed_confirmed,
        smartgreen->coolers[idx].most_recent_fault, smartgreen->coolers[idx].water_present,
        smartgreen->coolers[idx].pump_on, smartgreen->coolers[idx].solenoid_on,
        smartgreen->coolers[idx].salinity_ppm, smartgreen->coolers[idx].salinity_us, smartgreen->coolers[idx].error_count,
        smartgreen->coolers[idx].last_read, smartgreen->coolers[idx].last_mod,
        smartgreen->coolers[idx].alarm_fault, smartgreen->coolers[idx].alarm_salinity,
        smartgreen->coolers[idx].alarm_water, smartgreen->coolers[idx].alarm_comms, smartgreen->coolers[idx].alarm_warranty,
        smartgreen->coolers[idx].hours_running / 3600.0,
        smartgreen->coolers[idx].alarm_maint_closing, smartgreen->coolers[idx].alarm_maint_opening, smartgreen->coolers[idx].alarm_maint_legionella,
        last_closing, last_opening, last_legionella,
        smartgreen->coolers[idx].disabled, smartgreen->coolers[idx].ramp_rate,
        smartgreen->coolers[idx].cold_starts, smartgreen->coolers[idx].fan_starts,
        smartgreen->coolers[idx].fan_hours, smartgreen->coolers[idx].tank_drains, smartgreen->coolers[idx].avg_tank_fill,
        smartgreen->coolers[idx].fan_speed_z1, smartgreen->coolers[idx].fan_speed_z2,
        smartgreen->coolers[idx].fan_speed_z3, smartgreen->coolers[idx].fan_speed_z4, smartgreen->coolers[idx].fan_speed_z5,
        smartgreen->coolers[idx].extended_status, smartgreen->coolers[idx].modbus_addr, smartgreen->coolers[idx].r0_config,
        smartgreen->coolers[idx].prev_fan_starts, smartgreen->coolers[idx].fan_zero_ticks,
        smartgreen->coolers[idx].fan_running, smartgreen->coolers[idx].last_off);

    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, responsed));
}

enum MHD_Result api_get_scheduler(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    sqlite3_stmt        *stmt = NULL;
    const char          *sql =  "SELECT id, name, zone_id, active, action, hour, mon, tue, wed, thu, fri, sat, sun FROM scheduler ORDER BY id ASC;";
    struct json_object  *array = json_object_new_array();
    struct json_object  *obj;
    enum MHD_Result     result;
    const char          *json_str;
    int                 rc = 0;

    pthread_mutex_lock(&smartgreen->data_mutex);
    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        json_object_put(array);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }

    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        obj = json_object_new_object();
        json_object_object_add(obj, "id",      json_object_new_int(sqlite3_column_int(stmt, 0)));
        json_object_object_add(obj, "name",    json_object_new_string((const char *)sqlite3_column_text(stmt, 1)));
        json_object_object_add(obj, "zone_id", json_object_new_int(sqlite3_column_int(stmt, 2)));
        json_object_object_add(obj, "active",  json_object_new_int(sqlite3_column_int(stmt, 3)));
        json_object_object_add(obj, "action",  json_object_new_string((const char *)sqlite3_column_text(stmt, 4)));
        json_object_object_add(obj, "hour",    json_object_new_string((const char *)sqlite3_column_text(stmt, 5)));
        json_object_object_add(obj, "mon",     json_object_new_int(sqlite3_column_int(stmt, 6)));
        json_object_object_add(obj, "tue",     json_object_new_int(sqlite3_column_int(stmt, 7)));
        json_object_object_add(obj, "wed",     json_object_new_int(sqlite3_column_int(stmt, 8)));
        json_object_object_add(obj, "thu",     json_object_new_int(sqlite3_column_int(stmt, 9)));
        json_object_object_add(obj, "fri",     json_object_new_int(sqlite3_column_int(stmt, 10)));
        json_object_object_add(obj, "sat",     json_object_new_int(sqlite3_column_int(stmt, 11)));
        json_object_object_add(obj, "sun",     json_object_new_int(sqlite3_column_int(stmt, 12)));
        json_object_array_add(array, obj);
    }
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    json_str = json_object_to_json_string(array);
    result = api_send_response(connection, MHD_HTTP_OK, json_str);
    json_object_put(array);
    return(result);
}

enum MHD_Result     api_get_history(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    sqlite3_stmt    *stmt = NULL;
    char            sql_dynamic[1024];
    char            responsed[16384];
    char            row[512];
    int             offset = 0;
    int             rc = 0;
    int             first = 1;
    int             bind_idx = 1;
    int             history_limit = 100;
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    
    const char      *zone = MHD_lookup_connection_value(connection, MHD_GET_ARGUMENT_KIND, "zone_id");
    const char      *limit = MHD_lookup_connection_value(connection, MHD_GET_ARGUMENT_KIND, "limit");
    if (limit)
    {
        history_limit = atoi(limit);
        if (history_limit < 1)
            history_limit = 1;
        if (history_limit > 1000)
            history_limit = 1000;
    }

    const char      *from = MHD_lookup_connection_value(connection, MHD_GET_ARGUMENT_KIND, "from");
    const char      *to = MHD_lookup_connection_value(connection, MHD_GET_ARGUMENT_KIND, "to");

    snprintf(sql_dynamic, sizeof(sql_dynamic), 
        "SELECT id, timestamp, unit_id, zone_id, device_type, "
        "fan_speed_cmd, target_temp, water_present, "
        "salinity_ppm, salinity_us, fault_code "
        "FROM history WHERE 1=1 %s %s %s "
        "ORDER BY timestamp DESC LIMIT %d;",
        zone  ? "AND zone_id = ?"       : "",
        from  ? "AND timestamp >= ?"    : "",
        to    ? "AND timestamp <= ?"    : "",
        history_limit
    );

    rc = sqlite3_prepare_v2(smartgreen->db, sql_dynamic, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }

    if (zone) sqlite3_bind_int(stmt, bind_idx++, atoi(zone));
    if (from) sqlite3_bind_int(stmt, bind_idx++, atoi(from));
    if (to) sqlite3_bind_int(stmt, bind_idx++, atoi(to));

    offset += snprintf(responsed + offset, sizeof(responsed), "[");
    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        snprintf(row, sizeof(row),
            "%s{"
            "\"id\":%d,"
            "\"timestamp\":%ld,"
            "\"unit_id\":%d,"
            "\"zone_id\":%d,"
            "\"device_type\":\"%s\","
            "\"fan_speed_cmd\":%d,"
            "\"target_temp\":%.1f,"
            "\"water_present\":%d,"
            "\"salinity_ppm\":%.2f,"
            "\"salinity_us\":%.2f,"
            "\"fault_code\":%d"
            "}",
            first ? "" : ",",
            sqlite3_column_int(stmt, 0),
            (long)sqlite3_column_int(stmt, 1),
            sqlite3_column_int(stmt, 2),
            sqlite3_column_int(stmt, 3),
            sqlite3_column_text(stmt, 4),
            sqlite3_column_int(stmt, 5),
            sqlite3_column_double(stmt, 6),
            sqlite3_column_int(stmt, 7),
            sqlite3_column_double(stmt, 8),
            sqlite3_column_double(stmt, 9),
            sqlite3_column_int(stmt, 10)
        );
        offset += snprintf(responsed + offset, sizeof(responsed), "%s", row);
        first = 0;
    }
    offset += snprintf(responsed + offset, sizeof(responsed), "]");
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, responsed));
}


enum MHD_Result     api_get_status(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    t_alarm_level   alarm_level = ALARM_GREEN;
    char            responsed[4096];
    const char      *alarm_text = "🟢 OK";
    
    pthread_mutex_lock(&smartgreen->data_mutex);

    if (!smartgreen->modbus_ctx)
    {
        alarm_level = ALARM_RED;
        alarm_text = "🔴 CRITICO";
    }

    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        if (smartgreen->coolers[i].fault_present || smartgreen->coolers[i].alarm_comms || smartgreen->coolers[i].alarm_fault)
        {
            if (alarm_level < ALARM_RED)
            {
                alarm_level = ALARM_RED;
                alarm_text = "🔴 CRITICO";
                break;
            }
        }
        if (smartgreen->coolers[i].alarm_salinity || smartgreen->coolers[i].alarm_water)
        {
            if (alarm_level < ALARM_RED)
            {
                alarm_level = ALARM_YELLOW;
                alarm_text = "🟡 AVISO";
            }
        }
    }
    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        if (smartgreen->sensors[i].alarm_signal || smartgreen->sensors[i].alarm_temp)
        {
            if (alarm_level < ALARM_RED)
            {
                alarm_level = ALARM_YELLOW;
                alarm_text = "🟡 AVISO";
            }
        }
    }
    
    snprintf(responsed, sizeof(responsed),
        "{"
        "\"status\":\"ok\","
        "\"alarm_level\":%d,"
        "\"alarm_text\":\"%s\","
        "\"num_coolers\":%d,"
        "\"num_sensors\":%d,"
        "\"num_zones\":%d,"
        "\"modbus_connected\":%d"
        "}",
        alarm_level,
        alarm_text,
        smartgreen->num_coolers,
        smartgreen->num_sensors,
        smartgreen->num_zones,
        smartgreen->modbus_ctx != NULL ? 1 : 0
    );
    

    pthread_mutex_unlock(&smartgreen->data_mutex);
    return(api_send_response(connection, MHD_HTTP_OK, responsed));
}

enum MHD_Result     api_get_coolers(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    t_maintenance_log   last_maint;
    char                responsed[4096];
    int                 offset = 0;
    int                 last_closing = 0;
    int                 last_opening = 0;
    int                 last_legionella = 0;
    int                 z = 0;
    int                 fan_speed_display = 0;

    pthread_mutex_lock(&smartgreen->data_mutex);

    offset += snprintf(responsed + offset, sizeof(responsed), "[");
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        last_closing = 0;
        last_opening = 0;
        last_legionella = 0;

        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_CLOSING, &last_maint) == 0)
            last_closing = last_maint.timestamp;
        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_OPENING, &last_maint) == 0)
            last_opening = last_maint.timestamp;
        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_LEGIONELLA, &last_maint) == 0)
            last_legionella = last_maint.timestamp;
        z = ft_find_zone(smartgreen, smartgreen->coolers[i].zone_id);
        fan_speed_display = (z != -1) ? smartgreen->zone_params[z].fan_speed_cmd : 0;
    
        offset += snprintf(responsed + offset, sizeof(responsed),
            "%s{"
            "\"unit_id\":%d,"
            "\"zone_id\":%d,"
            "\"is_extractor\":%d,"
            "\"drain_valve_open\":%d,"
            "\"drain_valve_confirm\":%d,"
            "\"cool_mode_on\":%d,"
            "\"fan_on\":%d,"
            "\"fault_present\":%d,"
            "\"inlet_valve_open\":%d,"
            "\"fan_speed_cmd\":%d,"
            "\"fan_speed_confirmed\":%d,"
            "\"most_recent_fault\":%d,"
            "\"water_present\":%d,"
            "\"pump_on\":%d,"
            "\"solenoid_on\":%d,"
            "\"salinity_ppm\":%.2f,"
            "\"salinity_us\":%.2f,"
            "\"error_count\":%d,"
            "\"last_read\":%ld,"
            "\"last_mod\":%ld,"
            "\"alarm_fault\":%d,"
            "\"alarm_salinity\":%d,"
            "\"alarm_water\":%d,"
            "\"alarm_comms\":%d,"
            "\"alarm_warranty\":%d,"
            "\"hours_running\":%.1f,"
            "\"alarm_maint_closing\":%d,"
            "\"alarm_maint_opening\":%d,"
            "\"alarm_maint_legionella\":%d,"
            "\"last_closing\":%d,"
            "\"last_opening\":%d,"
            "\"last_legionella\":%d,"
            "\"disabled\":%d,\"ramp_rate\":%d,\"cold_starts\":%d,\"fan_starts\":%d,"
            "\"fan_hours\":%d,\"tank_drains\":%d,\"avg_tank_fill\":%d,\"fan_speed_z1\":%d,"
            "\"fan_speed_z2\":%d,\"fan_speed_z3\":%d,\"fan_speed_z4\":%d,\"fan_speed_z5\":%d,"
            "\"extended_status\":%d,\"modbus_addr\":%d,\"r0_config\":%d,\"prev_fan_starts\":%d,\"fan_zero_ticks\":%d,\"fan_running\":%d,\"last_off\":%ld"
            "}",
            i > 0 ? "," : "",
            smartgreen->coolers[i].unit_id,
            smartgreen->coolers[i].zone_id,
            smartgreen->coolers[i].is_extractor,
            smartgreen->coolers[i].drain_valve_open,
            smartgreen->coolers[i].drain_valve_confirm,
            smartgreen->coolers[i].cool_mode_on,
            smartgreen->coolers[i].fan_on,
            smartgreen->coolers[i].fault_present,
            smartgreen->coolers[i].inlet_valve_open,
            fan_speed_display,
            smartgreen->coolers[i].fan_speed_confirmed,
            smartgreen->coolers[i].most_recent_fault,
            smartgreen->coolers[i].water_present,
            smartgreen->coolers[i].pump_on,
            smartgreen->coolers[i].solenoid_on,
            smartgreen->coolers[i].salinity_ppm,
            smartgreen->coolers[i].salinity_us,
            smartgreen->coolers[i].error_count,
            smartgreen->coolers[i].last_read,
            smartgreen->coolers[i].last_mod,
            smartgreen->coolers[i].alarm_fault,
            smartgreen->coolers[i].alarm_salinity,
            smartgreen->coolers[i].alarm_water,
            smartgreen->coolers[i].alarm_comms,
            smartgreen->coolers[i].alarm_warranty,
            smartgreen->coolers[i].hours_running / 3600.0,
            smartgreen->coolers[i].alarm_maint_closing,
            smartgreen->coolers[i].alarm_maint_opening,
            smartgreen->coolers[i].alarm_maint_legionella,
            last_closing,
            last_opening,
            last_legionella,
            smartgreen->coolers[i].disabled,
            smartgreen->coolers[i].ramp_rate,
            smartgreen->coolers[i].cold_starts,
            smartgreen->coolers[i].fan_starts,
            smartgreen->coolers[i].fan_hours,
            smartgreen->coolers[i].tank_drains,
            smartgreen->coolers[i].avg_tank_fill,
            smartgreen->coolers[i].fan_speed_z1,
            smartgreen->coolers[i].fan_speed_z2,
            smartgreen->coolers[i].fan_speed_z3,
            smartgreen->coolers[i].fan_speed_z4,
            smartgreen->coolers[i].fan_speed_z5,
            smartgreen->coolers[i].extended_status,
            smartgreen->coolers[i].modbus_addr,
            smartgreen->coolers[i].r0_config,
            smartgreen->coolers[i].prev_fan_starts,
            smartgreen->coolers[i].fan_zero_ticks,
            smartgreen->coolers[i].fan_running,
            smartgreen->coolers[i].last_off
        );
    }
    offset += snprintf(responsed + offset, sizeof(responsed), "]");
    
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return(api_send_response(connection, MHD_HTTP_OK, responsed));
}

enum MHD_Result     api_get_sensors(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    char    responsed[4096];
    int     offset = 0;

    pthread_mutex_lock(&smartgreen->data_mutex);

    offset += snprintf(responsed + offset, sizeof(responsed), "[");
    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        offset += snprintf(responsed + offset, sizeof(responsed),
            "%s{"
            "\"sensor_id\":%d,"
            "\"zone_id\":%d,"
            "\"type\":\"%s\","
            "\"name\":\"%s\","
            "\"temperature\":%.2f,"
            "\"humidity\":%.2f,"
            "\"flags\":%d,"
            "\"valid\":%d,"
            "\"offset_val\":%d,"
            "\"error_count\":%d,"
            "\"last_read\":%ld,"
            "\"last_mod\":%ld,"
            "\"alarm_signal\":%d,"
            "\"alarm_temp\":%d"
            "}",
            i > 0 ? "," : "",
            smartgreen->sensors[i].sensor_id,
            smartgreen->sensors[i].zone_id,
            smartgreen->sensors[i].type,
            smartgreen->sensors[i].name,
            smartgreen->sensors[i].temperature,
            smartgreen->sensors[i].humidity,
            smartgreen->sensors[i].flags,
            smartgreen->sensors[i].valid,
            smartgreen->sensors[i].offset_val,
            smartgreen->sensors[i].error_count,
            smartgreen->sensors[i].last_read,
            smartgreen->sensors[i].last_mod,
            smartgreen->sensors[i].alarm_signal,
            smartgreen->sensors[i].alarm_temp
        );
    }
    

    offset += snprintf(responsed + offset, sizeof(responsed), "]");

    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, responsed));
}

enum MHD_Result     api_get_zones(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    char    responsed[4096];
    int     offset = 0;

    pthread_mutex_lock(&smartgreen->data_mutex);

    offset += snprintf(responsed + offset, sizeof(responsed) ,"[");

    for (int i = 0; i < smartgreen->num_zones; i++)
    {
        offset += snprintf(responsed + offset, sizeof(responsed),
            "%s{"
            "\"zone_id\":%d,"
            "\"fan_speed_cmd\":%d,"
            "\"target_temp\":%.2f,"
            "\"humidity_min\":%.2f,"
            "\"humidity_max\":%.2f,"
            "\"integral\":%.2f,"
            "\"pump_on\":%d,"
            "\"cool_fan_mode\":\"%s\","
            "\"drain_valve\":\"%s\","
            "\"solenoid\":\"%s\","
            "\"on_off\":\"%s\","
            "\"inmediate_drain\":\"%s\","
            "\"prewet_in_progress\":\"%s\","
            "\"last_prewet\":%ld,"
            "\"last_drain\":%ld,"
            "\"last_pump_time\":%ld"
            "}",
            i > 0 ? "," : "",
            smartgreen->zone_params[i].zone_id,
            smartgreen->zone_params[i].fan_speed_cmd,
            smartgreen->zone_params[i].target_temp,
            smartgreen->zone_params[i].humidity_min,
            smartgreen->zone_params[i].humidity_max,
            smartgreen->zone_params[i].integral,
            smartgreen->zone_params[i].pump_on,
            smartgreen->zone_params[i].cool_fan_mode,
            smartgreen->zone_params[i].drain_valve,
            smartgreen->zone_params[i].solenoid,
            smartgreen->zone_params[i].on_off,
            smartgreen->zone_params[i].inmediate_drain,
            smartgreen->zone_params[i].prewet_in_progress,
            smartgreen->zone_params[i].last_prewet,
            smartgreen->zone_params[i].last_drain,
            smartgreen->zone_params[i].last_pump_time
        );
    }
    

    offset += snprintf(responsed + offset, sizeof(responsed), "]");
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, responsed));
}