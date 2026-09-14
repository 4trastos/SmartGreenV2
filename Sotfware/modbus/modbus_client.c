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

// int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id)
// {
//     uint16_t    tab_reg[MODBUS_COOLER_REGS];
//     char        sql_hrs[128];
//     int         rc;
//     int         unit_idx = ft_find_cooler(smartgreen, unit_id);
//     if (unit_idx == -1)
//         return (-1);

//     if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
//     {
//         fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
//         return (-1);
//     }

//     // Leer registros de fault (R799-R804)
//     // uint16_t tab_fault[6];
//     // if (modbus_read_registers(smartgreen->modbus_ctx, 799, 6, tab_fault) != -1)
//     // {
//     //     uint16_t r803 = tab_fault[4];
//     //     uint16_t nibble = (r803 >> 12) & 0x0F;
//     //     if (r803 != 0)
//     //     {
//     //         pthread_mutex_lock(&smartgreen->data_mutex);
//     //         smartgreen->coolers[unit_idx].fault_r803     = r803;
//     //         smartgreen->coolers[unit_idx].alarm_pump     = (nibble & 0x01) ? 1 : 0;
//     //         smartgreen->coolers[unit_idx].alarm_drain    = (nibble & 0x02) ? 1 : 0;
//     //         smartgreen->coolers[unit_idx].alarm_solenoid = (nibble & 0x04) ? 1 : 0;
//     //         smartgreen->coolers[unit_idx].alarm_fan_hw   = (nibble & 0x08) ? 1 : 0;
//     //         pthread_mutex_unlock(&smartgreen->data_mutex);
//     //         printf("[FAULT R803=0x%04X pump=%d drain=%d solenoid=%d fan=%d]\n",
//     //             r803,
//     //             smartgreen->coolers[unit_idx].alarm_pump,
//     //             smartgreen->coolers[unit_idx].alarm_drain,
//     //             smartgreen->coolers[unit_idx].alarm_solenoid,
//     //             smartgreen->coolers[unit_idx].alarm_fan_hw);
//     //         fflush(stdout);
//     //     }
//     // }

//     uint16_t tab_extras[10];
//     modbus_read_registers(smartgreen->modbus_ctx, 799, 6, tab_extras);
//     printf("[REG799] ");
//     for (int i = 0; i < 6; i++)
//         printf("R%d=0x%04X ", 799+i, tab_extras[i]);
//     printf("\n"); fflush(stdout);

//     rc = modbus_read_registers(smartgreen->modbus_ctx, 0, MODBUS_COOLER_REGS, tab_reg);
//     if (rc == -1)
//     {
//         pthread_mutex_lock(&smartgreen->data_mutex);
//         if (!smartgreen->coolers[unit_idx].disabled)
//             fprintf(stderr, "Error Modbus Read Register (Cooler): ( %s )\n", modbus_strerror(errno));
//         smartgreen->coolers[unit_idx].error_count++;
//         if (smartgreen->coolers[unit_idx].error_count > MAX_COOLER_ERRORS)
//         {
//             smartgreen->coolers[unit_idx].disabled = 1;
//             smartgreen->coolers[unit_idx].alarm_comms = 1;
//         }
//         pthread_mutex_unlock(&smartgreen->data_mutex);
//         return (-1);
//     }

//     decode_cooler_state(tab_reg, &smartgreen->coolers[unit_idx]);
//     pthread_mutex_lock(&smartgreen->data_mutex);
//     smartgreen->coolers[unit_idx].error_count = 0;
//     smartgreen->coolers[unit_idx].disabled = 0;
//     smartgreen->coolers[unit_idx].alarm_comms = 0;
//     smartgreen->coolers[unit_idx].last_read = get_timestamp();
//     if (smartgreen->coolers[unit_idx].fan_on)
//         smartgreen->coolers[unit_idx].hours_running += smartgreen->read_interval;
//     snprintf(sql_hrs, sizeof(sql_hrs), "UPDATE cooler_state SET hours_running=%.1f WHERE unit_id=%d", smartgreen->coolers[unit_idx].hours_running, unit_id);
//     sqlite3_exec(smartgreen->db, sql_hrs, NULL, NULL, NULL);
//     pthread_mutex_unlock(&smartgreen->data_mutex);
//     return (0);
// }

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
    
    // uint16_t tab_extras[10];
    // modbus_read_registers(smartgreen->modbus_ctx, 799, 6, tab_extras);
    // printf("[REG799] ");
    // for (int i = 0; i < 6; i++)
    //     printf("R%d=0x%04X ", 799+i, tab_extras[i]);
    // printf("\n"); fflush(stdout);

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
    // db_save_cooler(smartgreen, &smartgreen->coolers[unit_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (0);
}

int     ft_modbus_read_sensor(t_smartgreen *smartgreen, int unit_id)
{
    uint16_t    tab_reg[MODBUS_SENSOR_REGS];
    int         rc;
    int         unit_idx = ft_find_sensor(smartgreen, unit_id);
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
        pthread_mutex_lock(&smartgreen->data_mutex); 
        if (!smartgreen->sensors[unit_idx].disabled)
            fprintf(stderr, "Error Modbus Read Register (Sensor): ( %s )\n", modbus_strerror(errno));
        smartgreen->sensors[unit_idx].error_count++;
        if (smartgreen->sensors[unit_idx].error_count > MAX_SENSOR_ERRORS)
        {
            smartgreen->sensors[unit_idx].disabled = 1;
            smartgreen->sensors[unit_idx].alarm_signal = 1;
            smartgreen->sensors[unit_idx].valid = 0;          
            smartgreen->sensors[unit_idx].temperature = 0.0f; 
            smartgreen->sensors[unit_idx].humidity = 0.0f;  
            // db_save_error(smartgreen, smartgreen->coolers[unit_idx].unit_id, modbus_strerror(errno));
        }
        pthread_mutex_unlock(&smartgreen->data_mutex); 
        return (-1);
    }

    decode_sensor_state(tab_reg, &smartgreen->sensors[unit_idx]);
    pthread_mutex_lock(&smartgreen->data_mutex);
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