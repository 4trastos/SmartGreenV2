#include "../incl/smartgreen.h"

void    scheduler_run(t_smartgreen *smartgreen)
{
    time_t  last_read;
    time_t  last_history;
    time_t  last_scheduler;
    time_t  now;

    last_read = get_timestamp();
    last_history = get_timestamp();
    last_scheduler = get_timestamp();

    while (!g_sigint_received && !g_sigterm_received)
    {
        now = get_timestamp();

        if (now - last_read >= SCHEDULER_READ_MIN)
        {
            last_read = now;
        } 

        if (now - last_history >= HISTORY_INTERVAL)
        {

            last_history = now;
        }

        if (now - last_scheduler >= SCHEDULER_SEQUENCE)      // Mirar el horario cada 15 segundos
        {
            last_scheduler = now;
        }
        sleep(1);
    }
    
}