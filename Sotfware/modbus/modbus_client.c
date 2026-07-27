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

    printf("Modbus connected correctly\n");
    smartgreen->modbus_ctx = ctx;
    return (0);
}

int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id)
{
    uint16_t    tab_reg[MODBUS_COOLER_REGS];
    int         rc;
    int         unit_idx = ft_find_cooler(smartgreen, unit_id);
    if (unit_idx == -1)
        return (-1);

    if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
    {
        fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
        return (-1);
    }
    
    pthread_mutex_lock(&smartgreen->modbus_mutex);
    rc = modbus_read_registers(smartgreen->modbus_ctx, 0, MODBUS_COOLER_REGS, tab_reg);
    if (rc == -1)
    {
        if (!smartgreen->coolers[unit_idx].disabled)
            fprintf(stderr, "Error Modbus Read Register (Cooler): ( %s )\n", modbus_strerror(errno));
        smartgreen->coolers[unit_idx].error_count++;
        if (smartgreen->coolers[unit_idx].error_count > MAX_COOLER_ERRORS)
        {
            smartgreen->coolers[unit_idx].disabled = 1;
            smartgreen->coolers[unit_idx].alarm_comms = 1;
            db_save_error(smartgreen, modbus_strerror(errno));
        }
        pthread_mutex_unlock(&smartgreen->modbus_mutex);
        return (-1);
    }
    
    decode_cooler_state(tab_reg, &smartgreen->coolers[unit_idx]);
    smartgreen->coolers[unit_idx].error_count = 0;
    smartgreen->coolers[unit_idx].disabled = 0;
    smartgreen->coolers[unit_idx].alarm_comms = 0;
    smartgreen->coolers[unit_idx].last_read = get_timestamp();
    if (smartgreen->coolers[unit_idx].fan_on)
        smartgreen->coolers[unit_idx].hours_running += smartgreen->read_interval;
    db_save_cooler(smartgreen, &smartgreen->coolers[unit_idx]);
    pthread_mutex_unlock(&smartgreen->modbus_mutex);
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

    pthread_mutex_lock(&smartgreen->modbus_mutex);
    rc = modbus_read_registers(smartgreen->modbus_ctx, MODBUS_SENSOR_ADDR, MODBUS_SENSOR_REGS, tab_reg);
    if (rc == -1)
    {
        if (!smartgreen->sensors[unit_idx].disabled)
            fprintf(stderr, "Error Modbus Read Register (Sensor): ( %s )\n", modbus_strerror(errno));
        smartgreen->sensors[unit_idx].error_count++;
        if (smartgreen->sensors[unit_idx].error_count > MAX_SENSOR_ERRORS)
        {
            smartgreen->sensors[unit_idx].disabled = 1;
            smartgreen->sensors[unit_idx].alarm_signal = 1;
            db_save_error(smartgreen, modbus_strerror(errno));
        }
        pthread_mutex_unlock(&smartgreen->modbus_mutex);
        return (-1);
    }

    decode_sensor_state(tab_reg, &smartgreen->sensors[unit_idx]);
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
    // if (modbus_write_registers(smartgreen->modbus_ctx, addr, 1, &val) == -1)
    if (modbus_write_register(smartgreen->modbus_ctx, addr, val) == -1)
    {
        fprintf(stderr, "Error Modbus Write Register: ( %s )\n", modbus_strerror(errno));
        return(-1);
    }
    return (0);
}