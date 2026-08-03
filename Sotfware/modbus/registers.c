#include "../incl/smartgreen.h"

int    decode_water_present_zone(uint16_t reg, int zone)
{
    int shift;

    if (zone < 1 || zone > 4)
        return (-1);
    shift = (zone - 1) * 4;
    return ((reg >> shift) & 0x0F);
}

void    decode_cooler_state(uint16_t *regs, t_cooler_state *state)
{
    // tail -f /tmp/sg_debug.log

    FILE    *fd = fopen("/tmp/sg_debug.log", "a");
    if (fd)
    {
        fprintf(fd, "******** NUEVO DECODE v2 ********\n");
        fprintf(fd, "=== unit_id=%d  modbus_addr=%d zone_id=%d ===\n", state->unit_id, regs[8], state->zone_id);
        fprintf(fd, "regs[0] =0x%04X r0_config=%d\n",         regs[0],  regs[0]);
        fprintf(fd, "regs[1] =0x%04X fabricante_p1=%d\n",     regs[1],  regs[1]);
        fprintf(fd, "regs[2] =0x%04X fabricante_p2=%d\n",     regs[2],  regs[2]);
        fprintf(fd, "regs[3] =0x%04X fabricante_p3=%d\n",     regs[3],  regs[3]);
        fprintf(fd, "regs[4] =0x%04X firmware=%d\n",          regs[4],  regs[4]);
        fprintf(fd, "regs[5] =0x%04X modelo=%d\n",            regs[5],  regs[5]);
        fprintf(fd, "regs[8] =0x%04X modbus_addr=%d\n",       regs[8],  regs[8]);
        fprintf(fd, "regs[10]=0x%04X estado_ext=%d\n",        regs[10], regs[10]);
        fprintf(fd, "regs[19]=0x%04X fan_speed_z1=%d\n",      regs[19], regs[19]);
        fprintf(fd, "regs[20]=0x%04X fan_speed_z2=%d\n",      regs[20], regs[20]);
        fprintf(fd, "regs[21]=0x%04X fan_speed_z3=%d\n",      regs[21], regs[21]);
        fprintf(fd, "regs[22]=0x%04X fan_speed_z4=%d\n",      regs[22], regs[22]);
        fprintf(fd, "regs[23]=0x%04X fan_speed_z5=%d\n",      regs[23], regs[23]);
        fprintf(fd, "regs[24]=0x%04X ramp_rate=%d\n",         regs[24], regs[24]);
        fprintf(fd, "regs[25]=0x%04X min_fill_time=%d\n",     regs[25], regs[25]);
        fprintf(fd, "regs[26]=0x%04X max_fill_time=%d\n",     regs[26], regs[26]);
        fprintf(fd, "regs[27]=0x%04X cold_starts=%d\n",       regs[27], regs[27]);
        fprintf(fd, "regs[28]=0x%04X fan_starts=%d\n",        regs[28], regs[28]);
        fprintf(fd, "regs[29]=0x%04X fan_hours=%d\n",         regs[29], regs[29]);
        fprintf(fd, "regs[32]=0x%04X tank_drains=%d\n",       regs[32], regs[32]);
        fprintf(fd, "regs[43]=0x%04X avg_tank_fill=%d\n",     regs[43], regs[43]);
        fprintf(fd, "regs[44]=0x%04X rf_messages=%d\n",       regs[44], regs[44]);
        fprintf(fd, "regs[49]=0x%04X drain=%d cool_mode=%d pump=%d fan=%d fault=%d inlet=%d speed=%d fault_code=%d\n",
                regs[49],
                (regs[49] >> 0) & 0x01,
                (regs[49] >> 1) & 0x01,
                (regs[49] >> 1) & 0x01,
                (regs[49] >> 2) & 0x01,
                (regs[49] >> 3) & 0x01,
                (regs[49] >> 4) & 0x01,
                (regs[49] >> 8) & 0x0F,
                (regs[49] >> 12) & 0x0F);
        fprintf(fd, "regs[50]=0x%04X drain_confirm=%d fan_confirmed=%d\n",
        regs[50],
        (regs[50] >> 4) & 0x01,
        (regs[50] >> 8) & 0x0F);
        fprintf(fd, "regs[51]=0x%04X solenoid=%d fan_individual=%d\n",
                regs[51],
                (regs[51] >> 3) & 0x01,regs[51]);
        fprintf(fd, "regs[52]=0x%04X extended_status=%d\n",   regs[52], regs[52]);
        fprintf(fd, "regs[53]=0x%04X water_present=%d\n",     regs[53], regs[53]);
        fprintf(fd, "regs[54]=0x%04X salinity_raw=%d ppm=%.2f us=%.2f\n",
                regs[54], regs[54],
                calculate_salinity_ppm(regs[54]),
                calculate_salinity_us(regs[54]));
        fprintf(fd, "regs[55]=0x%04X servicio=%d\n",          regs[55], regs[55]);
        fprintf(fd, "---\n");
        fclose(fd);
    }

    // offset 0 - 8
    state->r0_config = (regs[0]);
    state->modbus_addr = (regs[8]);
    
    // Offset 19 -43
    state->fan_speed_z1 = (regs[19]);
    state->fan_speed_z2 = (regs[20]);
    state->fan_speed_z3 = (regs[21]);
    state->fan_speed_z4 = (regs[22]);
    state->fan_speed_z5 = (regs[23]);
    state->ramp_rate = (regs[24]);
    state->cold_starts = (regs[27]);
    state->fan_starts = (regs[28]);
    state->fan_hours = (regs[29]);
    state->tank_drains = (regs[32]);
    state->avg_tank_fill = (regs[43]);

    // offset 49 - r_40050 - bits de estado
    state->drain_valve_open = (regs[49] >> 0) & 0x01;               // drain valve open/close" (estado leído) 
    state->cool_mode_on = (regs[49] >> 1) & 0x01;
    state->pump_on = state->cool_mode_on;                        // cool_mode_on = bomba activa
    state->fan_on = (regs[49] >> 2) & 0x01;
    state->fault_present = (regs[49] >> 3) & 0x01;
    state->inlet_valve_open = (regs[49] >> 4) & 0x01;
    state->actual_fan_speed = (regs[49] >> 8) & 0x0F;               // velocidad actual (antes de arranque)
    state->most_recent_fault = (regs[49] >> 12) & 0x0F;

    // offfset 52 - estado extendido en bitmap
    state->extended_status = (regs[52]);

    // offset 50 - r_40051 - bits de estado 
    // state->pump_on = (regs[50] >> 0) & 0x01;
    state->solenoid_on = (regs[51] >> 3) & 0x01;
    state->drain_valve_confirm = (regs[50] >> 4) & 0x01;            // drain valve open/close" (comando/confirmación)
    state->fan_speed_confirmed = (regs[50] >> 8) & 0x0F;            // velocidad actual (post arranque)

    // offset 53 - r_40054 - water present (nibbles por zona)
    state->water_present = decode_water_present_zone(regs[53], state->zone_id);

    // offset 54 - r_40055 -> salinidad
    state->salinity_ppm = calculate_salinity_ppm(regs[54]);
    state->salinity_us = calculate_salinity_us(regs[54]);
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