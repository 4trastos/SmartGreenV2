#include "../incl/smartgreen.h"

volatile sig_atomic_t g_sigint_received = 0;
volatile sig_atomic_t g_sigterm_received = 0;

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

    if (db_save_error(smartgreen, "FUNCIONA") == -1)
        return (-1);
    if (db_save_fault(smartgreen, 2, 400) == -1)
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

    init_signal();
    
    if (ft_check_database(smartgreen) == -1)
    {
        ft_free_structs(smartgreen);
        return (1);
    }

    ft_modbus(smartgreen);              // intenta conectar, pero aunque falle seguimos
    scheduler_run(smartgreen);          // el scheduler corre siempre

    if (smartgreen->db)
        sqlite3_close(smartgreen->db);
    
    ft_free_modbus(smartgreen);
    ft_free_structs(smartgreen);
    return (0);
}



/*

1. Inicializar configuración (leer config de BD o fichero)
2. Abrir conexión Modbus RTU (/dev/ttyUSB0)
3. Abrir conexión SQLite (crear tablas si no existen)
4. Leer estado inicial de coolers y sensores (primera lectura Modbus)
5. Inicializar zonas y parámetros desde BD
6. Arrancar API REST (hilo separado)
7. Arrancar daemon de conectividad (hilo separado)
8. Entrar en bucle principal (scheduler — tick cada 1 segundo)

LOOP:

¿Toca leer Modbus?     → leer coolers y sensores
¿Hay comandos pendientes? → escribir a coolers
¿Toca guardar histórico?  → escribir en SQLite
¿Toca ejecutar scheduler? → ON/OFF programado
¿Hay alarmas?             → notificar
sleep(1 segundo)
GOTO LOOP

*/

/*

sudo pkill -f SmartGreenAPI
sleep 3
ps aux | grep -i java | grep -v grep

*/