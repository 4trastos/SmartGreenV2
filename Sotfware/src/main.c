#include "../incl/smartgreen.h"

int ft_check_database(t_smartgreen *smartgreen)
{
    int i;

    if (db_init(smartgreen) == -1)
        return (-1);
    
    if (db_save_config(smartgreen, "num_coolers", 3) == -1)
        return (-1);
    
    if (db_save_config(smartgreen, "num_sensors", 2) == -1)
        return (-1);

    ft_init_struct(smartgreen);

    smartgreen->coolers = NULL;
    if (smartgreen->num_coolers > 0)
    {
        i = 0;
        smartgreen->coolers = malloc(sizeof(t_cooler_state) * smartgreen->num_coolers);
        if (!smartgreen->coolers)
            return (-1);
        while (i < smartgreen->num_coolers)
        {
            smartgreen->coolers[i].unit_id = i + 1;
            smartgreen->coolers[i].zone_id = 1;
            smartgreen->coolers[i].is_extractor = 0;
            smartgreen->coolers[i].error_count = 0;
            smartgreen->coolers[i].drain_valve_open = 0;
            smartgreen->coolers[i].cool_mode_on = 0;
            smartgreen->coolers[i].fan_on = 0;
            smartgreen->coolers[i].fault_present = 0;
            smartgreen->coolers[i].inlet_valve_open = 0;
            smartgreen->coolers[i].actual_fan_speed = 0;
            smartgreen->coolers[i].most_recent_fault = 0;
            smartgreen->coolers[i].water_present = 0;
            smartgreen->coolers[i].salinity_ppm = 0.00;
            smartgreen->coolers[i].salinity_us = 0.00;
            smartgreen->coolers[i].last_read = 0;
            smartgreen->coolers[i].last_mod = 0;

            if (db_save_cooler(smartgreen, &smartgreen->coolers[i]) == -1)
                return (-1);
            i++;
        }
    }

    smartgreen->sensors = NULL;
    if (smartgreen->num_sensors > 0)
    {
        i = 0;
        smartgreen->sensors = malloc(sizeof(t_sensor_state) * smartgreen->num_sensors);
        if (!smartgreen->sensors)
            return (-1);
        while (i < smartgreen->num_sensors)
        {
            smartgreen->sensors[i].sensor_id = i +1;
            smartgreen->sensors[i].zone_id = 1;
            ft_strcpy(smartgreen->sensors[i].type, "INT", sizeof(smartgreen->sensors->type));
            ft_strcpy(smartgreen->sensors[i].name, "TEST SENSOR", sizeof(smartgreen->sensors->name));
            smartgreen->sensors[i].temperature = -200.00;
            smartgreen->sensors[i].humidity = -200.00;
            smartgreen->sensors[i].flags = 0;
            smartgreen->sensors[i].valid = 0;
            smartgreen->sensors[i].offset_val = 0;
            smartgreen->sensors[i].last_read = 0;
            smartgreen->sensors[i].last_mod = 0;
        
            if (db_save_sensor(smartgreen, &smartgreen->sensors[i]) == -1)
                return (-1);
            i++;
        } 
    }

    if (db_save_history(smartgreen) == -1)
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