#include "../incl/smartgreen.h"

int ft_check_database(t_smartgreen *smartgreen)
{
    smartgreen->num_coolers = 0;
    smartgreen->num_sensors = 0;
    smartgreen->num_zones = 0;
    if (db_init(smartgreen) == -1)
        return (-1);
    smartgreen->coolers = malloc(sizeof(t_cooler_state));
    if (!smartgreen->coolers)
        return (-1);
    
    smartgreen->coolers->unit_id = 101;
    smartgreen->coolers->zone_id = 1;
    smartgreen->coolers->is_extractor = 0;
    smartgreen->coolers->error_count = 0;
    smartgreen->coolers->drain_valve_open = 0;
    smartgreen->coolers->cool_mode_on = 0;
    smartgreen->coolers->fan_on = 0;
    smartgreen->coolers->fault_present = 0;
    smartgreen->coolers->inlet_valve_open = 0;
    smartgreen->coolers->actual_fan_speed = 0;
    smartgreen->coolers->most_recent_fault = 0;
    smartgreen->coolers->water_present = 0;
    smartgreen->coolers->salinity_ppm = 0.00;
    smartgreen->coolers->salinity_us = 0.00;
    smartgreen->coolers->last_read = 0;
    smartgreen->coolers->last_mod = 0;    

    if (db_save_cooler(smartgreen, smartgreen->coolers) == -1)
        return (-1);
    smartgreen->sensors = malloc(sizeof(t_sensor_state));
    if (!smartgreen->sensors)
        return (-1);

    smartgreen->sensors->sensor_id = 101;
    strcpy(smartgreen->sensors->type, "INT");
    strcpy(smartgreen->sensors->name, "TEST SENSOR");
    smartgreen->sensors->temperature = -200.00;
    smartgreen->sensors->humidity = -200.00;
    smartgreen->sensors->flags = 0;
    smartgreen->sensors->valid = 0;
    smartgreen->sensors->offset_val = 0;
    smartgreen->sensors->last_read = 0;
    smartgreen->sensors->last_mod = 0;

    if (db_save_sensor(smartgreen, smartgreen->sensors) == -1)
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