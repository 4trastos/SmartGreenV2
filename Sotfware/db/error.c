#include "../incl/smartgreen.h"

int     db_save_error(t_smartgreen *smartgreen, const char *message)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_ERROR;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The error_log database could not be prepare: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 2, smartgreen->coolers->unit_id);
    sqlite3_bind_int(stmt, 3, get_timestamp());
    sqlite3_bind_text(stmt, 4, "ERROR", -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, message, -1, SQLITE_TRANSIENT);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Error_log inserted correctly\n");
    else
    {
        printf("Error error_log inserting: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }

    sqlite3_finalize(stmt);
    return (0);
}

int     db_save_fault(t_smartgreen *smartgreen, int unit_id, int fault_code)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_SAVE_FAULT_LOG;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "The fault_lod database could not be preapre: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_int(stmt, 2, unit_id);
    sqlite3_bind_int(stmt, 3, fault_code);
    sqlite3_bind_int(stmt, 4, 1);
    sqlite3_bind_int(stmt, 5, get_timestamp());
    sqlite3_bind_int(stmt, 6, 0);

    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Fault_log inserted correctly\n");
    else
    {
        printf("Error Fault_log inserting: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        sqlite3_finalize(stmt);
        return (-1);
    }

    sqlite3_finalize(stmt);
    return (0);
}