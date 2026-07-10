#include "../incl/smartgreen.h"

void    log_error(const char *message)
{
    time_t  now = get_timestamp();
    fprintf(stderr, "[ERROR] [%ld] %s\n", now, message);
}

void    log_info(const char *message)
{
    time_t  now = get_timestamp();
    fprintf(stdout, "[INFO] [%ld] %s\n", now, message);
}
