#include "../incl/smartgreen.h"

int     cooler_water_management(t_smartgreen *smartgreen) // Control automático de salinidad y Drenaje
{
    int interval = db_read_config(smartgreen, "salinity_drain_interval");
    int drain_time = db_read_config(smartgreen, "salinity_drain_delay");
    int elapsed = 0;
    if (interval < 0) interval = 30;
    

    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        elapsed = 0;
        if (smartgreen->coolers[i].water_present > 0)
        {
            if (smartgreen->coolers[i].salinity_us >= db_read_config(smartgreen, "salinity_trigger"))
            {
                ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 49, 1);
                while (elapsed < drain_time)
                {
                    sleep(interval);
                    elapsed += interval;
                    ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 49, 1);
                }
                ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 49, 0);
            }
        }
    }
    return (0);
}

int     cooler_prewet(t_smartgreen *smartgreen, int zone_id)    // ciclo completo de pre-mojado (16 pasos)
{
    (void)smartgreen;
    (void)zone_id;
    return (0);
}