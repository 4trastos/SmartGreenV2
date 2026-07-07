#include "../incl/smartgreen.h"

time_t  get_timestamp(void)
{
    return (time(NULL));
}

void    ft_free_modbus(t_smartgreen *smartgreen)
{
    modbus_close(smartgreen->modbus_ctx);
    modbus_free(smartgreen->modbus_ctx);
}

void    ft_free_structs(t_smartgreen *smartgreen)
{
    free(smartgreen->coolers);
    free(smartgreen->sensors);
    free(smartgreen->zones);
    free(smartgreen->zone_params);
    free(smartgreen->scheduler);
    free(smartgreen);
}

int ft_strlen(char *str)
{
    int i = 0;

    while (str[i] != '\0')
        i++;
    return (i);
}

char    *ft_strcpy(char *dst, char *src, int max_len)
{
    int i = 0;
    int size = ft_strlen(src);

    while ((i < max_len -1) && (i < size))
    {
        dst[i] = src[i];
        i++;
    }
    
    dst[i] = '\0';
    return (dst);
}

int     ft_find_zone(t_smartgreen *smartgreen, int id)
{
    int found = 0;

    while (found < smartgreen->num_zones)
    {
        if (smartgreen->zone_params[found].zone_id == id)
            break;
        found++;
    }

    if (found == smartgreen->num_zones)
    {
        printf("Error: Zone_params not found\n");
        return (-1);
    }

    return (found);
}

int     ft_find_cooler(t_smartgreen *smargreen, int id)
{
    int found = 0;

    while (found < smargreen->num_coolers)
    {
        if (smargreen->coolers[found].unit_id == id)
            break;
        found++;
    }

    if (found == smargreen->num_coolers)
    {
        printf("Error: Cooler not found\n");
        return (-1);
    }
    
    return (found);
}

int     ft_find_sensor(t_smartgreen *smargreen, int id)
{
    int found = 0;

    while (found < smargreen->num_sensors)
    {
        if (smargreen->sensors[found].sensor_id == id)
            break;
        found++;
    }

    if (found == smargreen->num_sensors)
    {
        printf("Error: Sensor not found\n");
        return (-1);
    }
    
    return (found);
}