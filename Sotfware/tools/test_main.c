#include "../incl/smartgreen.h"

volatile sig_atomic_t g_sigint_received = 0;
volatile sig_atomic_t g_sigterm_received = 0;
volatile sig_atomic_t g_alarm_modbus = 0;
volatile sig_atomic_t g_update_pending = 0;

int main(int argc, char **argv)
{
    (void)argc;
    (void)argv;
    return (0);
}