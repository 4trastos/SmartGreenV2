#include "../incl/smartgreen.h"

void    ft_check_alarms(t_smartgreen *smartgreen)
{
    time_t              warranty_end;
    time_t              now = get_timestamp();
    char                msg[256];

    // Alarma Modbus
    if (!smartgreen->modbus_ctx && !g_alarm_modbus)
    {
        db_save_error(smartgreen, "🔴 CRITICO: Sin comunicacion Modbus");
        g_alarm_modbus = 1;
    }
    else if (smartgreen->modbus_ctx && g_alarm_modbus)
        g_alarm_modbus = 0;

    // Coolers
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        warranty_end = smartgreen->coolers[i].install_date + (smartgreen->coolers[i].warranty_months * 30 * 24 * 3600);
        
        // 🔴 Fallo en el Cooler
        if (smartgreen->coolers[i].fault_present && !smartgreen->coolers[i].alarm_fault)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Fault cooler unit_id=%d code=%d", 
                     smartgreen->coolers[i].unit_id, smartgreen->coolers[i].most_recent_fault);
            db_save_error(smartgreen, msg);
            smartgreen->coolers[i].alarm_fault = 1;
        }
        else if (!smartgreen->coolers[i].fault_present && smartgreen->coolers[i].alarm_fault)
        {
            smartgreen->coolers[i].alarm_fault = 0;
        }

        // 🔴 Sin comunicación
        if (smartgreen->coolers[i].error_count >= MAX_COOLER_ERRORS && !smartgreen->coolers[i].alarm_comms)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d sin comunicacion (errors=%d)", 
                     smartgreen->coolers[i].unit_id, smartgreen->coolers[i].error_count);
            db_save_error(smartgreen, msg);
            smartgreen->coolers[i].alarm_comms = 1;
        }
        else if (smartgreen->coolers[i].error_count < MAX_COOLER_ERRORS && smartgreen->coolers[i].alarm_comms)
        {
            smartgreen->coolers[i].alarm_comms = 0;
        }

        // 🟡 salinidad alta
        if (smartgreen->coolers[i].water_present && smartgreen->coolers[i].salinity_us >= db_read_config(smartgreen, "salinity_trigger") && !smartgreen->coolers[i].alarm_salinity)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Salinidad alta cooler unit_id=%d (%.1f uS)", 
                     smartgreen->coolers[i].unit_id, smartgreen->coolers[i].salinity_us);
            db_save_error(smartgreen, msg);
            smartgreen->coolers[i].alarm_salinity = 1;
        }
        else if ((!smartgreen->coolers[i].water_present || smartgreen->coolers[i].salinity_us < db_read_config(smartgreen, "salinity_trigger")) && smartgreen->coolers[i].alarm_salinity)
        {
            smartgreen->coolers[i].alarm_salinity = 0;
        }

        // 🟡 sin agua
        if (smartgreen->coolers[i].salinity_us < 10.0 && !smartgreen->coolers[i].alarm_water)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Sin agua cooler unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, msg);
            smartgreen->coolers[i].alarm_water = 1;
        }
        else if (smartgreen->coolers[i].salinity_us >= 10.0 && smartgreen->coolers[i].alarm_water)
            smartgreen->coolers[i].alarm_water = 0;

        // 🔴 Garantía vencida
        if (now > warranty_end && !smartgreen->coolers[i].alarm_warranty)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Garantía vencida unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, msg);
            smartgreen->coolers[i].alarm_warranty = 1;
        }
        
        // 🟡 Garantía próxima a vencer
        else if (warranty_end - now < 30 * 24 * 3600 && !smartgreen->coolers[i].alarm_warranty)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Garantía vence en menos de 30 días unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, msg);
            smartgreen->coolers[i].alarm_warranty = 1;
        }
        else if (now <= warranty_end)
            smartgreen->coolers[i].alarm_warranty = 0;
    }

    // Sensores
    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        // 🔴 sensor sin señal
        if (!smartgreen->sensors[i].valid && !smartgreen->sensors[i].alarm_signal)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Sensor sin señal sensor_id=%d", smartgreen->sensors[i].sensor_id);
            db_save_error(smartgreen, msg);
            smartgreen->sensors[i].alarm_signal = 1;
        }
        else if (smartgreen->sensors[i].valid && smartgreen->sensors[i].alarm_signal)
        {
            smartgreen->sensors[i].alarm_signal = 0;
        }

        // 🟡 temperatura fuera de rango
        if (smartgreen->sensors[i].valid && (smartgreen->sensors[i].temperature < 0.0f || smartgreen->sensors[i].temperature > 50.0f) && !smartgreen->sensors[i].alarm_temp)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Temperatura fuera de rango sensor_id=%d (%.1f C)", 
                     smartgreen->sensors[i].sensor_id, smartgreen->sensors[i].temperature);
            db_save_error(smartgreen, msg);
            smartgreen->sensors[i].alarm_temp = 1;
        }
        else if ((!smartgreen->sensors[i].valid || (smartgreen->sensors[i].temperature >= 0.0f && smartgreen->sensors[i].temperature <= 50.0f)) && smartgreen->sensors[i].alarm_temp)
        {
            smartgreen->sensors[i].alarm_temp = 0;
        }
    }
}