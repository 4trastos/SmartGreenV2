#include "../incl/smartgreen.h"

void    scheduler_run(t_smartgreen *smartgreen)
{
    time_t  last_read;
    time_t  last_history;
    time_t  last_scheduler;
    time_t  now;
    int     read_interval;
    int     history_interval;

    last_read = get_timestamp();
    last_history = get_timestamp();
    last_scheduler = get_timestamp();

    read_interval = db_read_config(smartgreen, "refresh_interval");
    history_interval = db_read_config(smartgreen, "history_interval");

    if (read_interval < 0)
        read_interval = SCHEDULER_READ_MIN;
    if (history_interval < 0)
        history_interval = HISTORY_INTERVAL;

    while (!g_sigint_received && !g_sigterm_received)
    {
        now = get_timestamp();

        if (now - last_read >= read_interval)
        {
            for (int i = 0; i < smartgreen->num_coolers; i++)
                ft_modbus_read_cooler(smartgreen, smartgreen->coolers[i].unit_id);
            for (int i = 0; i < smartgreen->num_sensors; i++)
                ft_modbus_read_sensor(smartgreen, smartgreen->sensors[i].sensor_id);
            last_read = now;
        } 

        if (now - last_history >= history_interval)
        {
            for (int i = 0; i < smartgreen->num_coolers; i++)
                db_save_history(smartgreen, "CO", &smartgreen->coolers[i], NULL);
            for (int i = 0; i < smartgreen->num_sensors; i++)
                db_save_history(smartgreen, "SE", NULL, &smartgreen->sensors[i]);
            last_history = now;
        }

        if (now - last_scheduler >= SCHEDULER_SEQUENCE)      // Mirar el horario cada 15 segundos
        {
            // comprobar si toca ON/OFF programado
            last_scheduler = now;
        }
        sleep(1);
    }
    
}