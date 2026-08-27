#include "../incl/smartgreen.h"

void    ft_auto_humidity_control(t_smartgreen *smartgreen, int zone_idx)
{
    float   humidity_actual;
    float   humidity_max;
    int     sensor_idx = -1;
    int     r50 = 0;
    int     zone_id = smartgreen->zone_params[zone_idx].zone_id;

    if (!smartgreen->zone_params[zone_idx].humidity_control)
        return;  // ← control desactivado, no hacer nada

    for (int i = 0; i < smartgreen->num_sensors; i++)
        if (smartgreen->sensors[i].zone_id == zone_id && strcmp(smartgreen->sensors[i].type, "INT") == 0)
            { sensor_idx = i; break; }
    if (sensor_idx == -1 || !smartgreen->sensors[sensor_idx].valid)
        return;

    humidity_actual = smartgreen->sensors[sensor_idx].humidity;
    humidity_max = smartgreen->zone_params[zone_idx].humidity_max;

    if (humidity_actual > humidity_max && smartgreen->zone_params[zone_idx].pump_on)
    {
        smartgreen->zone_params[zone_idx].pump_on = 0;
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
            {
                r50 = calculate_register_50(0, 0, smartgreen->zone_params[zone_idx].fan_speed_cmd);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
            }
    }
    else if (humidity_actual <= humidity_max && !smartgreen->zone_params[zone_idx].pump_on)
    {
        smartgreen->zone_params[zone_idx].pump_on = 1;
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
            {
                r50 = calculate_register_50(0, 1, smartgreen->zone_params[zone_idx].fan_speed_cmd);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
            }
    }
}

int     sensor_validate(t_sensor_state *sensor)
{
    if (!sensor->valid)
    {
        printf("Error: Sensor is not valid\n");
        return (-1);
    }
    if (sensor->offset_val != 0)
        sensor->temperature += sensor->offset_val / 10.0f;
    return (0);
}