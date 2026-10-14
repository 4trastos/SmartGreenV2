#include "../incl/smartgreen.h"

void *ft_drain_dry_thread(void *arg)
{
    t_drain_args    *args = (t_drain_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             unit_id = args->unit_id;
    int             zone_id = args->zone_id;
    int             zone_idx = ft_find_zone(smartgreen, zone_id);
    int             minuts = db_read_config(smartgreen, "drain_dry_minutes");
    int             speed  = db_read_config(smartgreen, "drain_dry_speed");

    if (minuts <= 0)
        minuts = 60;
    if (speed <= 0 || speed > 10)
        speed = 5;

    printf("[DRAIN_DRY] Iniciando - unit=%d zone=%d minutes=%d speed=%d\n", unit_id, zone_id, minuts, speed); fflush(stdout);

    // Marcar zona ocupada
    if (zone_idx != -1)
    {
        pthread_mutex_lock(&smartgreen->data_mutex);
        smartgreen->zone_params[zone_idx].drain_dry_running = 1;
        pthread_mutex_unlock(&smartgreen->data_mutex);
    }

    db_save_config(smartgreen, "drain_dry_active", 1);

    // Abrir drain sin solenoide
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_DRAIN_OPEN_SOLENOID_OFF);

    // Encender fan sin bomba
    uint16_t r50 = calculate_register_50(0, 0, speed);
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 49, r50);

    sleep(minuts * 60);

    // Cerrar drain y apagar
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_SOLENOID_OFF);
    ft_cooler_onoff(smartgreen, unit_id, 0);

    db_save_config(smartgreen, "drain_dry_active", 0);

    // Liberar flag
    if (zone_idx != -1)
    {
        pthread_mutex_lock(&smartgreen->data_mutex);
        smartgreen->zone_params[zone_idx].drain_dry_running = 0;
        pthread_mutex_unlock(&smartgreen->data_mutex);
    }

    printf("[DRAIN_DRY] Completado\n"); fflush(stdout);
    free(args);
    return (NULL);
}

void    *prewet_test_thread(void *arg)
{
    t_prewet_args   *args = (t_prewet_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             zone_id = args->zone_id;
    int             zone_idx = ft_find_zone(smartgreen, zone_id);

    printf("PREWET TEST THREAD ARRANCADO zone_id=%d\n", zone_id); fflush(stdout);

    // Lanzar prewet completo
    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].cool_fan_mode, "AUTO", sizeof(smartgreen->zone_params->cool_fan_mode));
    ft_strcpy(smartgreen->zone_params[zone_idx].on_off, "ON", sizeof(smartgreen->zone_params->on_off));
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
    pthread_mutex_unlock(&smartgreen->data_mutex);

    cooler_prewet(smartgreen, zone_id);

    // Restaurar modo — solo si NO es setup (en setup lo hacemos al final)
    if (!args->from_setup)
    {
        pthread_mutex_lock(&smartgreen->data_mutex);
        ft_strcpy(smartgreen->zone_params[zone_idx].cool_fan_mode, "IMD", sizeof(smartgreen->zone_params->cool_fan_mode));
        ft_strcpy(smartgreen->zone_params[zone_idx].on_off, "OFF", sizeof(smartgreen->zone_params->on_off));
        ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
        db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
        pthread_mutex_unlock(&smartgreen->data_mutex);
    }

    // Al terminar — apagar cooler
    printf("PREWET TEST completado — apagando cooler\n"); fflush(stdout);

    if (args->from_setup)
    {
        printf("PREWET SETUP — drenando agua sucia\n"); fflush(stdout);
        for (int i = 0; i < smartgreen->num_coolers; i++)
        {
            if (smartgreen->coolers[i].zone_id == zone_id)
            {
                // Parar la bomba y el fan
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, REG49_PARADA);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, REG49_APAGADO);
                // Abrir drain sin solenoide
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 50, REG50_DRAIN_OPEN_SOLENOID_OFF);
            }
        }
        sleep(90);
        printf("PREWET SETUP — agua sucia drenada\n"); fflush(stdout);

        // Ahora sí marcamos como terminado
        pthread_mutex_lock(&smartgreen->data_mutex);
        ft_strcpy(smartgreen->zone_params[zone_idx].cool_fan_mode, "AUTO", sizeof(smartgreen->zone_params->cool_fan_mode));
        ft_strcpy(smartgreen->zone_params[zone_idx].on_off, "OFF", sizeof(smartgreen->zone_params->on_off));
        ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
        db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
        pthread_mutex_unlock(&smartgreen->data_mutex);
    }
    
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
            ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, 0);

    free(args);
    return (NULL);
}

// int ft_auto_fan_speed(t_smartgreen *smartgreen, int zone_idx, float *error)
// {
//     float   temp_actual;
//     float   target_temp;
//     float   p_term;
//     float   speed;
//     int     min_speed;
//     int     max_speed;
//     int     sensor_idx;

//     // Buscar sensor INT de la zona
//     sensor_idx = -1;
//     for (int i = 0; i < smartgreen->num_sensors; i++)
//         if (smartgreen->sensors[i].zone_id == smartgreen->zone_params[zone_idx].zone_id && strcmp(smartgreen->sensors[i].type, "INT") == 0)
//             { sensor_idx = i; break; }
//     if (sensor_idx == -1 || !smartgreen->sensors[sensor_idx].valid)
//         return(3);                                                   // Velocidad por defecto si no hay sensor

//     temp_actual = smartgreen->sensors[sensor_idx].temperature;
//     target_temp = smartgreen->zone_params[zone_idx].target_temp;
//     min_speed = db_read_config(smartgreen, "min_setpoint_fan");
//     max_speed = db_read_config(smartgreen, "max_setpoint_fan");

//     // Control proporcional
//     *error = temp_actual - target_temp;

//     if (*error <= 0.0f)
//         smartgreen->zone_params[zone_idx].integral = 0.0f;
//     else
//     {
//         smartgreen->zone_params[zone_idx].integral += *error * 0.05f;
    
//         // Anti-windup 
//         if (smartgreen->zone_params[zone_idx].integral > 3.0f)
//             smartgreen->zone_params[zone_idx].integral = 3.0f;
//         if (smartgreen->zone_params[zone_idx].integral < 0.0f)
//             smartgreen->zone_params[zone_idx].integral = 0.0f;
//     }

//     p_term = *error * 0.8f;      // Kp = 1.5
//     speed = 1.0f + p_term + smartgreen->zone_params[zone_idx].integral;

//     // Clamp 1-10
//     if (speed < min_speed)
//         speed = min_speed;
//     if (speed > max_speed)
//         speed = max_speed;

//     printf("[AUTO] temp=%.1f target=%.1f error=%.1f speed=%d\n", temp_actual, target_temp, *error, (int)speed); fflush(stdout);
    
//     return ((int)speed);
// }

int ft_auto_fan_speed(t_smartgreen *smartgreen, int zone_idx, float *error)
{
    static int  min_speed = -1;         // leídos UNA vez: tras cambiar la config se reinicia el controlador
    static int  max_speed = -1;
    float       temp_actual;
    float       target_temp;
    float       p_term;
    float       speed;
    int         sensor_idx;

    if (min_speed == -1)
    {
        min_speed = db_read_config(smartgreen, "min_setpoint_fan");
        max_speed = db_read_config(smartgreen, "max_setpoint_fan");
        if (min_speed < 1)
            min_speed = 1;
        if (max_speed < 1 || max_speed > 10)
            max_speed = 10;
        if (min_speed > max_speed)
            min_speed = max_speed;
    }

    *error = -1.0f;                       // sin sensor: STANDBY (sin temperatura no se puede calcular la velocidad)

    // Buscar sensor INT de la zona
    sensor_idx = -1;
    for (int i = 0; i < smartgreen->num_sensors; i++)
        if (smartgreen->sensors[i].zone_id == smartgreen->zone_params[zone_idx].zone_id && strcmp(smartgreen->sensors[i].type, "INT") == 0)
            { sensor_idx = i; break; }
    if (sensor_idx == -1 || !smartgreen->sensors[sensor_idx].valid)
    {
         printf("[AUTO] zona %d sin sensor INT válido → standby\n", smartgreen->zone_params[zone_idx].zone_id); fflush(stdout);
        return (0); 
    }

    temp_actual = smartgreen->sensors[sensor_idx].temperature;
    target_temp = smartgreen->zone_params[zone_idx].target_temp;

    // Control proporcional
    *error = temp_actual - target_temp;

    if (*error <= 0.0f)
        smartgreen->zone_params[zone_idx].integral = 0.0f;
    else
    {
        smartgreen->zone_params[zone_idx].integral += *error * 0.05f;
        // Anti-windup
        if (smartgreen->zone_params[zone_idx].integral > 3.0f)
            smartgreen->zone_params[zone_idx].integral = 3.0f;
        if (smartgreen->zone_params[zone_idx].integral < 0.0f)
            smartgreen->zone_params[zone_idx].integral = 0.0f;
    }

    p_term = *error * 0.8f;      // Kp = 0.8
    speed = 1.0f + p_term + smartgreen->zone_params[zone_idx].integral;

    if (speed < min_speed)
        speed = min_speed;
    if (speed > max_speed)
        speed = max_speed;

    printf("[AUTO] temp=%.1f target=%.1f error=%.1f speed=%d\n", temp_actual, target_temp, *error, (int)speed); fflush(stdout);
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
    if ((now - smartgreen->coolers[cooler_idx].last_off) >= (15 * 60))
        return (1);
    return (0);
}

void    *ft_drain_thread(void *arg)
{
    t_drain_args    *args = (t_drain_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             unit_id = args->unit_id;
    int             zone_idx = 0;
    int             drain_delay = db_read_config(smartgreen, "salinity_drain_delay");
    int             trigger = db_read_config(smartgreen, "salinity_trigger");
    int             drain_periodic_time = db_read_config(smartgreen, "drain_periodic_time");
    int             max_time = 600;
    int             elapsed;
    float           sal = 0.0f;
    float           target = trigger - 200;

    printf("DRAIN THREAD ARRANCADO unit_id=%d reason=%d\n", unit_id, args->reason); fflush(stdout);

    if (args->reason == DRAIN_PERIODIC || args->reason == DRAIN_SALINITY)
    {
        int skip = 1;
        int speed = 0;

        pthread_mutex_lock(&smartgreen->data_mutex);
        zone_idx = ft_find_zone(smartgreen, args->zone_id);
        if (zone_idx != -1)
        {
            skip = (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "FAN") == 0) || (strcmp(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes") == 0);         // prewet en marcha: no mezclar
            speed = smartgreen->zone_params[zone_idx].fan_speed_cmd;
        }
        pthread_mutex_unlock(&smartgreen->data_mutex);

        // Modo FAN — solo ventila, no usa agua: no se drena
        if (skip)
        {
            printf("DRAIN PERIODIC/SALINITY omitido omitido (modo FAN)\n"); fflush(stdout);
            free(args);
            return (NULL);
        }

        int r51 = speed ? ((speed << 12) | 0x0700) : 0;     // formato sniffing MagiTouch
        int r52 = speed * 0x11;

        // Abrir drain: bomba + solenoide + drenaje abierto, fan a su velocidad
        printf("DRAIN %s: abrir drain speed=%d\n", args->reason == DRAIN_PERIODIC ? "PERIODIC" : "SALINITY", speed); fflush(stdout);
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_DRAIN_OPEN_SOLENOID_ON | 0x07);
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 51, r51);
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 52, r52);

        if (args->reason == DRAIN_PERIODIC)
            sleep(drain_periodic_time);
        else
        {
            // SALINITY: drenar hasta 200 uS por debajo del máximo (límite de seguridad: 10 min)
            int cooler_idx = ft_find_cooler(smartgreen, unit_id);
            elapsed = 0;
            while (elapsed < max_time)
            {
                sleep(5);           // la salinidad se actualiza en cada lectura
                elapsed += 5;
                pthread_mutex_lock(&smartgreen->data_mutex);
                sal = (cooler_idx != -1) ? smartgreen->coolers[cooler_idx].salinity_us : 0.0f;
                pthread_mutex_unlock(&smartgreen->data_mutex);
                printf("DRAIN SALINITY: %ds sal=%.1f objetivo<=%.1f\n", elapsed, sal, target); fflush(stdout);
                if (sal <= target)
                    break;
            }
            if (elapsed >= max_time)
                printf("DRAIN SALINITY: tiempo máximo alcanzado (sal=%.1f)\n", sal);
        }

        // Cerrar drain — solo si la zona sigue encendida (si no, R50=31 + fan volvería a encender todo)   // ←
        pthread_mutex_lock(&smartgreen->data_mutex);
        int zone_on = (zone_idx != -1 && strcmp(smartgreen->zone_params[zone_idx].on_off, "ON") == 0);
        pthread_mutex_unlock(&smartgreen->data_mutex);
        if (zone_on)
        {
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_SOLENOID_ON | 0x07);
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 51, r51);
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 52, r52);
            printf("DRAIN %s completado\n", args->reason == DRAIN_PERIODIC ? "PERIODIC" : "SALINITY"); fflush(stdout);
        }
        else
        {
            printf("DRAIN %s terminado: zona apagada, no se reenciende\n", args->reason == DRAIN_PERIODIC ? "PERIODIC" : "SALINITY"); fflush(stdout);
        }
        
        free(args);
        return (NULL);
    }

    if (args->reason == DRAIN_SAFETY)
    {
        int zone_on = 0;

        if (drain_delay <= 0)
            drain_delay = 60;
        printf("DRAIN SAFETY: abrir drain %ds\n", drain_delay); fflush(stdout);
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, 0);                    // solenoid=OFF, drain=OPEN

        // Esperar, pero abortar si encienden la zona (el prewet toma el control del R50)
        for (int s = 0; s < drain_delay && !zone_on; s++)
        {
            sleep(1);
            pthread_mutex_lock(&smartgreen->data_mutex);
            zone_idx = ft_find_zone(smartgreen, args->zone_id);
            zone_on = (zone_idx != -1 && strcmp(smartgreen->zone_params[zone_idx].on_off, "ON") == 0);
            pthread_mutex_unlock(&smartgreen->data_mutex);
        }

        if (zone_on)
            printf("DRAIN SAFETY abortado: zona encendida\n");
        else
        {
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_SOLENOID_OFF);  // solenoid=OFF, drain=CLOSED
            printf("DRAIN SAFETY completado\n");
        }
        fflush(stdout);
        free(args);
        return (NULL);
    }

    // if (args->reason == DRAIN_SALINITY)
    // {
    //     int skip = 1;

    //     pthread_mutex_lock(&smartgreen->data_mutex);
    //     zone_idx = ft_find_zone(smartgreen, args->zone_id);
    //     if (zone_idx != -1)
    //     {
    //         skip = (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "FAN") == 0);
    //         if (!skip)      // el scheduler no toca la zona mientras drena
    //             ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
    //     }
    //     pthread_mutex_unlock(&smartgreen->data_mutex);

    //     // Modo FAN — no usa agua: no hay nada que renovar
    //     if (skip)
    //     {
    //         printf("DRAIN SALINITY omitido (modo FAN)\n"); fflush(stdout);
    //         free(args);
    //         return (NULL);
    //     }

    //     printf("DRAIN SALINITY: apagar bomba y fan\n"); fflush(stdout);
    //     ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 49, REG49_PARADA);
    //     ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 49, REG49_APAGADO);
    //     ft_cooler_outputs(smartgreen, unit_id, 0, 0, 0);                                            // R50=16 + fan 0
    //     sleep(2);

    //     printf("DRAIN SALINITY paso 1: abrir drain\n"); fflush(stdout);
    //     ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_DRAIN_OPEN_SOLENOID_OFF);   // R50=0: drenaje abierto
    //     sleep(drain_delay);

    //     printf("DRAIN SALINITY paso 2: cerrar drain + abrir solenoide\n"); fflush(stdout);
    //     ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, 50, REG50_SOLENOID_ON);    // R50=24: cerrado + rellenar
    //     sleep(drain_interval);

    //     printf("DRAIN SALINITY completado\n"); fflush(stdout);
    //     pthread_mutex_lock(&smartgreen->data_mutex);
    //     zone_idx = ft_find_zone(smartgreen, args->zone_id);
    //     if (zone_idx != -1)
    //     {
    //         for (int i = 0; i < smartgreen->num_coolers; i++)
    //             if (smartgreen->coolers[i].unit_id == unit_id)
    //             {
    //                 smartgreen->coolers[i].alarm_salinity = 0;
    //                 break;
    //             }
    //         // Devolver el control: el scheduler rearranca bomba + fan en su siguiente ciclo
    //         if (strcmp(smartgreen->zone_params[zone_idx].on_off, "ON") == 0)
    //         {
    //             if (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "MANUAL") == 0)
    //                 smartgreen->zone_params[zone_idx].pump_on = 0;          // MANUAL reenvía al ver pump_on = 0
    //             else
    //             {
    //                 smartgreen->zone_params[zone_idx].pump_on = 1;          // AUTO reenvía al ver fan_speed_cmd = 0
    //                 smartgreen->zone_params[zone_idx].fan_speed_cmd = 0;
    //             }
    //         }
    //         ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
    //     }
    //     pthread_mutex_unlock(&smartgreen->data_mutex);
    // }
    free(args);
    return (NULL);

}

void    *prewet_thread(void *arg)
{
    t_prewet_args   *args = (t_prewet_args *)arg;
    t_smartgreen    *smartgreen = args->smartgreen;
    int             zone_id = args->zone_id;
    int             need_prewet = args->need_prewet;
    int             zone_idx = ft_find_zone(smartgreen, zone_id);

    free(args);
    if (zone_idx == -1)
    {
        printf("PREWET ERROR: zone_idx=-1\n"); fflush(stdout);
        return (NULL);
    }

    if (!need_prewet)
    {
        printf("PREWET THREAD NO ARRANCA [Ya está humedo] zone_id=%d zone_idx=%d\n", zone_id, zone_idx); fflush(stdout);
        // Sin prewet: AUTO/MANUAL arrancan directamente solenoide + bomba + fan
        pthread_mutex_lock(&smartgreen->data_mutex);
        if (smartgreen->zone_params[zone_idx].last_prewet == 0)
            smartgreen->zone_params[zone_idx].last_prewet = get_timestamp();
    }
    else
    {
        printf("PREWET THREAD ARRANCADO zone_id=%d zone_idx=%d\n", zone_id, zone_idx); fflush(stdout);
        pthread_mutex_lock(&smartgreen->data_mutex);
        ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes", sizeof(smartgreen->zone_params->prewet_in_progress));
        pthread_mutex_unlock(&smartgreen->data_mutex);

        printf("PREWET iniciando cooler_prewet...\n"); fflush(stdout);
        cooler_prewet(smartgreen, zone_id);         // termina con bomba ON, fan parado

        printf("PREWET finalizado\n"); fflush(stdout);
        pthread_mutex_lock(&smartgreen->data_mutex);
    }

    // Pasar el control a AUTO / MANUAL
    if (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "MANUAL") == 0)
    {
        // MANUAL: bomba ON + fan a la velocidad del usuario, ya
        int speed = smartgreen->zone_params[zone_idx].fan_speed_cmd;
        if (ft_is_quiet_mode(smartgreen) && speed > ft_quiet_max_speed(smartgreen))
            speed = ft_quiet_max_speed(smartgreen);
        smartgreen->zone_params[zone_idx].pump_on = 1;
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
            {
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 1, speed));
                ft_cooler_outputs(smartgreen, smartgreen->coolers[i].unit_id, 1, 1, speed);    // R50=31 + fan del usuario
            }
    }
    else
    {
        // AUTO: el scheduler calcula la velocidad en su siguiente ciclo
        smartgreen->zone_params[zone_idx].pump_on = 1;
        smartgreen->zone_params[zone_idx].fan_speed_cmd = 0;    // fuerza que AUTO la envíe
    }
    ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    ft_ws_broadcast_status(smartgreen);
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
    {
        pthread_mutex_lock(&smartgreen->data_mutex);
        ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
        db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (0);
    }
    
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
    while (elapsed < max_wait)
    {
        sleep(check_interval);
        elapsed += check_interval;
        all_water = 1;
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zone_id)
            {
                printf("PREWET agua cooler unit=%d water_present=%d salinity_us=%.1f\n", smartgreen->coolers[i].unit_id,
                    smartgreen->coolers[i].water_present, smartgreen->coolers[i].salinity_us); fflush(stdout);
                // Usar salinity_us en vez de water_present
                if (smartgreen->coolers[i].salinity_us < 10.0f)
                    all_water = 0;
            }
        printf("PREWET agua: elapsed=%d all_water=%d\n", elapsed, all_water); fflush(stdout);
        if (all_water)
            break;
    }

    // PASO 4 — esperar prewet_delay_water
    printf("PREWET paso 4: agua detectada, esperando %ds...\n", db_read_config(smartgreen, "prewet_delay_water")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_water"));
    
    // PASO 5 — encender bomba (solenoide sigue ON, drenaje cerrado, fan parado)
    printf("PREWET paso 5: encender bomba\n"); fflush(stdout);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == zone_id)
        {
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, 1, 0));
            ft_cooler_outputs(smartgreen, smartgreen->coolers[i].unit_id, 1, 1, 0);    // R50=31
        }

    printf("PREWET esperando %ds con bomba encendida...\n", db_read_config(smartgreen, "prewet_delay_pump")); fflush(stdout);
    sleep(db_read_config(smartgreen, "prewet_delay_pump"));
    
    printf("PREWET completado\n"); fflush(stdout);
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].last_prewet = get_timestamp();
    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);
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
