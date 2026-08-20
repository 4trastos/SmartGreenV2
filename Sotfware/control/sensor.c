#include "../incl/smartgreen.h"

void    ft_auto_humidity_control(t_smartgreen *smartgreen, int zone_idx)
{
    float   humidity_actual;
    float   humidity_min;
    float   humidity_max;
    int     sensor_idx = -1;
    int     zone_id = smartgreen->zone_params[zone_idx].zone_id;
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