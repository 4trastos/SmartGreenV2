#include "../incl/smartgreen.h"

int     db_get_last_maintenance(t_smartgreen *smartgreen, int unit_id, const char *type, t_maintenance_log *out)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT id, unit_id, timestamp, type, description, "
                           "technician, next_service FROM maintenance_log "
                           "WHERE unit_id = ? AND type = ? "
                           "ORDER BY timestamp DESC LIMIT 1;";
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The last_maintenance database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 1, unit_id);
    sqlite3_bind_text(stmt, 2, type, -1, SQLITE_TRANSIENT);
    if (sqlite3_step(stmt) == SQLITE_ROW)
    {
        out->id = sqlite3_column_int(stmt, 0);
        out->unit_id = sqlite3_column_int(stmt, 1);
        out->timestamp = sqlite3_column_int(stmt, 2);
        ft_strcpy(out->type, (char *)sqlite3_column_text(stmt, 3), sizeof(out->type));
        ft_strcpy(out->description, (char *)sqlite3_column_text(stmt, 4), sizeof(out->description));
        ft_strcpy(out->technician, (char *)sqlite3_column_text(stmt, 5), sizeof(out->technician));
        out->next_service = sqlite3_column_int(stmt, 6);
        sqlite3_finalize(stmt);
        return (0);
    }
    printf("Error: last_maintenance inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
    sqlite3_finalize(stmt);
    return (-1);
}

void    ft_maintenance_alarms(t_smartgreen *smartgreen)
{
    t_maintenance_log   last_maint;
    time_t              now = get_timestamp();
    int                 maint_plan = db_read_config(smartgreen, "maint_plan");
    int                 closing_date = db_read_config(smartgreen, "maint_closing_date");
    int                 opening_date = db_read_config(smartgreen, "maint_opening_date");
    int                 legio_date = db_read_config(smartgreen, "maint_legionella_date");
    int                 maint_legio = db_read_config(smartgreen, "maint_legionella");
    int                 found = 0;
    char                buffer[256];

    for (int i = 0; i < smartgreen->num_coolers; i++)
    {
        if (closing_date > 0 && now > closing_date && !smartgreen->coolers[i].alarm_maint_closing)
        {
            found = db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_CLOSING, &last_maint);
            if (found == -1 || last_maint.timestamp < closing_date)
            {
                snprintf(buffer, sizeof(buffer), "🟡 Mantenimiento cierre pendiente cooler unit_id=%d", smartgreen->coolers[i].unit_id);
                db_save_error(smartgreen, buffer);
                smartgreen->coolers[i].alarm_maint_closing = 1;
            }
            else
                smartgreen->coolers[i].alarm_maint_closing = 0;
        }

        if (maint_plan == 1 && opening_date > 0 && now > opening_date && !smartgreen->coolers[i].alarm_maint_opening)
        {
            found = db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_OPENING, &last_maint);
            if (found == -1 || last_maint.timestamp < opening_date)
            {
                snprintf(buffer, sizeof(buffer), "🟡 Mantenimiento apertura pendiente cooler unit_id=%d", smartgreen->coolers[i].unit_id);
                db_save_error(smartgreen, buffer);
                smartgreen->coolers[i].alarm_maint_opening = 1;
            }
            else
                smartgreen->coolers[i].alarm_maint_opening = 0;
        }

        if (maint_legio == 1 && legio_date > 0 && now > legio_date && !smartgreen->coolers[i].alarm_maint_legionella)
        {
            found = db_get_last_maintenance(smartgreen, smartgreen->coolers[i].unit_id, MAINT_LEGIONELLA, &last_maint);
            if (found == -1|| last_maint.timestamp < legio_date)
            {
                snprintf(buffer, sizeof(buffer), "🟡 Tratamiento legionela pendiente cooler unit_id=%d", smartgreen->coolers[i].unit_id);
                db_save_error(smartgreen, buffer);
                smartgreen->coolers[i].alarm_maint_legionella = 1;
            }
            else
                smartgreen->coolers[i].alarm_maint_legionella = 0;
        }
    }

}