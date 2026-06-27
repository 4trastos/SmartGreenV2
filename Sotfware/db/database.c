#include "../incl/smartgreen.h"

int     db_save_cooler(t_smartgreen *smartgreen, t_cooler_state *cooler)
{
    return (0);
}

int db_init(t_smartgreen *smartgreen)
{
    char    *err_msg = NULL;
    int     db;

    db = sqlite3_open(DB_PATH, &smartgreen->db);
    if (db != SQLITE_OK)
    {
        fprintf(stderr, "The database could not be opened: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return (-1);
    }
    printf("Successful database connection.\n");

    db = sqlite3_exec(smartgreen->db, SCHEMA_SQL, NULL, NULL, &err_msg);
    if (db != SQLITE_OK)
    {
        fprintf(stderr, "The database could not be created: ( %s )\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(smartgreen->db);
        return (-1);
    }
    printf("Tables created/verified correctly\n");
    return (0);
}

int ft_check_database(t_smartgreen *smartgreen)
{
    smartgreen->num_coolers = 0;
    smartgreen->num_sensors = 0;
    smartgreen->num_zones = 0;
    if (db_init(smartgreen) == -1)
        return (-1);
    if (db_save_cooler(smartgreen, smartgreen->coolers) == -1)
        return (-1);
    return (0);
}