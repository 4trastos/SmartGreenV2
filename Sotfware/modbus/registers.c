#include "../incl/smartgreen.h"

char    *ft_model_name(int cpmd_code)
{
    if (cpmd_code == 100) return ("TBS 580");
    if (cpmd_code == 64)  return ("TBS 460");
    if (cpmd_code == 80)  return ("TBS 520");
    if (cpmd_code == 120) return ("TBS 640");
    // añadir más según catálogo Breezair
    return ("Breezair");
}

int    decode_water_present_zone(uint16_t reg, int zone)
{
    int shift;

    if (zone < 1 || zone > 4)
        return (-1);
    shift = (zone - 1) * 4;
    return ((reg >> shift) & 0x0F);
}

// void    decode_cooler_state(uint16_t *regs, t_cooler_state *state)
// {
//     FILE *f = fopen("/tmp/cooler_regs.log", "a");
//     if (f)
//     {
//         fprintf(f, "\n===============================\n");
//         fprintf(f, "timestamp=%ld unit=%d\n", (long)time(NULL), state->unit_id);
//         for (int i = 0; i < MODBUS_COOLER_REGS; i++)
//             fprintf(f, "R%-2d : 0x%04X (%5d)\n", i, regs[i], regs[i]);
//         fclose(f);
//     }
    
//     state->r0_config     = (regs[0]);
//     state->modbus_addr   = (regs[8]);
//     state->fan_speed_z1  = (regs[19]);
//     state->fan_speed_z2  = (regs[20]);
//     state->fan_speed_z3  = (regs[21]);
//     state->fan_speed_z4  = (regs[22]);
//     state->fan_speed_z5  = (regs[23]);
//     state->ramp_rate     = (regs[24]);
//     state->cold_starts   = (regs[27]);
//     state->fan_starts    = (regs[28]);
//     state->fan_hours     = (regs[29]);
//     state->tank_drains   = (regs[32]);
//     state->avg_tank_fill = (regs[43]);
//     state->drain_valve_open  = (regs[49] >> 0) & 0x01;                   // drain valve open/close" (estado leído) 
//     state->cool_mode_on      = (regs[49] >> 1) & 0x01;
//     state->pump_on           = state->cool_mode_on;                               // cool_mode_on = bomba activa
//     state->fault_present     = (regs[49] >> 3) & 0x01;
//     state->actual_fan_speed  = (regs[49] >> 4) & 0x0F;                  // ← fuente de verdad
//     state->fan_on            = state->actual_fan_speed > 0 ? 1 : 0;     // ← derivado
//     state->fan_running       = state->fan_on;                           // ← alias, misma fuente
//     state->inlet_valve_open  = (regs[49] >> 4) & 0x01;                  // bit 4
//     state->most_recent_fault = (regs[49] >> 12) & 0x0F;
//     state->extended_status  = (regs[52]);
//     state->drain_valve_confirm = (regs[50] >> 4) & 0x01;            // drain valve open/close" (comando/confirmación)
//     state->fan_speed_confirmed = (regs[50] >> 8) & 0x0F;            // siempre 0, no fiable
//     state->solenoid_on         = (regs[50] >> 3) & 0x01;
//     state->water_present = decode_water_present_zone(regs[53], state->zone_id);
//     state->salinity_ppm = calculate_salinity_ppm(regs[54]);
//     state->salinity_us = calculate_salinity_us(regs[54]);
//     ft_strcpy(state->model, ft_model_name(regs[4]), sizeof(state->model));
//     state->firmware = regs[1];
    
//     printf("[DEBUG FAN] reg49=0x%04X reg50=0x%04X bit3=%d fan_running=%d fan_speed=%d cool_mode=%d\n", regs[49], regs[50], (regs[50] >> 3) & 0x01, state->fan_running, state->actual_fan_speed, state->cool_mode_on); fflush(stdout);
// }

void    decode_cooler_state(uint16_t *regs, t_cooler_state *state)
{
    static uint16_t prev_regs[MODBUS_COOLER_REGS];
    static int      is_initialized = 0;
    FILE            *f = fopen("/tmp/cooler_regs.log", "a");

    if (f)
    {
        fprintf(f, "\n===============================\n");
        fprintf(f, "timestamp=%ld unit=%d\n", (long)time(NULL), state->unit_id);
        
        for (int i = 0; i < MODBUS_COOLER_REGS; i++)
        {
            fprintf(f, "R%-2d : 0x%04X (%5d)", i, regs[i], regs[i]);
            
            // Si ya tenemos un ciclo anterior, comparamos y avisamos si hay cambios
            if (is_initialized && prev_regs[i] != regs[i])
            {
                fprintf(f, " 🔄 [CAMBIO: prev=0x%04X (%d)]", prev_regs[i], prev_regs[i]);
            }
            fprintf(f, "\n");
        }
        fclose(f);
    }

    // Copiamos los registros actuales al array estático para el siguiente ciclo
    for (int i = 0; i < MODBUS_COOLER_REGS; i++)
    {
        prev_regs[i] = regs[i];
    }
    is_initialized = 1;

    // --- Lectura de tus variables habituales ---
    state->r0_config     = (regs[0]);
    state->modbus_addr   = (regs[8]);
    
    state->fan_speed_z1  = (regs[19]);
    state->fan_speed_z2  = (regs[20]);
    state->fan_speed_z3  = (regs[21]);
    state->fan_speed_z4  = (regs[22]);
    state->fan_speed_z5  = (regs[23]);
    state->ramp_rate     = (regs[24]);
    state->cold_starts   = (regs[27]);
    state->fan_starts    = (regs[28]);
    state->fan_hours     = (regs[29]);
    state->tank_drains   = (regs[32]);
    state->avg_tank_fill = (regs[43]);

    // Estados y bits
    state->drain_valve_open  = (regs[49] >> 0) & 0x01;                   
    state->cool_mode_on      = (regs[49] >> 1) & 0x01;
    state->pump_on           = state->cool_mode_on;                               
    state->fault_present     = (regs[49] >> 3) & 0x01;
    state->actual_fan_speed  = (regs[49] >> 4) & 0x0F;                  
    state->fan_on            = state->actual_fan_speed > 0 ? 1 : 0;     
    state->fan_running       = state->fan_on;                           
    state->inlet_valve_open  = (regs[49] >> 4) & 0x01;                  
    state->most_recent_fault = (regs[49] >> 12) & 0x0F;

    state->extended_status  = (regs[52]);
    state->drain_valve_confirm = (regs[50] >> 4) & 0x01;            
    state->fan_speed_confirmed = (regs[50] >> 8) & 0x0F;            
    state->solenoid_on         = (regs[50] >> 3) & 0x01;

    state->water_present = decode_water_present_zone(regs[53], state->zone_id);

    state->salinity_ppm = calculate_salinity_ppm(regs[54]);
    state->salinity_us = calculate_salinity_us(regs[54]);

    ft_strcpy(state->model, ft_model_name(regs[4]), sizeof(state->model));
    state->firmware = regs[1];
}

void    decode_sensor_state(uint16_t *regs, t_sensor_state *state)
{
    // tail -f /tmp/sg_sensor_debug.log

    FILE *fd = fopen("/tmp/sg_sensor_debug.log", "a");
    if (fd)
    {
        fprintf(fd,  "=== sensor_id=%d ===\n", state->sensor_id);
        fprintf(fd, "regs[0]=0x%04X sensor_id=%d\n", regs[0], regs[0]);
        fprintf(fd, "regs[1]=0x%04X temp_raw=%d (%.1f°C)\n", regs[1], (int16_t)regs[1], (int16_t)regs[1] / 10.0f);
        fprintf(fd, "regs[2]=0x%04X hum_raw=%d (%.1f%%)\n", regs[2], (int16_t)regs[2], (int16_t)regs[2] / 10.0f);
        fprintf(fd, "regs[3]=0x%04X flags=%d\n", regs[3], regs[3]);
        fprintf(fd, "---\n");
        fclose(fd);
    }

    state->sensor_id = regs[0];
    state->flags = regs[3];
    if ((int16_t)regs[1] == SENSOR_NO_SIGNAL || (int16_t)regs[1] > MAX_SENSOR_TEMP || (int16_t)regs[2] == SENSOR_NO_SIGNAL || (int16_t)regs[2] > MAX_SENSOR_HUM)
    {
        state->valid = 0;
        state->temperature = 0.0f;
        state->humidity = 0.0f;
    }
    else
    {
        state->valid = 1;
        state->temperature = ((int16_t)regs[1] / 10.0f) + state->offset_val;
        state->humidity = ((int16_t)regs[2] / 10.0f) + state->humidity_offset_val;
    }
}