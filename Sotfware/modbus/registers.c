#include "../incl/smartgreen.h"

int    decode_water_present_zone(int r_40054, int zone)
{
    int shift = (zone - 1) * 4;
    return ((r_40054 >> shift) & 0x0F);
}

void    decode_cooler_state(uint16_t *regs, t_cooler_state *state)
{
    // tail -f /tmp/sg_debug.log

    FILE    *fd = fopen("/tmp/sg_debug.log", "a");
    if (fd)
    {
        fprintf(fd, "[%ld] regs[49]=0x%04X (%d) regs[50]=0x%04X (%d) regs[53]=0x%04X regs[54]=0x%04X\n", (long)time(NULL), 
                regs[49], regs[49],
                regs[50], regs[50],
                regs[53], regs[54]);
        fclose(fd);
    }

    // offset  49 - r_40050 - bits de estado 
    state->drain_valve_open = (regs[49] >> 0) & 0x01;               // drain valve open/close" (estado leído) 
    state->cool_mode_on = (regs[49] >> 1) & 0x01;
    state->fan_on = (regs[49] >> 2) & 0x01;
    state->fault_present = (regs[49] >> 3) & 0x01;
    state->inlet_valve_open = (regs[49] >> 4) & 0x01;
    state->actual_fan_speed = (regs[49] >> 8) & 0x0F;               // velocidad actual (antes de arranque)
    state->most_recent_fault = (regs[49] >> 12) & 0x0F;

    // offset 50 - r_40051 - bits de estado 
    // state->pump_on = (regs[50] >> 0) & 0x01;
    state->pump_on = (regs[50] >> 1) & 0x01;
    state->solenoid_on = (regs[50] >> 3) & 0x01;
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
        state->temperature = (int16_t)regs[1] / 10.0f;
        state->humidity = (int16_t)regs[2] / 10.0f;
    }
}