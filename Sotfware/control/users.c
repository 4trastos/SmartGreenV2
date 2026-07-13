#include "../incl/smartgreen.h"

void    ft_init_users(t_smartgreen *smartgreen)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_INIT_USER;
    int             rc;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "Users database prepare error: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return;
    }
    
    sqlite3_bind_text(stmt, 2, "admin", -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, "admin1234", -1 ,SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, "admin", -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 5, 1);
    
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Users initialized correctly\n");
    else
        fprintf(stderr, "Error users inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
}