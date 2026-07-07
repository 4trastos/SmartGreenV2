#include "../incl/smartgreen.h"

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