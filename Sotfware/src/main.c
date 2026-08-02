#include "../incl/smartgreen.h"

volatile sig_atomic_t g_sigint_received = 0;
volatile sig_atomic_t g_sigterm_received = 0;
volatile sig_atomic_t g_alarm_modbus = 0;

int ft_modbus(t_smartgreen *smartgreen)
{
    if (ft_modbus_init(smartgreen) == -1)
        return (-1);
    
    for (int i = 0; i < smartgreen->num_coolers; i++)
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_READ_COOLER, smartgreen->coolers[i].unit_id, 0, 0);
    for (int i = 0; i < smartgreen->num_sensors; i++)
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_READ_SENSOR, smartgreen->sensors[i].sensor_id, 0, 0);
    return (0);
}

int ft_check_database(t_smartgreen *smartgreen)
{
    if (db_init(smartgreen) == -1)
        return (-1);
    
    ft_init_config(smartgreen);
    ft_init_users(smartgreen);
    ft_init_struct(smartgreen);

    if (ft_init_data(smartgreen) == -1)
        return (-1);
    return (0);
}

int main(void)
{
    t_smartgreen    *smartgreen;

    smartgreen = malloc(sizeof(t_smartgreen));
    if (!smartgreen)
        return (1);
    memset(smartgreen, 0, sizeof(t_smartgreen));
    pthread_mutex_init(&smartgreen->data_mutex, NULL);
    ft_modbus_queue_init(&smartgreen->modbus_queue);

    init_signal();
    
    if (ft_check_database(smartgreen) == -1)
    {
        ft_free_structs(smartgreen);
        return (1);
    }

    pthread_create(&smartgreen->modbus_thread.tid, NULL, ft_modbus_worker, smartgreen);     // Arrancar worker thread Modbus
    ft_modbus(smartgreen);

    if (api_start(smartgreen) == -1)
    {
        ft_modbus_queue_stop(&smartgreen->modbus_queue);
        pthread_join(smartgreen->modbus_thread.tid, NULL);
        sqlite3_close(smartgreen->db);
        ft_free_modbus(smartgreen);
        ft_free_structs(smartgreen);
        return(1);
    }

    if (ft_ws_init(smartgreen) == -1)
    {
        ft_modbus_queue_stop(&smartgreen->modbus_queue);
        pthread_join(smartgreen->modbus_thread.tid, NULL);
        sqlite3_close(smartgreen->db);
        ft_free_modbus(smartgreen);
        ft_free_structs(smartgreen);
        return(1);
    }
    
    scheduler_run(smartgreen);          // bucle principal
    ft_ws_stop(smartgreen);

    ft_modbus_queue_stop(&smartgreen->modbus_queue);
    pthread_join(smartgreen->modbus_thread.tid, NULL);
    ft_modbus_queue_destroy(&smartgreen->modbus_queue);

    api_stop(smartgreen);

    if (smartgreen->db)
        sqlite3_close(smartgreen->db);
    
    pthread_mutex_destroy(&smartgreen->data_mutex);
    ft_free_modbus(smartgreen);
    ft_free_structs(smartgreen);
    return (0);
}


/*

sudo pkill -f SmartGreenAPI
sleep 3
ps aux | grep -i java | grep -v grep

*/



/*


## Pendiente inmediato (laboratorio)
```
⬜ 1. cooler_prewet — revisar e implementar popup en frontend
⬜ 2. Lectura de Bomba — revisar que lee bien (ahora no lee)
⬜ 3. Lectura de Solenoide — revisar que lee bien (ahora no lee)
⬜ 4. Dashboard — logo/spinner hasta tener datos reales
⬜ 5. Lectura de agua — revisar que lee bien
⬜ 6. Sensor 177/178 — verificar en laboratorio
⬜ 7. ON/OFF individual por cooler en dashboard
```

## Funcionalidades frontend pendientes
```
⬜ 8. Programador horario — nueva página con icono calendario en menú lateral
⬜ 9. Botones COOL/FAN/AUTO/IMD — hacerlos funcionales en pantalla Control
⬜ 10. Modo test — verificar cada actuador individualmente (popup desde dashboard)
⬜ 11. Multi-idioma — español, inglés, catalán
```

## Funcionalidades avanzadas
```
⬜ 12. Consumo energético estimado — por zona y por cooler
⬜ 13. Free cooling — usar aire exterior cuando temperatura < setpoint
⬜ 14. Modo vacaciones — apagado programado por fechas
⬜ 15. Alertas mantenimiento preventivo:
        - Limpieza filtros
        - Limpieza bandejas
        - Revisión correas ventilador
        - Revisión bomba
        - Tratamiento antilegionela
        - Revisión válvulas
        - Análisis agua (salinidad manual)
        - Revisión eléctrica anual
```

## Infraestructura pendiente
```
⬜ 16. Servidor central Australair (API + PostgreSQL + mapa España/Portugal)
⬜ 17. NIVEL 4 — Portal Admin Aaron
⬜ 18. NIVEL 2 — Portal Cliente
⬜ 19. NIVEL 3 — Portal Técnico SAT + academy.australair.com
⬜ 20. Hash SHA256/bcrypt passwords
⬜ 21. Validar token en cada petición
⬜ 22. Logo arranque Pi (resolver en IXHUB producción)
```

*/

/*

# Terminal 1 — debug en tiempo real
ssh pi@<IP_WIFI_PI>
tail -f /tmp/sg_debug.log

# Terminal 2 — mandar comandos
# Prueba 1 — encender zona
curl -X POST http://<IP_WIFI_PI>:8080/api/zones/1/onoff \
  -H "Content-Type: application/json" \
  -d '{"action":"ON"}'

# Prueba 2 — ver estado cooler
curl http://<IP_WIFI_PI>:8080/api/coolers | python3 -m json.tool

# Prueba 3 — apagar zona
curl -X POST http://<IP_WIFI_PI>:8080/api/zones/1/onoff \
  -H "Content-Type: application/json" \
  -d '{"action":"OFF"}'

# Prueba 4 — drenaje inmediato
curl -X POST http://<IP_WIFI_PI>:8080/api/zones/1/drain \
  -H "Content-Type: application/json" \
  -d '{"action":"ON"}'

# Prueba 5 — cambiar modo
curl -X POST http://<IP_WIFI_PI>:8080/api/zones/1/mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"FAN"}'

# Prueba 6 — ver nuevos campos
curl http://<IP_WIFI_PI>:8080/api/coolers | python3 -m json.tool | grep -E "ramp_rate|cold_starts|fan_hours|tank_drains"

*/

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