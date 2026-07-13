#include "../incl/smartgreen.h"

// Protocolo WebSocket — nombre que usará el cliente para conectar
static struct lws_protocols protocols[] = {
    {
        "smartgreen",                   // nombre del protocolo
        ft_ws_callback,                 // función callback
        0,                              // tamaño datos por sesión
        4096,                           // tamaño buffer recepción
        0, NULL, 0
    },
    {NULL, NULL, 0, 0, 0, NULL, 0}     // terminador — obligatorio
};

void    ft_ws_broadcast(t_smartgreen *smartgreen, const char *message)
{
    unsigned char   buffer[LWS_PRE + 4096];
    size_t          message_len;

    if (!smartgreen->ws_num_clients || !message)
        return;
    message_len = strlen(message);
    memset(buffer, 0, sizeof(buffer));
    memcpy(buffer + LWS_PRE, message, message_len);

    for (int i = 0; i < smartgreen->ws_num_clients; i++)
        if (smartgreen->ws_clients[i])
            lws_write(smartgreen->ws_clients[i], buffer + LWS_PRE, message_len, LWS_WRITE_TEXT);
    
}

int ft_ws_callback(struct lws *wsi, enum lws_callback_reasons reason, void *user, void *in, size_t len)
{
    t_smartgreen *smartgreen = lws_context_user(lws_get_context(wsi));
    (void)user;
    (void)len;

    switch (reason)
    {
        case LWS_CALLBACK_ESTABLISHED:
            if (smartgreen->ws_num_clients < MAX_WS_CLIENTS)
            {
                smartgreen->ws_clients[smartgreen->ws_num_clients++] = wsi;
                printf("WebSocket: cliente conectado\n");
            }
            break;
        case LWS_CALLBACK_CLOSED:
            for (int i = 0; i < smartgreen->ws_num_clients; i++)
                if (smartgreen->ws_clients[i] == wsi)
                {
                    smartgreen->ws_clients[i] = smartgreen->ws_clients[--smartgreen->ws_num_clients];
                    printf("WebSocket: cliente desconectado\n");
                    break;
                }
            break;
        case LWS_CALLBACK_RECEIVE:
            printf("WebSocket: mensaje recibido: %s\n", (char *)in);
            break;
        default:
            break;
    }
    return (0);
}

int ft_ws_init(t_smartgreen *smartgreen)
{
    struct lws_context_creation_info    info;

    memset(&info, 0, sizeof(info));
    info.port = 8081;
    info.protocols = protocols;
    info.gid = -1;
    info.uid = -1;
    info.options   = LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT;
    info.user = smartgreen;
    
    smartgreen->ws_context  = lws_create_context(&info);
    if (!smartgreen->ws_context)
    {
        printf("WebSocket: error creando contexto\n");
        return (-1);
    }
    printf("WebSocket arrancado en ws://localhost:8081\n");
    return (0);
}

void    ft_ws_stop(t_smartgreen *smartgreen)
{
    if (smartgreen->ws_context)
    {
        lws_context_destroy(smartgreen->ws_context);
        smartgreen->ws_context = NULL;
        printf("WebSocket stopped\n");
    }
    return;
}