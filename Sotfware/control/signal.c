#define _POSIX_C_SOURCE 200809L

#include "../incl/smartgreen.h"

void    sigint_handler(int sig)
{
    (void)sig;
    g_sigint_received = 1;
}

void    sigterm_handler(int sig)
{
    (void)sig;
    g_sigterm_received = 1;
}

void    init_signal()
{
    struct sigaction    sa_int;
    struct sigaction    sa_term;

    memset(&sa_int, 0, sizeof(sigaction));
    memset(&sa_term, 0, sizeof(sigaction));

    sa_int.sa_handler = sigint_handler;
    sigemptyset(&sa_int.sa_mask);
    sa_int.sa_flags = 0;
    sigaction(SIGINT, &sa_int, NULL);

    sa_term.sa_handler = sigterm_handler;
    sigemptyset(&sa_term.sa_mask);
    sa_term.sa_flags = 0;
    sigaction(SIGTERM, &sa_term, NULL);
}