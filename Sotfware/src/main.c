#include "../incl/smartgreen.h"

int ft_check_database(t_smartgreen *smartgreen)
{
    if (db_init(smartgreen) == -1)
        return (-1);
    
    if (db_save_config(smartgreen, "num_coolers", 3) == -1)
        return (-1);
    
    if (db_save_config(smartgreen, "num_sensors", 2) == -1)
        return (-1);

    if (db_save_config(smartgreen, "num_zones", 1) == -1)
        return (-1);

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
    
    if (ft_check_database(smartgreen) == -1)
    {
        free(smartgreen->coolers);
        free(smartgreen->sensors);
        free(smartgreen->zone_params);
        free(smartgreen);
        return (1);
    }
    if (smartgreen->db)
        sqlite3_close(smartgreen->db);
    
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