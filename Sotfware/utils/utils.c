#include "../incl/smartgreen.h"

void    ft_free_structs(t_smartgreen *smartgreen)
{
    free(smartgreen->coolers);
    free(smartgreen->sensors);
    free(smartgreen);
}

int ft_strlen(char *str)
{
    int i = 0;

    while (str[i] != '\0')
        i++;
    return (i);
}

char    *ft_strcpy(char *dst, char *src, int max_len)
{
    int i = 0;
    int size = ft_strlen(src);

    while ((i < max_len -1) && (i < size))
    {
        dst[i] = src[i];
        i++;
    }
    
    dst[i] = '\0';
    return (dst);
}