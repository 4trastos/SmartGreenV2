#include "../incl/smartgreen.h"

int ft_check_database(t_smartgreen *smartgreen)
{
    if (db_init(smartgreen) == -1)
        return (-1);
    return (0);
}