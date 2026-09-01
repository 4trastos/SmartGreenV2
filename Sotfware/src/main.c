#include "../incl/smartgreen.h"

volatile sig_atomic_t g_sigint_received = 0;
volatile sig_atomic_t g_sigterm_received = 0;
volatile sig_atomic_t g_alarm_modbus = 0;
volatile sig_atomic_t g_update_pending = 0;

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
    db_cleanup_error_log(smartgreen);
    ft_init_config(smartgreen);
    ft_init_users(smartgreen);
    ft_init_struct(smartgreen);

    if (ft_init_data(smartgreen) == -1)
        return (-1);
    if (db_load_zone_params(smartgreen) == -1)
        return (-1);
    for (int i = 0; i < smartgreen->num_zones; i++)
    {
        ft_strcpy(smartgreen->zone_params[i].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
        db_update_zone_params(smartgreen, &smartgreen->zone_params[i]);
    }    
    db_load_coolers_state(smartgreen);
    return (0);
}

// int ft_check_database(t_smartgreen *smartgreen)
// {
//     int new_inst;

//     if (db_init(smartgreen) == -1)
//     return (-1);
    
//     new_inst = db_read_config(smartgreen, "new_installation");
//     if (new_inst == -1)
//     {
//         db_cleanup_error_log(smartgreen);
//         ft_init_config(smartgreen);
//         ft_init_users(smartgreen);
//         ft_init_struct(smartgreen);
//         if (ft_init_data(smartgreen) == -1)
//             return (-1);
//         db_save_config(smartgreen, "new_installation", 1);
//     }
//     else
//     {
//         ft_init_users(smartgreen);  // INSERT OR IGNORE — seguro
//         ft_init_struct(smartgreen); // solo lee num_coolers etc.
//         if (ft_init_data(smartgreen) == -1)
//             return (-1);
//     }
    
//     if (db_load_zone_params(smartgreen) == -1)
//         return (-1);

//     for (int i = 0; i < smartgreen->num_zones; i++)
//     {
//         ft_strcpy(smartgreen->zone_params[i].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
//         db_update_zone_params(smartgreen, &smartgreen->zone_params[i]);
//     }    
//     db_load_coolers_state(smartgreen);
//     return (0);
// }


int main(int argc, char **argv)
{
    t_smartgreen    *smartgreen;

    if (ptrace(PTRACE_TRACEME, 0, 0, 0) == -1)
    {
        fprintf(stderr, "Debugger detected. Exiting.\n");
        exit (1);
    }

    if (argc == 2)
    {
        if (strcmp(argv[1], "--version") == 0 || strcmp(argv[1], "-v") == 0)
        {
            printf("%s v%d.%d.%d\n", SG_PRODUCT, SG_VERSION_MAJOR, SG_VERSION_MINOR, SG_VERSION_PATCH);
            printf("Relase: %s\n", SG_RELEASE);
            printf("Build: %s %s \n", SG_BUILD_DATE, SG_BUILD_TIME);
            printf("%s\n", SG_COPYRIGHT);
            printf("by %s\n", SG_AUTHOR);
            printf("%s\n", SG_URL);
            printf("All rights reserved. Unauthorized reproduction or distribution is prohibited.\n");
            return (0);
        }
        else if (strcmp(argv[1], "--help") == 0 || strcmp(argv[1], "-h") == 0)
        {
            printf("Usage: %s [OPTIONS]\n", argv[0]);
            printf("  -v, --version    Show version information\n");
            printf("  -h, --help       Show this help message\n");
            printf("  -c, --config     Specify config file\n");
            return (0);
        }
        else if (strcmp(argv[1], "--config") == 0 || strcmp(argv[1], "-c") == 0)
        {
            printf("Config file: /opt/smartgreen/config/smartgreen.conf\n");
            return (0);
        }
    }

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
        smartgreen->db = NULL;
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
    {
        sqlite3_close(smartgreen->db);
        smartgreen->db = NULL;
    }
    
    pthread_mutex_destroy(&smartgreen->data_mutex);
    ft_free_modbus(smartgreen);
    ft_free_structs(smartgreen);

    if (g_update_pending)
    {
        printf("[MAIN] Restarting with new version...\n");
        fflush(stdout);
        execv("/opt/smartgreen/smartgreen", argv);
        perror("[MAIN] ❌ execv failed");
        return (1);
    }
    return (0);
}


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