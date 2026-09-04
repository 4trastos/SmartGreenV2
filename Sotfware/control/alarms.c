#include "../incl/smartgreen.h"

void    ft_check_alarms(t_smartgreen *smartgreen)
{
    time_t              warranty_end;
    time_t              now = get_timestamp();
    char                msg[256];
    t_drain_args        *drain_args = NULL;

    // Alarma Modbus
    if (!smartgreen->modbus_ctx && !g_alarm_modbus)
    {
        db_save_error(smartgreen, 0, "🔴 CRITICO: Sin comunicacion Modbus");
        g_alarm_modbus = 1;
    }
    else if (smartgreen->modbus_ctx && g_alarm_modbus)
        g_alarm_modbus = 0;

    // Coolers
    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        warranty_end = smartgreen->coolers[i].install_date + (smartgreen->coolers[i].warranty_months * 30 * 24 * 3600);
        printf("[DEBUG SOLENOID] idx=%d solenoid_cmd=%d solenoid_on=%d ticks=%d\n", i, smartgreen->coolers[i].solenoid_cmd, smartgreen->coolers[i].solenoid_on, smartgreen->coolers[i].solenoid_zero_ticks); fflush(stdout);
        
        // 🔴 Fallo en el Cooler
        if (smartgreen->coolers[i].fault_present && !smartgreen->coolers[i].alarm_fault)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Fault cooler unit_id=%d code=%d", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].most_recent_fault);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_fault = 1;
        }
        else if (!smartgreen->coolers[i].fault_present && smartgreen->coolers[i].alarm_fault)
            smartgreen->coolers[i].alarm_fault = 0;

        // 🔴 Avería en el fan (motor) — basada en fan_on (regs[49] bit 2)
        int z = ft_find_zone(smartgreen, smartgreen->coolers[i].zone_id);
        if (z != -1 && strcmp(smartgreen->zone_params[z].prewet_in_progress, "no") == 0 && strcmp(smartgreen->zone_params[z].on_off,"ON") == 0)
        {
            printf("[ALARM DEBUG FAN] cooler=%d cool_mode=%d fan_on=%d\n", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].cool_mode_on, smartgreen->coolers[i].fan_on);
            fflush(stdout);

            if (smartgreen->coolers[i].cool_mode_on && !smartgreen->coolers[i].fan_on)
            {
                smartgreen->coolers[i].fan_zero_ticks++;
                if (smartgreen->coolers[i].fan_zero_ticks >= 5 && !smartgreen->coolers[i].alarm_fault)
                {
                    snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d averia fan", smartgreen->coolers[i].unit_id);
                    db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
                    smartgreen->coolers[i].alarm_fault = 1;

                    // Apagar cooler por seguridad
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, 0);
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 50, 0);
                }
            }
            else
            {
                smartgreen->coolers[i].fan_zero_ticks = 0;

                if (smartgreen->coolers[i].alarm_fault == 1 && smartgreen->coolers[i].fan_on)
                {
                    smartgreen->coolers[i].alarm_fault = 0;
                    ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, 1);
                }
                else if (!smartgreen->coolers[i].cool_mode_on)
                    smartgreen->coolers[i].alarm_fault = 0;
            }
        }

        // 🔴 Avería solenoide — mandamos ON pero no confirma
        if (z != -1 && strcmp(smartgreen->zone_params[z].on_off, "ON") == 0 && strcmp(smartgreen->zone_params[z].prewet_in_progress, "no") == 0 && strcmp(smartgreen->zone_params[z].cool_fan_mode, "IMD") != 0)
        {
            // Solenoide
            if (smartgreen->coolers[i].solenoid_cmd == 1 && smartgreen->coolers[i].solenoid_on == 0)
            {
                smartgreen->coolers[i].solenoid_zero_ticks++;
                if (smartgreen->coolers[i].solenoid_zero_ticks >= 5 && !smartgreen->coolers[i].alarm_fault)
                {
                    snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d averia solenoide", smartgreen->coolers[i].unit_id);
                    db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
                    smartgreen->coolers[i].alarm_fault = 1;
                    ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, 0);
                }
            }
            else
                smartgreen->coolers[i].solenoid_zero_ticks = 0;

            // Bomba
            if (smartgreen->coolers[i].pump_on == 1 && smartgreen->coolers[i].cool_mode_on == 0)
            {
                smartgreen->coolers[i].pump_zero_ticks++;
                if (smartgreen->coolers[i].pump_zero_ticks >= 2 && !smartgreen->coolers[i].alarm_fault)
                {
                    snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d averia bomba",
                            smartgreen->coolers[i].unit_id);
                    db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
                    smartgreen->coolers[i].alarm_fault = 1;
                    ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, 0);
                }
            }
            else
                smartgreen->coolers[i].pump_zero_ticks = 0;

            // Drenaje
            if (smartgreen->coolers[i].drain_cmd == 1 && smartgreen->coolers[i].drain_valve_confirm == 0)
            {
                smartgreen->coolers[i].drain_zero_ticks++;
                if (smartgreen->coolers[i].drain_zero_ticks >= 2 && !smartgreen->coolers[i].alarm_fault)
                {
                    snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d averia valvula drenaje",
                            smartgreen->coolers[i].unit_id);
                    db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
                    smartgreen->coolers[i].alarm_fault = 1;
                    ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, 0);
                }
            }
            else
                smartgreen->coolers[i].drain_zero_ticks = 0;
        }

        // 🔴 Sin comunicación
        if (smartgreen->coolers[i].error_count >= MAX_COOLER_ERRORS && !smartgreen->coolers[i].alarm_comms)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Cooler unit_id=%d sin comunicacion (errors=%d)", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].error_count);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_comms = 1;
        }
        else if (smartgreen->coolers[i].error_count < MAX_COOLER_ERRORS && smartgreen->coolers[i].alarm_comms)
            smartgreen->coolers[i].alarm_comms = 0;

        // 🟡 salinidad alta
        if (smartgreen->coolers[i].water_present && smartgreen->coolers[i].salinity_us >= db_read_config(smartgreen, "salinity_trigger") && !smartgreen->coolers[i].alarm_salinity)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Salinidad alta cooler unit_id=%d (%.1f uS)", smartgreen->coolers[i].unit_id, smartgreen->coolers[i].salinity_us);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_salinity = 1;
            drain_args = malloc(sizeof(t_drain_args));
            if (drain_args)
            {
                drain_args->smartgreen = smartgreen;
                drain_args->unit_id = smartgreen->coolers[i].unit_id;
                drain_args->zone_id = smartgreen->coolers[i].zone_id;
                drain_args->reason = DRAIN_SALINITY;
                pthread_t   tid;
                pthread_create(&tid, NULL, ft_drain_thread, drain_args);
                pthread_detach(tid);
            }
            
        }
        else if ((!smartgreen->coolers[i].water_present || smartgreen->coolers[i].salinity_us < db_read_config(smartgreen, "salinity_trigger")) && smartgreen->coolers[i].alarm_salinity)
            smartgreen->coolers[i].alarm_salinity = 0;

        // 🟡 sin agua
        if (smartgreen->coolers[i].salinity_us < 10.0 && !smartgreen->coolers[i].alarm_water)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Sin agua cooler unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_water = 1;
        }
        else if (smartgreen->coolers[i].salinity_us >= 10.0 && smartgreen->coolers[i].alarm_water)
            smartgreen->coolers[i].alarm_water = 0;

        // 🔴 Garantía vencida
        if (now > warranty_end)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Garantía vencida unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_warranty = 1;
        }
        
        // 🟡 Garantía próxima a vencer
        else if (warranty_end - now < 30 * 24 * 3600 && !smartgreen->coolers[i].alarm_warranty)
        {
            snprintf(msg, sizeof(msg), "🟡 AVISO: Garantía vence en menos de 30 días unit_id=%d", smartgreen->coolers[i].unit_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->coolers[i].alarm_warranty = 1;
        }
        else if (now <= warranty_end && !smartgreen->coolers[i].alarm_warranty)
            smartgreen->coolers[i].alarm_warranty = 0;
    }

    // Sensores
    for (int i = 0; i < smartgreen->num_sensors; i++)
    {
        // 🔴 sensor sin señal
        if (!smartgreen->sensors[i].valid && !smartgreen->sensors[i].alarm_signal)
        {
            snprintf(msg, sizeof(msg), "🔴 CRITICO: Sensor sin señal sensor_id=%d", smartgreen->sensors[i].sensor_id);
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
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
            db_save_error(smartgreen, smartgreen->coolers[i].unit_id, msg);
            smartgreen->sensors[i].alarm_temp = 1;
        }
        else if ((!smartgreen->sensors[i].valid || (smartgreen->sensors[i].temperature >= 0.0f && smartgreen->sensors[i].temperature <= 50.0f)) && smartgreen->sensors[i].alarm_temp)
        {
            smartgreen->sensors[i].alarm_temp = 0;
        }
    }
}