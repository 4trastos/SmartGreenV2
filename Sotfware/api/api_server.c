# include "../incl/smartgreen.h"

enum MHD_Result     api_request_handler(void *cls, struct MHD_Connection *connection, const char *url, const char *method, const char *version, const char *upload_data, size_t *upload_data_size, void **con_cls)
{
    enum MHD_Result ret;
    char            action[32];
    t_smartgreen    *smartgreen = (t_smartgreen *)cls;
    t_post_ctx      *ctx;
    int             id;

    (void)version;

    if (strcmp(method, "GET") == 0)
    {
        if (strcmp(url, "/api/coolers") == 0)
            return(api_get_coolers(smartgreen, connection));
        if (strcmp(url, "/api/sensors") == 0)
            return (api_get_sensors(smartgreen, connection));
        if (strcmp(url, "/api/zones") == 0)
            return (api_get_zones(smartgreen, connection));
        if (strcmp(url, "/api/status") == 0)
            return (api_get_status(smartgreen, connection));
        if (strcmp(url, "/api/alarms") == 0)
            return (api_get_alarms(smartgreen, connection));
        if (strcmp(url, "/api/history") == 0)
            return (api_get_history(smartgreen, connection));
    }
    if (strcmp(method, "POST") == 0)
    {
        id = 0;

        if (*con_cls == NULL)
        {
            ctx = malloc(sizeof(t_post_ctx));
            if (!ctx)
                return (MHD_NO);
            memset(ctx, 0, sizeof(t_post_ctx));
            *con_cls = ctx;
            return (MHD_YES);
        }

        ctx = *con_cls;
        if (*upload_data_size != 0)
        {
            if (ctx->len + *upload_data_size >= sizeof(ctx->body))
                return (MHD_NO);
            memcpy(ctx->body + ctx->len, upload_data, *upload_data_size);
            ctx->len += *upload_data_size;
            ctx->body[ctx->len] = '\0';

            *upload_data_size = 0;
            return (MHD_YES);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/zones/%d/%31s", &id, action) == 2)
        {
            if (strcmp(action, "onoff") == 0)
                ret = api_post_zone_onoff(smartgreen, connection, id, ctx->body, ctx->len);
            else if(strcmp(action, "fanspeed") == 0)
                ret = api_post_zone_fanspeed(smartgreen, connection, id, ctx->body, ctx->len);
            else
                ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Unknown action\"}");
            free(ctx);
            *con_cls = NULL;
            return(ret);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/maintenance/%d", &id) == 1)
        {
            ret = api_post_maintenance(smartgreen, connection, id, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        // POST /api/config
        // POST /api/scheduler
        // POST /api/login
        free(ctx);
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