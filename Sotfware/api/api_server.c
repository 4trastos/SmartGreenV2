# include "../incl/smartgreen.h"

enum MHD_Result     api_request_handler(void *cls, struct MHD_Connection *connection, const char *url, const char *method, const char *version, const char *upload_data, size_t *upload_data_size, void **con_cls)
{
    t_smartgreen    *smartgreen = (t_smartgreen *)cls;

    (void)version;
    (void)upload_data;
    (void)upload_data_size;
    (void)con_cls;

    if (strcmp(method, "GET") == 0)
    {
        if (strcmp(url, "/api/coolers") == 0)
            return(api_get_coolers(smartgreen, connection));
        if (strcmp(url, "/api/sensors") == 0)
            return (api_get_sensors(smartgreen, connection));
        if (strcmp(url, "/api/zones") == 0)
            return (api_get_zones(smartgreen, connection));
    }

    return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\": \"Not found\"}"));
}

int api_start(t_smartgreen *smartgreen)
{
    smartgreen->api_daemon = MHD_start_daemon(
        MHD_USE_SELECT_INTERNALLY,              // hilo interno gestionado por MHD
        8080,                                   // Puerto
        NULL, NULL,                             // control de acceso (NULL = todos)
        &api_request_handler,                   // función que maneja las peticiones
        smartgreen,                             // cls → pasamos smartgreen al handler
        MHD_OPTION_END
    );

    if (!smartgreen->api_daemon)
    {
        fprintf(stderr, "Error: no se pudo arrancar la API en puerto 8080\n");
        return (-1);
    }

    smartgreen->api_thread.status = THREAD_RUNNING;
    printf("API REST Arrancada en http://localhost:8080\n");
    return (0);
}

int api_stop(t_smartgreen *smartgreen)
{
    if (smartgreen->api_daemon)
        MHD_stop_daemon(smartgreen->api_daemon);
    smartgreen->api_thread.status = THREAD_STOPPED;
    return(0);
}