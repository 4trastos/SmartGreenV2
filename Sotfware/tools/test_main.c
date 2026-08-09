#include "../incl/smartgreen.h"

volatile sig_atomic_t g_sigint_received = 0;
volatile sig_atomic_t g_sigterm_received = 0;
volatile sig_atomic_t g_alarm_modbus = 0;

int main(int argc, char **argv)
{
    (void)argc;
    (void)argv;
    return (0);
}


/*

sudo systemctl stop smartgreen-app

cat > /tmp/scan_sensor.c << 'EOF'
#include <stdio.h>
#include <errno.h>
#include <modbus/modbus.h>

int main() {
    modbus_t *ctx = modbus_new_rtu("/dev/ttyUSB0", 9600, 'N', 8, 1);
    modbus_set_response_timeout(ctx, 0, 500000);
    modbus_connect(ctx);
    modbus_set_debug(ctx, 0);
    
    uint16_t regs[4];
    printf("Escaneando bus RS485...\n");
    for (int id = 100; id <= 200; id++) {
        modbus_set_slave(ctx, id);
        if (modbus_read_registers(ctx, 299, 4, regs) != -1)
            printf("ENCONTRADO unit_id=%d addr=299 regs=%d %d %d %d\n", 
                   id, regs[0], regs[1], regs[2], regs[3]);
        if (modbus_read_registers(ctx, 0, 4, regs) != -1)
            printf("ENCONTRADO unit_id=%d addr=0 regs=%d %d %d %d\n", 
                   id, regs[0], regs[1], regs[2], regs[3]);
    }
    printf("Escaneo completado\n");
    modbus_close(ctx);
    modbus_free(ctx);
    return 0;
}
EOF

gcc /tmp/scan_sensor.c -o /tmp/scan_sensor -lmodbus && sudo /tmp/scan_sensor

*/

/*

cat > /tmp/scan_cooler.c << 'EOF'
#include <stdio.h>
#include <errno.h>
#include <modbus/modbus.h>

int main() {
    modbus_t *ctx = modbus_new_rtu("/dev/ttyUSB0", 9600, 'N', 8, 1);
    modbus_set_response_timeout(ctx, 1, 0);
    modbus_connect(ctx);
    modbus_set_slave(ctx, 2);  // unit_id=2 cooler laboratorio

    uint16_t regs[60];
    printf("Leyendo registros cooler unit_id=2...\n");
    if (modbus_read_registers(ctx, 0, 56, regs) == -1)
    {
        printf("ERROR: %s\n", modbus_strerror(errno));
        modbus_close(ctx);
        modbus_free(ctx);
        return (1);
    }

    printf("=== REGISTROS COOLER unit_id=2 ===\n");
    for (int i = 0; i < 56; i++)
        printf("regs[%02d]=0x%04X (%d)\n", i, regs[i], regs[i]);

    modbus_close(ctx);
    modbus_free(ctx);
    return 0;
}
EOF

gcc /tmp/scan_cooler.c -o /tmp/scan_cooler -lmodbus && sudo /tmp/scan_cooler

*/