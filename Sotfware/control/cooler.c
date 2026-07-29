#include "../incl/smartgreen.h"

void    *prewet_thread(void *arg)
{
    t_prewet_args   *args = (t_prewet_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             zone_id = args->zone_id;
    int             zone_idx = ft_find_zone(smartgreen, zone_id);

    free(args);
    if (zone_idx == -1)
        return(NULL);
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
    pthread_mutex_unlock(&smartgreen->data_mutex);

    cooler_prewet(smartgreen, zone_id);

    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
    pthread_mutex_unlock(&smartgreen->data_mutex);

    return (NULL);
}

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
    int max_wait = db_read_config(smartgreen, "prewet_max_wait");
    int check_interval = db_read_config(smartgreen, "prewet_check_interval");
    int all_water = 1;
    int elapsed = 0;

    if (max_wait < 0) max_wait = 90;
    if (check_interval < 0) check_interval = 30;

    int zone_idx = ft_find_zone(smartgreen, zone_id);
    if (zone_idx == -1)
        return (-1);
    
    sleep(2);

    if (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "FAN") == 0 || strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "IMD") == 0)
        return (0);
    
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_51(0, 1));    // cerrar válvula drenaje + solenoide OFF

    sleep(db_read_config(smartgreen, "prewet_delay_solenoid"));                               

    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_51(1, 1));     // abrir solenoide ON

    while (elapsed < max_wait)                                                                                       // verificar agua cada 30s hasta 90s máximo
    {
        sleep(check_interval);
        elapsed += check_interval;
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
                ft_modbus_read_cooler(smartgreen, smartgreen->coolers[i].unit_id);
        all_water = 1;
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id && !smartgreen->coolers[i].water_present)
                all_water = 0;
        if (all_water)
            break;
    }

    sleep(db_read_config(smartgreen, "prewet_delay_water"));    // esperar prewet_delay_water (30s)

    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_50(0, 1, 0));     //  encender bomba
    
    sleep(db_read_config(smartgreen, "prewet_delay_pump"));

    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_51(0, 1));        // cerrar solenoide

    
    return (0);
}
