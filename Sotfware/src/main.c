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
    api_start(smartgreen);              // arrancar API antes del scheduler
    scheduler_run(smartgreen);          // el scheduler corre siempre
    api_stop(smartgreen);               // parar API al salir

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

## Funcionalidades futuras (post-MVP)

**Mantenimiento y ciclo de vida:**
```
⬜ Revisión periódica anual — hibernación y puesta en marcha del cooler
⬜ Control de garantía — fecha de instalación, fin de garantía, alertas
⬜ Contador de horas de funcionamiento — por cooler
⬜ Historial de mantenimientos realizados
⬜ Alertas de mantenimiento preventivo (filtros, limpieza, etc.)
```

**Funcionalidades que se me ocurren:**
```
⬜ Modo vacaciones — apagado programado por fechas
⬜ Free cooling — usar aire exterior cuando temperatura < setpoint
⬜ Consumo energético estimado — por zona y por instalación
⬜ Informe mensual automático — PDF con resumen de funcionamiento
⬜ Multi-idioma — español, inglés, catalán
⬜ Gestión de recambios — stock de piezas de repuesto
⬜ QR por cooler — escanear para ver historial del dispositivo
⬜ Modo test — verificar cada actuador individualmente
```

*/