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
            if (!smartgreen->modbus_ctx)
                ft_modbus_init(smartgreen);                                         // intentar reconectar
            if (smartgreen->modbus_ctx)
            {
                for (int i = 0; i < smartgreen->num_coolers; i++)
                    ft_modbus_read_cooler(smartgreen, smartgreen->coolers[i].unit_id);
                for (int i = 0; i < smartgreen->num_sensors; i++)
                    ft_modbus_read_sensor(smartgreen, smartgreen->sensors[i].sensor_id);
            }
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

int     db_read_scheduler(t_smartgreen *smartgreen)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT id, name, zone_id, active, action, hour, mon, tue, wed, thu, fri, sat, sun FROM scheduler WHERE active = 1;";
    int             rc;
    int             idx = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The scheduler database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    if (smartgreen->scheduler)
        free(smartgreen->scheduler);
    smartgreen->scheduler = malloc(sizeof(t_scheduler_entry) * MAX_SCHEDULERS);
    if (!smartgreen->scheduler)
    {
        sqlite3_finalize(stmt);
        return (-1);
    }

    while (sqlite3_step(stmt) == SQLITE_ROW && idx < MAX_SCHEDULERS)
    {
        smartgreen->scheduler[idx].id = sqlite3_column_int(stmt, 0);
        ft_strcpy(smartgreen->scheduler[idx].name, (char *)sqlite3_column_text(stmt, 1), sizeof(smartgreen->scheduler->name));
        smartgreen->scheduler[idx].zone_id = sqlite3_column_int(stmt, 2);
        smartgreen->scheduler[idx].active = sqlite3_column_int64(stmt, 3);
        ft_strcpy(smartgreen->scheduler[idx].action, (char *)sqlite3_column_text(stmt, 4), sizeof(smartgreen->scheduler->action));
        ft_strcpy(smartgreen->scheduler[idx].hour, (char *)sqlite3_column_text(stmt, 5), sizeof(smartgreen->scheduler->hour));
        smartgreen->scheduler[idx].mon = sqlite3_column_int64(stmt, 6);
        smartgreen->scheduler[idx].tue = sqlite3_column_int64(stmt, 7);
        smartgreen->scheduler[idx].wed = sqlite3_column_int64(stmt, 8);
        smartgreen->scheduler[idx].thu = sqlite3_column_int64(stmt, 9);
        smartgreen->scheduler[idx].fri = sqlite3_column_int64(stmt, 10);
        smartgreen->scheduler[idx].sat = sqlite3_column_int64(stmt, 11);
        smartgreen->scheduler[idx].sun = sqlite3_column_int64(stmt, 12);
        idx++;
    }
    smartgreen->num_schedulers = idx;
    sqlite3_finalize(stmt);
    return (0);
}