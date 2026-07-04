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
        modbus_free(ctx);
        return (-1);
    }

    printf("Modbus connected correctly\n");
    smartgreen->modbus_ctx = ctx;
    return (0);
}

int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id)
{
    (void)smartgreen;
    (void)unit_id;
    return (0);
}