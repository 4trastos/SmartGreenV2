#include "../incl/smartgreen.h"

int db_init(t_smartgreen *smartgreen)
{
    int db;
    db = sqlite3_open(DB_PATH, &smartgreen->db);
    if (db != SQLITE_OK)
        return (-1);
    sqlite3_exec(smartgreen->db, const char *sql, int (*callback)(void*,int,char**,char**), void *arg, char **errmsg);
    return (0);
}

int ft_check_database(t_smartgreen *smartgreen)
{
    if (db_init(smartgreen) == -1)
        return (-1);
    return (0);
}