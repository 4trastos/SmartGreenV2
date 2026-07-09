#include "../incl/smartgreen.h"

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
        if (smartgreen->coolers[i].fault_present || smartgreen->coolers[i].alarm_comms)
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

enum MHD_Result     api_get_coolers(t_smartgreen *smartagreen, struct MHD_Connection *connection)
{
    char    responsed[4096];
    int     offset = 0;
    //char    cooler_json[512];

    pthread_mutex_lock(&smartagreen->data_mutex);

    offset += snprintf(responsed + offset, sizeof(responsed), "[");
    for (int i = 0; i < smartagreen->num_coolers; i++)
    {
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
            "\"actual_fan_speed\":%d,"
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
            "\"alarm_comms\":%d"
            "}",
            i > 0 ? "," : "",
            smartagreen->coolers[i].unit_id,
            smartagreen->coolers[i].zone_id,
            smartagreen->coolers[i].is_extractor,
            smartagreen->coolers[i].drain_valve_open,
            smartagreen->coolers[i].drain_valve_confirm,
            smartagreen->coolers[i].cool_mode_on,
            smartagreen->coolers[i].fan_on,
            smartagreen->coolers[i].fault_present,
            smartagreen->coolers[i].inlet_valve_open,
            smartagreen->coolers[i].actual_fan_speed,
            smartagreen->coolers[i].fan_speed_confirmed,
            smartagreen->coolers[i].most_recent_fault,
            smartagreen->coolers[i].water_present,
            smartagreen->coolers[i].pump_on,
            smartagreen->coolers[i].solenoid_on,
            smartagreen->coolers[i].salinity_ppm,
            smartagreen->coolers[i].salinity_us,
            smartagreen->coolers[i].error_count,
            smartagreen->coolers[i].last_read,
            smartagreen->coolers[i].last_mod,
            smartagreen->coolers[i].alarm_fault,
            smartagreen->coolers[i].alarm_salinity,
            smartagreen->coolers[i].alarm_water,
            smartagreen->coolers[i].alarm_comms
        );
    }
    offset += snprintf(responsed + offset, sizeof(responsed), "]");
    
    pthread_mutex_unlock(&smartagreen->data_mutex);
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
            "\"pump_on\":%d,"
            "\"cool_fan_mode\":\"%s\","
            "\"drain_valve\":\"%s\","
            "\"solenoid\":\"%s\","
            "\"on_off\":\"%s\","
            "\"inmediate_drain\":\"%s\","
            "\"prewet_in_progress\":\"%s\","
            "\"last_prewet\":%d,"
            "\"last_drain\":%d,"
            "\"last_pump_time\":%d"
            "}",
            i > 0 ? "," : "",
            smartgreen->zone_params[i].zone_id,
            smartgreen->zone_params[i].fan_speed_cmd,
            smartgreen->zone_params[i].target_temp,
            smartgreen->zone_params[i].humidity_min,
            smartgreen->zone_params[i].humidity_max,
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