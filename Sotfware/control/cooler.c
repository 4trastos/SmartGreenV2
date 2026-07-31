#include "../incl/smartgreen.h"

// void    *prewet_thread(void *arg)
// {
//     t_prewet_args   *args = (t_prewet_args *)arg;
//     t_smartgreen    *smartgreen = args->smartgreen;
//     int             zone_id = args->zone_id;
//     int             zone_idx = ft_find_zone(smartgreen, zone_id);

//     free(args);
//     if (zone_idx == -1)
//         return(NULL);
    
//     pthread_mutex_lock(&smartgreen->data_mutex);
//     ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
//     pthread_mutex_unlock(&smartgreen->data_mutex);

//     cooler_prewet(smartgreen, zone_id);

//     pthread_mutex_lock(&smartgreen->data_mutex);
//     ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
//     pthread_mutex_unlock(&smartgreen->data_mutex);

//     return (NULL);
// }

void    *prewet_thread(void *arg)
{
    t_prewet_args   *args = (t_prewet_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             zone_id = args->zone_id;
    int             zone_idx = ft_find_zone(smartgreen, zone_id);

    printf("PREWET THREAD ARRANCADO zone_id=%d zone_idx=%d\n", zone_id, zone_idx);
    fflush(stdout);

    free(args);
    if (zone_idx == -1)
    {
        printf("PREWET ERROR: zone_idx=-1\n"); fflush(stdout);
        return(NULL);
    }
    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
    pthread_mutex_unlock(&smartgreen->data_mutex);

    printf("PREWET iniciando cooler_prewet...\n"); fflush(stdout);
    cooler_prewet(smartgreen, zone_id);
    printf("PREWET finalizado\n"); fflush(stdout);

    // encender cooler en modo normal tras prewet
    // for (int i = 0; i < smartgreen->num_coolers; i++)
    // {
    //     if (smartgreen->coolers[i].zone_id == zone_id)
    //     {
    //         ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 1, 3));
    //         usleep(200000);
    //         ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_51(1, 0));
    //         usleep(200000);
    //         ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_52(3));
    //         usleep(200000);
    //         ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 400, 300);
    //     }
    // }
    
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

// int     cooler_prewet(t_smartgreen *smartgreen, int zone_id)    // ciclo completo de pre-mojado (16 pasos)
// {
//     int max_wait = db_read_config(smartgreen, "prewet_max_wait");
//     int check_interval = db_read_config(smartgreen, "prewet_check_interval");
//     int all_water = 1;
//     int elapsed = 0;

//     if (max_wait < 0) max_wait = 90;
//     if (check_interval < 0) check_interval = 30;

//     int zone_idx = ft_find_zone(smartgreen, zone_id);
//     if (zone_idx == -1)
//         return (-1);
    
//     sleep(2);

//     if (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "FAN") == 0 || strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "IMD") == 0)
//         return (0);
    
//     for (int i = 0; i < smartgreen->num_coolers; i++)
//         if (smartgreen->coolers[i].zone_id == zone_id)
//             ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_51(0, 1));    // cerrar válvula drenaje + solenoide OFF

//     sleep(db_read_config(smartgreen, "prewet_delay_solenoid"));                               

//     for (int i = 0; i < smartgreen->num_coolers; i++)
//         if (smartgreen->coolers[i].zone_id == zone_id)
//             ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_51(1, 1));     // abrir solenoide ON

//     while (elapsed < max_wait)                                                                                       // verificar agua cada 30s hasta 90s máximo
//     {
//         sleep(check_interval);
//         elapsed += check_interval;
//         for (int i = 0; i < smartgreen->num_coolers; i++)
//             if (smartgreen->coolers[i].zone_id == zone_id)
//                 ft_modbus_read_cooler(smartgreen, smartgreen->coolers[i].unit_id);
//         all_water = 1;
//         for (int i = 0; i < smartgreen->num_coolers; i++)
//             if (smartgreen->coolers[i].zone_id == zone_id && !smartgreen->coolers[i].water_present)
//                 all_water = 0;
//         if (all_water)
//             break;
//     }

//     sleep(db_read_config(smartgreen, "prewet_delay_water"));    // esperar prewet_delay_water (30s)

//     for (int i = 0; i < smartgreen->num_coolers; i++)
//         if (smartgreen->coolers[i].zone_id == zone_id)
//             ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_50(0, 1, 0));     //  encender bomba
    
//     sleep(db_read_config(smartgreen, "prewet_delay_pump"));

//     for (int i = 0; i < smartgreen->num_coolers; i++)
//         if (smartgreen->coolers[i].zone_id == zone_id)
//             ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 51, calculate_register_51(0, 1));        // cerrar solenoide

    
//     return (0);
// }

int     cooler_prewet(t_smartgreen *smartgreen, int zone_id)
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

    // PASO 1 — cerrar solenoide + drain closed (R_51 → addr 50)
    printf("PREWET paso 1: cerrar solenoide + drain (addr=50 val=%d)\n", calculate_register_51(0, 1)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_51(0, 1));

    printf("PREWET esperando %ds antes de abrir solenoide...\n", db_read_config(smartgreen, "prewet_delay_solenoid")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_solenoid"));

    // PASO 2 — abrir solenoide ON (R_51 → addr 50)
    printf("PREWET paso 2: abrir solenoide (addr=50 val=%d)\n", calculate_register_51(1, 1)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_51(1, 1));

    // PASO 3 — esperar agua (max_wait segundos)
    printf("PREWET paso 3: esperando agua (max=%ds interval=%ds)\n", max_wait, check_interval); fflush(stdout);
    while (elapsed < max_wait)
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
        printf("PREWET agua: elapsed=%d all_water=%d\n", elapsed, all_water); fflush(stdout);
        if (all_water)
            break;
    }

    // PASO 4 — esperar prewet_delay_water
    printf("PREWET paso 4: agua detectada, esperando %ds...\n", db_read_config(smartgreen, "prewet_delay_water")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_water"));

    // PASO 5 — encender bomba (R_50 → addr 49)
    printf("PREWET paso 5: encender bomba (addr=49 val=%d)\n", calculate_register_50(0, 1, 0)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 1, 0));

    printf("PREWET esperando %ds con bomba encendida...\n", db_read_config(smartgreen, "prewet_delay_pump")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_pump"));

    // PASO 6 — cerrar solenoide (R_51 → addr 50)
    printf("PREWET paso 6: cerrar solenoide (addr=50 val=%d)\n", calculate_register_51(0, 1)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_51(0, 1));

    // PASO 7 — encender bomba en modo COOL
    printf("PREWET paso 7: encender bomba modo COOL (addr=49 val=%d)\n",
           calculate_register_50(0, 1, 3)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 1, 3));

    // PASO 8 — limpiar drain_confirm
    printf("PREWET paso 8: limpiar drain_confirm\n"); fflush(stdout);
    usleep(500000);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
        {
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_51(0, 0));
            usleep(500000);
            ft_modbus_write_cooler(smartgreen, smartgreen->coolers[i].unit_id, 50, calculate_register_51(0, 1));
        }

    printf("PREWET completado\n"); fflush(stdout);
    return (0);
}
