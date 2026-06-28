#include "../incl/smartgreen.h"

void    ft_free_structs(t_smartgreen *smartgreen)
{
    free(smartgreen->coolers);
    free(smartgreen->sensors);
    free(smartgreen);
}