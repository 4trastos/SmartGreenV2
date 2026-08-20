#include "../incl/smartgreen.h"

int ft_auto_fan_speed(t_smartgreen *smartgreen, int zone_idx)
{
    float   temp_actual;
    float   target_temp;
    float   error;
    float   p_term;
    float   speed;
    int     min_speed;
    int     max_speed;
    int     sensor_idx;

    // Buscar sensor INT de la zona
    sensor_idx = -1;
    for (int i = 0; i < smartgreen->num_sensors; i++)
        if (smartgreen->sensors[i].zone_id == smartgreen->zone_params[zone_idx].zone_id && strcmp(smartgreen->sensors[i].type, "INT") == 0)
            { sensor_idx = i; break; }
    if (sensor_idx == -1 || !smartgreen->sensors[sensor_idx].valid)
        return(3);                                                   // Velocidad por defecto si no hay sensor

    temp_actual = smartgreen->sensors[sensor_idx].temperature;
    target_temp = smartgreen->zone_params[zone_idx].target_temp;
    min_speed = db_read_config(smartgreen, "min_setpoint_fan");
    max_speed = db_read_config(smartgreen, "max_setpoint_fan");

    // Control proporcional
    error = temp_actual - target_temp;
    p_term = error * 1.5f;      // Kp = 1.5

    // Integral acumulada en zone_params
    smartgreen->zone_params[zone_idx].integral += error * 0.1f;     // Ki = 0.1

    // Anti-windup — limitar integral
    if (smartgreen->zone_params[zone_idx].integral > 5.0f)
        smartgreen->zone_params[zone_idx].integral = 5.0f;
    if (smartgreen->zone_params[zone_idx].integral < -5.0f)
        smartgreen->zone_params[zone_idx].integral = -5.0f;
    
    speed = 3.0f + p_term + smartgreen->zone_params[zone_idx].integral;

    // Clamp 1-10
    if (speed < min_speed)
        speed = min_speed < 1 ? 1 : min_speed;
    if (speed > max_speed)
        speed = max_speed > 10 ? 10 : max_speed;
    
    return ((int)speed);
}

int cooler_need_prewet(t_smartgreen *smartgreen, int zone_idx, int  id)
{
    time_t  now = get_timestamp();
    int     cooler_idx = ft_find_cooler(smartgreen, id);

    if (smartgreen->zone_params[zone_idx].last_prewet == 0)
        return (1);
    if (cooler_idx == -1)
        return (1);
    if ((now - smartgreen->coolers[cooler_idx].last_off) >= (3 *3600))
        return (1);
    return (0);
}

void    *ft_drain_thread(void *arg)
{
    t_drain_args    *args = (t_drain_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             unit_id = args->unit_id;
    int             drain_delay = db_read_config(smartgreen, "salinity_drain_delay");
    int             drain_interval = db_read_config(smartgreen, "salinity_drain_interval");
    int             zone_idx = 0;

    printf("DRAIN THREAD ARRANCADO unit_id=%d\n", unit_id); fflush(stdout);

    // 1. Apagar bomba y fan
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 49, 0);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, 0);
    sleep(2);

    // 2. Abrir drenaje + cerrar solenoide
    printf("DRAIN paso 1: abrir drenaje + cerrar solenoide\n"); fflush(stdout);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50,  calculate_register_51(0, 0));     // solenoid=OFF drain=open
    sleep(drain_delay);

    // 3. Cerrar drenaje + abrir solenoide
    printf("DRAIN paso 2: cerrar drenaje + abrir solenoide\n"); fflush(stdout);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, calculate_register_51(1, 1));      // solenoid=ON drain=closed
    sleep(drain_interval);   // Esperar llenado

    // 4. Reanudar operación — relanzar prewet
    printf("DRAIN completado — relanzando prewet\n"); fflush(stdout);
    pthread_mutex_lock(&smartgreen->data_mutex);
    zone_idx = ft_find_zone(smartgreen, args->zone_id);
    if (zone_idx != -1)
    {
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].unit_id == unit_id)
                smartgreen->coolers->alarm_salinity = 0;
        
        ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
        if (cooler_need_prewet)
            smartgreen->zone_params[zone_idx].last_prewet = 0;
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
    
    free(args);
    return (NULL);
}

void    *prewet_thread(void *arg)
{
    t_prewet_args   *args = (t_prewet_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             zone_id = args->zone_id;
    int             zone_idx = ft_find_zone(smartgreen, zone_id);

    if (!args->need_prewet)
    {
        printf("PREWET THREAD NO ARRANCA [Ya está humedo] zone_id=%d zone_idx=%d\n", zone_id, zone_idx); fflush(stdout);
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 50, calculate_register_51(1, 1));  // solenoid=ON, drain=closed
        sleep(9);
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
            {
                int r50 = calculate_register_50(0, 1, 1);  // pump=1 + fan_speed=1
                int r52 = calculate_register_52(1);         // arranque físico speed 1
                printf("Escribiendo r50  = %d\n", r50); fflush(stdout);
                printf("Escribiendo r52  = %d\n", r52); fflush(stdout);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 52, r52);
            }
        pthread_mutex_lock(&smartgreen->data_mutex);
        smartgreen->zone_params[zone_idx].fan_speed_cmd = 1;
        pthread_mutex_unlock(&smartgreen->data_mutex);
        free(args);
        return (NULL);
    }

    printf("PREWET THREAD ARRANCADO zone_id=%d zone_idx=%d\n", zone_id, zone_idx); fflush(stdout);

    free(args);
    if (zone_idx == -1)
    {
        printf("PREWET ERROR: zone_idx=-1\n"); fflush(stdout);
        return (NULL);
    }

    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
    pthread_mutex_unlock(&smartgreen->data_mutex);

    printf("PREWET iniciando cooler_prewet...\n"); fflush(stdout);
    cooler_prewet(smartgreen, zone_id);

    pthread_mutex_lock(&smartgreen->data_mutex);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            smartgreen->coolers[i].fan_on = 1;
    pthread_mutex_unlock(&smartgreen->data_mutex);

    ft_ws_broadcast_status(smartgreen);

    // Fan speed ANTES de quitar el flag de prewet
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        if (smartgreen->coolers[i].zone_id == zone_id)
        {
            int r50 = calculate_register_50(0, 1, 1);                                                           // pump=1 + fan_speed=1
            int r52 = calculate_register_52(1);                                                                 // arranque físico speed 1
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 52, r52);
        }
    }

    sleep(40);  // esperar que fan arranque físicamente antes de activar alarmas

    printf("PREWET finalizado\n"); fflush(stdout);
    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
    smartgreen->zone_params[zone_idx].fan_speed_cmd = 1;
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
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, 1);
                while (elapsed < drain_time)
                {
                    sleep(interval);
                    elapsed += interval;
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, 1);
                }
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, 0);
            }
        }
    }
    return (0);
}

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
    
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        if (smartgreen->coolers[i].zone_id == zone_id)
        {
            printf("ESTADO Cooler (unit=%d) comenzando: [PREWET]: pump=%d fan=%d cool=%d speed=%d\n", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].pump_on, smartgreen->coolers[i].fan_on, smartgreen->coolers[i].cool_mode_on, smartgreen->coolers[i].actual_fan_speed);
            fflush(stdout);
        }
    }

    // PASO 1 — cerrar solenoide + drain closed (R_51 → addr 50)
    printf("PREWET paso 1: cerrar solenoide + drain (addr=50 val=%d)\n", calculate_register_51(0, 1)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_enqueue(&smartgreen->modbus_queue,CMD_WRITE, smartgreen->coolers[i].unit_id, 50, calculate_register_51(0, 1));

    printf("PREWET esperando %ds antes de abrir solenoide...\n", db_read_config(smartgreen, "prewet_delay_solenoid")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_solenoid"));

    // PASO 2 — abrir solenoide ON (R_51 → addr 50)
    printf("PREWET paso 2: abrir solenoide (addr=50 val=%d)\n", calculate_register_51(1, 1)); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 50, calculate_register_51(1, 1));

    // PASO 3 — esperar agua (max_wait segundos)
    printf("PREWET paso 3: esperando agua (max=%ds interval=%ds)\n", max_wait, check_interval); fflush(stdout);
    while (elapsed < max_wait)
    {
        sleep(check_interval);
        elapsed += check_interval;
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
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 1, 0));
    
    printf("PREWET esperando %ds con bomba encendida...\n", db_read_config(smartgreen, "prewet_delay_pump")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_pump"));
    
    printf("PREWET completado\n"); fflush(stdout);
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].last_prewet = get_timestamp();
    pthread_mutex_unlock(&smartgreen->data_mutex);
    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    printf("PREWET GUARDADO last_prewet=%ld\n", (long)smartgreen->zone_params[zone_idx].last_prewet); fflush(stdout);
    
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        if (smartgreen->coolers[i].zone_id == zone_id)
        {
            printf("ESTADO Cooler (unit=%d) después de [PREWET completado]: pump=%d fan=%d cool=%d speed=%d\n", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].pump_on, smartgreen->coolers[i].fan_on, smartgreen->coolers[i].cool_mode_on, smartgreen->coolers[i].actual_fan_speed);
            fflush(stdout);
        }
    }

    return (0);
}
