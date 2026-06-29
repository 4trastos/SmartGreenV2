#include "../incl/smartgreen.h"

int db_read_config(t_smartgreen *smartgreen, const char *key)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT value FROM config WHERE key = ?;";
    int             rc;
    int             result = 0;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "db_read_config prepare error: %s\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }

    sqlite3_bind_text(stmt, 1, key, -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW)
        result = sqlite3_column_int(stmt, 0);
    else
        result = -1;
    sqlite3_finalize(stmt);
    return (result);
}

void    ft_init_struct(t_smartgreen *smartgreen)
{
    smartgreen->num_coolers = db_read_config(smartgreen, "num_coolers");
    if (smartgreen->num_coolers < 0)
        smartgreen->num_coolers = 0;
    
    smartgreen->num_sensors = db_read_config(smartgreen, "num_sensors");
    if (smartgreen->num_sensors < 0)
        smartgreen->num_sensors = 0;
    
    smartgreen->num_zones = db_read_config(smartgreen, "num_zones");
    if (smartgreen->num_zones < 0)
        smartgreen->num_zones = 0;
}