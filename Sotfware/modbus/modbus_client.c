#include "../incl/smartgreen.h"

int     ft_modbus_init(t_smartgreen *smartgreen)
{
    modbus_t    *ctx;

    ctx = modbus_new_rtu(MODBUS_PORT, MODBUS_BAUD, MODBUS_PARITY, MODBUS_DATA_BITS, MODBUS_STOP_BITS);
    if (!ctx)
    {
        fprintf(stderr, "Modbus data load error ( %s )\n", modbus_strerror(errno));
        return (-1);
    }

    if (modbus_connect(ctx) == -1)
    {
        fprintf(stderr, "Modbus connect error ( %s )\n", modbus_strerror(errno));
        return (-1);
    }

    modbus_set_response_timeout(ctx, 1, 0);

    // Añadir timeout de bytes para evitar cortes por retardos de hardware en Linux
    modbus_set_byte_timeout(ctx, 0, 500000);
    printf("Modbus connected correctly\n");
    smartgreen->modbus_ctx = ctx;
    return (0);
}

int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id)
{
    uint16_t    tab_reg[MODBUS_COOLER_REGS];
    char        sql_hrs[128];
    int         rc;
    int         unit_idx = ft_find_cooler(smartgreen, unit_id);
    if (unit_idx == -1)
        return (-1);

    if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
    {
        fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
        return (-1);
    }

    rc = modbus_read_registers(smartgreen->modbus_ctx, 0, MODBUS_COOLER_REGS, tab_reg);
    if (rc == -1)
    {
        pthread_mutex_lock(&smartgreen->data_mutex);
        if (!smartgreen->coolers[unit_idx].disabled)
            fprintf(stderr, "Error Modbus Read Register (Cooler): ( %s )\n", modbus_strerror(errno));
        smartgreen->coolers[unit_idx].error_count++;
        if (smartgreen->coolers[unit_idx].error_count > MAX_COOLER_ERRORS)
        {
            smartgreen->coolers[unit_idx].disabled = 1;
            smartgreen->coolers[unit_idx].alarm_comms = 1;
            // db_save_error(smartgreen, smartgreen->coolers[unit_idx].unit_id, modbus_strerror(errno));
        }
        pthread_mutex_unlock(&smartgreen->data_mutex); 
        return (-1);
    }
    
    decode_cooler_state(tab_reg, &smartgreen->coolers[unit_idx]);
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->coolers[unit_idx].error_count = 0;
    smartgreen->coolers[unit_idx].disabled = 0;
    smartgreen->coolers[unit_idx].alarm_comms = 0;
    smartgreen->coolers[unit_idx].last_read = get_timestamp();
    if (smartgreen->coolers[unit_idx].fan_on)
        smartgreen->coolers[unit_idx].hours_running += smartgreen->read_interval;
    snprintf(sql_hrs, sizeof(sql_hrs), "UPDATE cooler_state SET hours_running=%.1f WHERE unit_id=%d", smartgreen->coolers[unit_idx].hours_running, unit_id);
    sqlite3_exec(smartgreen->db, sql_hrs, NULL, NULL, NULL);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (0);
}

// int     ft_modbus_read_sensor(t_smartgreen *smartgreen, int unit_id)
// {
//     uint16_t    tab_reg[MODBUS_SENSOR_REGS];
//     int         rc;
//     char        msg[256];
//     int         unit_idx = ft_find_sensor(smartgreen, unit_id);
//     if (unit_idx == -1)
//         return (-1);

//     if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
//     {
//         fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
//         return (-1);
//     }

//     rc = modbus_read_registers(smartgreen->modbus_ctx, MODBUS_SENSOR_ADDR, MODBUS_SENSOR_REGS, tab_reg);
//     if (rc == -1)
//     {
//         pthread_mutex_lock(&smartgreen->data_mutex); 
//         if (!smartgreen->sensors[unit_idx].disabled)
//             fprintf(stderr, "Error Modbus Read Register (Sensor): ( %s )\n", modbus_strerror(errno));
//         smartgreen->sensors[unit_idx].error_count++;
//         if (smartgreen->sensors[unit_idx].error_count > MAX_SENSOR_ERRORS)
//         {
//             smartgreen->sensors[unit_idx].disabled = 1;
//             smartgreen->sensors[unit_idx].alarm_signal = 1;
//             smartgreen->sensors[unit_idx].valid = 0;          
//             smartgreen->sensors[unit_idx].temperature = 0.0f; 
//             smartgreen->sensors[unit_idx].humidity = 0.0f;
//             snprintf(msg, sizeof(msg), "🔴 CRITICO: Sensor sin señal sensor_id=%d", smartgreen->sensors[unit_idx].sensor_id);
//             db_save_error(smartgreen, smartgreen->sensors[unit_idx].sensor_id, msg);
//         }
//         pthread_mutex_unlock(&smartgreen->data_mutex); 
//         return (-1);
//     }

//     decode_sensor_state(tab_reg, &smartgreen->sensors[unit_idx]);
//     pthread_mutex_lock(&smartgreen->data_mutex);
//     smartgreen->sensors[unit_idx].disabled = 0;
//     smartgreen->sensors[unit_idx].error_count = 0;
//     smartgreen->sensors[unit_idx].alarm_signal = 0;
//     smartgreen->sensors[unit_idx].last_read = get_timestamp();
//     db_save_sensor(smartgreen, &smartgreen->sensors[unit_idx]);
//     pthread_mutex_unlock(&smartgreen->data_mutex);
//     return (0);
// }

int     ft_modbus_read_sensor(t_smartgreen *smartgreen, int unit_id)
{
    static int      lost_s = -1;                // segundos sin lectura buena para darlo por perdido (config)
    static time_t   started = 0;                // arranque: referencia para un sensor que aún no se ha leído
    uint16_t        tab_reg[MODBUS_SENSOR_REGS];
    int             rc;
    char            msg[320];
    int             unit_idx = ft_find_sensor(smartgreen, unit_id);

    if (lost_s == -1)
    {
        lost_s = db_read_config(smartgreen, "sensor_lost_seconds");
        if (lost_s <= 0)
            lost_s = 120;
    }
    if (!started)
        started = get_timestamp();
    if (unit_idx == -1)
        return (-1);

    if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
    {
        fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
        return (-1);
    }

    rc = modbus_read_registers(smartgreen->modbus_ctx, MODBUS_SENSOR_ADDR, MODBUS_SENSOR_REGS, tab_reg);
    if (rc == -1)
    {
        t_sensor_state  *s = &smartgreen->sensors[unit_idx];
        time_t          ref;

        modbus_flush(smartgreen->modbus_ctx);                   // limpiar restos de una respuesta a medias
        pthread_mutex_lock(&smartgreen->data_mutex);
        fprintf(stderr, "Error Modbus Read Register (Sensor): ( %s )\n", modbus_strerror(errno));
        s->error_count++;
        ref = s->last_read ? s->last_read : started;
        if (get_timestamp() - ref >= lost_s)
        {
            s->valid = 0;
            s->temperature = 0.0f;
            s->humidity = 0.0f;
            if (!s->alarm_signal)
            {
                s->alarm_signal = 1;
                snprintf(msg, sizeof(msg), "🔴 Sensor sensor_id=%d sin señal. Revise el sensor y su cable. Desconecte el cable del evaporativo al Modulink durante 4 minutos y vuelva a conectarlo para que el sensor vuelva a funcionar. Si después de esto no funciona, sustituya el sensor.",
                    s->sensor_id);
                db_save_error(smartgreen, s->sensor_id, msg);
            }
        }
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (-1);
    }

    decode_sensor_state(tab_reg, &smartgreen->sensors[unit_idx]);
    pthread_mutex_lock(&smartgreen->data_mutex);
    if (smartgreen->sensors[unit_idx].alarm_signal)
    {
        // Vuelve tras haberse dado por perdido: dejarlo en el historial
        snprintf(msg, sizeof(msg), "🟢 Sensor sensor_id=%d recuperado", smartgreen->sensors[unit_idx].sensor_id);
        db_save_error(smartgreen, smartgreen->sensors[unit_idx].sensor_id, msg);
    }
    smartgreen->sensors[unit_idx].disabled = 0;
    smartgreen->sensors[unit_idx].error_count = 0;
    smartgreen->sensors[unit_idx].alarm_signal = 0;
    smartgreen->sensors[unit_idx].last_read = get_timestamp();
    db_save_sensor(smartgreen, &smartgreen->sensors[unit_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (0);
}

int     ft_modbus_write_cooler(t_smartgreen *smartgreen, int unit_id, int addr, int value)
{
    uint16_t    val = (uint16_t)value;

    if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
    {
        fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
        return (-1);
    }

    if (modbus_write_registers(smartgreen->modbus_ctx, addr, 1, &val) == -1)
    {
        fprintf(stderr, "Error Modbus Write Register: ( %s )\n", modbus_strerror(errno));
        return(-1);
    }
    return (0);
}