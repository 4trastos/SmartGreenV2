#include "../incl/smartgreen.h"

void    ft_ws_broadcast_status(t_smartgreen *smartgreen)
{
    char                buffer[32768];
    int                 offset = 0;
    t_maintenance_log   last_maint;
    int                 last_closing = 0;
    int                 last_opening = 0;
    int                 last_legionella = 0;
    int                 last_repair = 0;
    t_alarm_level       alarm_level = ALARM_GREEN;
    const char          *alarm_text = "🟢 OK";

    // COOLERS
    offset += snprintf(buffer + offset, sizeof(buffer),
        "{\"type\":\"update\",\"coolers\":[");
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        last_closing = 0;
        last_opening = 0;
        last_legionella = 0;
        last_repair = 0;
        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_CLOSING, &last_maint) == 0)
            last_closing = last_maint.timestamp;
        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_OPENING, &last_maint) == 0)
            last_opening = last_maint.timestamp;
        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_LEGIONELLA, &last_maint) == 0)
            last_legionella = last_maint.timestamp;
        if (db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_REPAIR, &last_maint) == 0)
            last_repair = last_maint.timestamp;

        offset += snprintf(buffer + offset, sizeof(buffer) - offset,
            "%s{"
            "\"unit_id\":%d,\"zone_id\":%d,\"is_extractor\":%d,"
            "\"drain_valve_open\":%d,\"drain_valve_confirm\":%d,"
            "\"cool_mode_on\":%d,\"fan_on\":%d,\"fault_present\":%d,"
            "\"inlet_valve_open\":%d,\"actual_fan_speed\":%d,"
            "\"fan_speed_confirmed\":%d,\"most_recent_fault\":%d,"
            "\"water_present\":%d,\"pump_on\":%d,\"solenoid_on\":%d,"
            "\"salinity_ppm\":%.2f,\"salinity_us\":%.2f,"
            "\"error_count\":%d,\"last_read\":%ld,\"last_mod\":%ld,"
            "\"alarm_fault\":%d,\"alarm_salinity\":%d,"
            "\"alarm_water\":%d,\"alarm_comms\":%d,\"alarm_warranty\":%d,"
            "\"hours_running\":%.1f,"
            "\"alarm_maint_closing\":%d,\"alarm_maint_opening\":%d,"
            "\"alarm_maint_legionella\":%d,"
            "\"last_closing\":%d,\"last_opening\":%d,\"last_legionella\":%d,"
            "\"last_repair\":%d,"
            "\"disabled\":%d,\"ramp_rate\":%d,\"cold_starts\":%d,\"fan_starts\":%d,"
            "\"fan_hours\":%d,\"tank_drains\":%d,\"avg_tank_fill\":%d,\"fan_speed_z1\":%d,"
            "\"fan_speed_z2\":%d,\"fan_speed_z3\":%d,\"fan_speed_z4\":%d,\"fan_speed_z5\":%d,"
            "\"extended_status\":%d,\"modbus_addr\":%d,\"r0_config\":%d,\"broken_cooler\":%d,\"fault_solenoid\":%d,\"fault_pump\":%d,"
            "\"board_id\":\"%04X-%04X-%04X-%04X\",\"comms_events\":%d,\"hb_disabled\":%d,"
            "\"imd\":%d,\"user_off\":%d,\"comms_lost\":%d,\"model\":\"%s\",\"firmware\":%d"
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
            smartgreen->coolers[i].actual_fan_speed,
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
            smartgreen->coolers[i].hours_running,
            smartgreen->coolers[i].alarm_maint_closing,
            smartgreen->coolers[i].alarm_maint_opening,
            smartgreen->coolers[i].alarm_maint_legionella,
            last_closing, last_opening, last_legionella, last_repair,
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
            smartgreen->coolers[i].broken_cooler,
            smartgreen->coolers[i].fault_solenoid,
            smartgreen->coolers[i].fault_pump,
            smartgreen->coolers[i].board_r10, smartgreen->coolers[i].board_r16, smartgreen->coolers[i].board_r17, smartgreen->coolers[i].board_r44,
            smartgreen->coolers[i].comms_events, smartgreen->coolers[i].hb_disabled,
            smartgreen->coolers[i].imd,
            smartgreen->coolers[i].user_off,
            smartgreen->coolers[i].comms_lost,
            smartgreen->coolers[i].model,
            smartgreen->coolers[i].firmware
        );
    }
    offset += snprintf(buffer + offset, sizeof(buffer) - offset, "],");

    // SENSORS
    offset += snprintf(buffer + offset, sizeof(buffer) - offset, "\"sensors\":[");
    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        offset += snprintf(buffer + offset, sizeof(buffer) - offset,
            "%s{\"sensor_id\":%d,\"zone_id\":%d,\"type\":\"%s\","
            "\"temperature\":%.2f,\"humidity\":%.2f,"
            "\"valid\":%d,\"error_count\":%d,"
            "\"disabled\":%d,"
            "\"alarm_signal\":%d,\"alarm_temp\":%d}",
            i > 0 ? "," : "",
            smartgreen->sensors[i].sensor_id,
            smartgreen->sensors[i].zone_id,
            smartgreen->sensors[i].type,
            smartgreen->sensors[i].temperature,
            smartgreen->sensors[i].humidity,
            smartgreen->sensors[i].valid,
            smartgreen->sensors[i].error_count,
            smartgreen->sensors[i].disabled,
            smartgreen->sensors[i].alarm_signal,
            smartgreen->sensors[i].alarm_temp
        );
    }
    offset += snprintf(buffer + offset, sizeof(buffer) - offset, "],");

    // ZONES
    offset += snprintf(buffer + offset, sizeof(buffer) - offset, "\"zones\":[");
    for (int i = 0; i < smartgreen->num_zones; i++)
    {
        offset += snprintf(buffer + offset, sizeof(buffer) - offset,
            "%s{\"zone_id\":%d,\"name\":\"%s\",\"on_off\":\"%s\","
            "\"fan_speed_cmd\":%d,\"target_temp\":%.1f,"
            "\"humidity_min\":%.1f,\"humidity_max\":%.1f,"
            "\"humidity_control\":%d,"
            "\"cool_fan_mode\":\"%s\","
            "\"prewet_in_progress\":\"%s\"}",
            i > 0 ? "," : "",
            smartgreen->zone_params[i].zone_id,
            smartgreen->zones[i].name,
            smartgreen->zone_params[i].on_off,
            smartgreen->zone_params[i].fan_speed_cmd,
            smartgreen->zone_params[i].target_temp,
            smartgreen->zone_params[i].humidity_min,
            smartgreen->zone_params[i].humidity_max,
            smartgreen->zone_params[i].humidity_control,
            smartgreen->zone_params[i].cool_fan_mode,
            smartgreen->zone_params[i].prewet_in_progress
        );
            }
    offset += snprintf(buffer + offset, sizeof(buffer) - offset, "],");

    // STATUS
    if (!smartgreen->modbus_ctx)
    { alarm_level = ALARM_RED; alarm_text = "🔴 CRITICO"; }
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        if (smartgreen->coolers[i].alarm_fault || smartgreen->coolers[i].alarm_comms || smartgreen->coolers[i].fault_present)
        { alarm_level = ALARM_RED; alarm_text = "🔴 CRITICO"; break; }
        if ((smartgreen->coolers[i].alarm_salinity || smartgreen->coolers[i].alarm_water)
            && alarm_level < ALARM_RED)
        { alarm_level = ALARM_YELLOW; alarm_text = "🟡 AVISO"; }
    }
    offset += snprintf(buffer + offset, sizeof(buffer) - offset,
        "\"status\":{\"alarm_level\":%d,\"alarm_text\":\"%s\","
        "\"modbus_connected\":%d}}",
        alarm_level, alarm_text,
        smartgreen->modbus_ctx != NULL ? 1 : 0
    );

    ft_ws_broadcast(smartgreen, buffer);
}