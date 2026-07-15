#include "../incl/smartgreen.h"

volatile sig_atomic_t g_sigint_received = 0;
volatile sig_atomic_t g_sigterm_received = 0;
volatile sig_atomic_t g_alarm_modbus = 0;

int ft_modbus(t_smartgreen *smartgreen)
{
    int i = 0;

    if (ft_modbus_init(smartgreen) == -1)
        return (-1);
    while (i < smartgreen->num_coolers)
    {
        ft_modbus_read_cooler(smartgreen, smartgreen->coolers[i].unit_id);
        i++;
    }

    i = 0;
    while (i < smartgreen->num_sensors)
    {
        ft_modbus_read_sensor(smartgreen, smartgreen->sensors[i].sensor_id);
        i++;
    }
    
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

    init_signal();
    
    if (ft_check_database(smartgreen) == -1)
    {
        ft_free_structs(smartgreen);
        return (1);
    }

    ft_modbus(smartgreen);              // intenta conectar, pero aunque falle seguimos
    if (api_start(smartgreen) == -1)
    {
        sqlite3_close(smartgreen->db);
        ft_free_modbus(smartgreen);
        ft_free_structs(smartgreen);
        return(1);
    }

    if (ft_ws_init(smartgreen) == -1)
    {
        sqlite3_close(smartgreen->db);
        ft_free_modbus(smartgreen);
        ft_free_structs(smartgreen);
        return(1);
    }
    
    scheduler_run(smartgreen);          // el scheduler corre siempre
    ft_ws_stop(smartgreen);

    if (api_stop(smartgreen) == -1)
    {
        sqlite3_close(smartgreen->db);
        ft_free_modbus(smartgreen);
        ft_free_structs(smartgreen);
        return (1);
    }

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
