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

    printf("Modbus connected correctly\n");
    smartgreen->modbus_ctx = ctx;
    return (0);
}

int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id)
{
    uint16_t    tab_reg[MODBUS_COOLER_REGS];
    int         rc;
    int         i = 0;

    while (i < smartgreen->num_coolers)
    {
        if (smartgreen->coolers[i].unit_id == unit_id)
            break;
        i++;
    }

    if (i == smartgreen->num_coolers)
    {
        printf("Error: Cooler not found\n");
        return (-1);
    }    
    
    if (smartgreen->coolers[i].error_count > MAX_COOLER_ERRORS)
    {
        fprintf(stderr, "Error: Cooler ( %d ) disabled (error_count=%d)\n", unit_id, smartgreen->coolers[i].error_count);
        return (-1);
    }

    if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
    {
        fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
        return (-1);
    }
    rc = modbus_read_registers(smartgreen->modbus_ctx, 0, MODBUS_COOLER_REGS, tab_reg);
    if (rc == -1)
    {
        fprintf(stderr, "Error Modbus Read Register (Cooler): ( %s )\n", modbus_strerror(errno));
        smartgreen->coolers[i].error_count++;
        db_save_error(smartgreen, modbus_strerror(errno));
        return (-1);
    }
    
    decode_cooler_state(tab_reg, &smartgreen->coolers[i]);
    smartgreen->coolers[i].error_count = 0;
    smartgreen->coolers[i].last_read = get_timestamp();
    db_save_cooler(smartgreen, &smartgreen->coolers[i]);
    return (0);
}

int     ft_modbus_read_sensor(t_smartgreen *smartgreen, int unit_id)
{
    uint16_t    tab_reg[MODBUS_SENSOR_REGS];
    int         rc;
    int         i = 0;

    while (i < smartgreen->num_sensors)
    {
        if (smartgreen->sensors[i].sensor_id == unit_id)
            break;
        i++;
    }
    
    if (i == smartgreen->num_sensors)
    {
        printf("Error: Sensor not found\n");
        return (-1);
    }

    if (smartgreen->sensors[i].error_count > MAX_SENSOR_ERRORS)
    {
        fprintf(stderr, "Error: Sensor ( %d ) disabled (error_count=%d)\n", unit_id, smartgreen->sensors[i].error_count);
        return (-1);
    }
    if (modbus_set_slave(smartgreen->modbus_ctx, unit_id) == -1)
    {
        fprintf(stderr, "Set Slave data error: ( %s )\n", modbus_strerror(errno));
        return (-1);
    }

    rc = modbus_read_registers(smartgreen->modbus_ctx, MODBUS_SENSOR_ADDR, MODBUS_SENSOR_REGS, tab_reg);
    if (rc == -1)
    {
        fprintf(stderr, "Error Modbus Read Register (Sensor): ( %s )\n", modbus_strerror(errno));
        smartgreen->sensors[i].error_count++;
        db_save_error(smartgreen, modbus_strerror(errno));
        return (-1);
    }

    decode_sensor_state(tab_reg, &smartgreen->sensors[i]);
    smartgreen->sensors[i].error_count = 0;
    smartgreen->sensors[i].last_read = get_timestamp();
    db_save_sensor(smartgreen, &smartgreen->sensors[i]);
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