#include "../incl/smartgreen.h"

void    log_error(const char *message)
{
    time_t  now = get_timestamp();
    fprintf(stderr, "[ERROR] [%ld] %s\n", now, message);
}

void    log_info(const char *message)
{
    time_t  now = get_timestamp();
    fprintf(stdout, "[INFO] [%ld] %s\n", now, message);
}

void    ft_check_alarms(t_smartgreen *smartgreen)
{
    char    msg[256];

    if (!smartgreen->modbus_ctx)
        db_save_error(smartgreen, "🔴 CRITICO: Sin comunicacion Modbus");
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        // 🔴 Fallo en el Cooler
        if (smartgreen->coolers[i].fault_present)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Fault cooler unit_id=%d code=%d", 
                        smartgreen->coolers[i].unit_id, smartgreen->coolers[i].most_recent_fault);
            db_save_error(smartgreen, msg);
        }
        // 🔴 Sin comunicación
        if (smartgreen->coolers[i].error_count >= MAX_COOLER_ERRORS)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d sin comunicacion (errors=%d)", 
                        smartgreen->coolers[i].unit_id, smartgreen->coolers[i].error_count);
            db_save_error(smartgreen, msg);
        }
        // 🟡 salinidad alta
        if (smartgreen->coolers[i].water_present && smartgreen->coolers[i].salinity_us >= db_read_config(smartgreen, "salinity_trigger"))
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Salinidad alta cooler unit_id=%d (%.1f uS)", 
                        smartgreen->coolers[i].unit_id, smartgreen->coolers[i].salinity_us);
            db_save_error(smartgreen, msg);
        }
        // 🟡 sin agua
        if (!smartgreen->coolers[i].water_present)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Sin agua cooler unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen,msg);
        }
    }

    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        // 🔴 sensor sin señal
        if (!smartgreen->sensors[i].valid)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Sensor sin señal sensor_id=%d", smartgreen->sensors[i].sensor_id);
            db_save_error(smartgreen, msg);
        }
        // 🟡 temperatura fuera de rango
        if (smartgreen->sensors[i].valid && (smartgreen->sensors[i].temperature < 0.0f || smartgreen->sensors[i].temperature > 50.0f))
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Temperatura fuera de rango sensor_id=%d (%.1f C)", 
                        smartgreen->sensors[i].sensor_id, smartgreen->sensors[i].temperature);
            db_save_error(smartgreen,msg);
        }
    }
}