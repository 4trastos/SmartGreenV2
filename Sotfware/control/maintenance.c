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