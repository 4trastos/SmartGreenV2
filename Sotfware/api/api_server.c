# include "../incl/smartgreen.h"

enum MHD_Result api_post_reset(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    (void)smartgreen;
    api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
    sleep(1);
    system("/home/pi/reset.sh &");
    return (MHD_YES);
}

enum MHD_Result     api_serve_file(struct MHD_Connection *connection, const char *filepath, const char *mime)
{
    struct MHD_Response *resp;
    enum MHD_Result ret;
    FILE    *file;
    char    fullpath[512];
    char    *buffer;
    long    size;

    if (strstr(filepath, "..") != NULL)
        return (api_send_response(connection, MHD_HTTP_FORBIDDEN, "{\"error\":\"Forbidden\"}"));
    snprintf(fullpath, sizeof(fullpath), "/home/pi/smartgreen_new/Sotfware/www%s", filepath);
    file = fopen(fullpath, "rb");
    if (!file)
        return(api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Not found\"}"));
    
    fseek(file, 0, SEEK_END);
    size = ftell(file);
    rewind(file);
    buffer = malloc(size);
    if (!buffer)
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    fread(buffer, 1, size, file);
    fclose(file);
    
    resp = MHD_create_response_from_buffer(size, buffer, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(resp, "Content-Type", mime);
    MHD_add_response_header(resp, "Access-Control-Allow-Origin", "*");
    ret = MHD_queue_response(connection, MHD_HTTP_OK, resp);
    MHD_destroy_response(resp);

    return(ret);
}

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
        if (strcmp(url, "/api/setup/status") == 0)
            return api_get_setup_status(smartgreen, connection);
        if (strncmp(url, "/api/coolers/", 13) == 0)
            return (api_get_cooler(smartgreen, connection, atoi(url + 13)));
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
        if (strcmp(url, "/api/config") == 0)
            return (api_get_config(smartgreen, connection));
        if (strcmp(url, "/api/scheduler") == 0)
            return (api_get_scheduler(smartgreen, connection));
        if (strcmp(url, "/api/imd/boards") == 0)
            return (api_get_imd_boards(smartgreen, connection));
        if (strcmp(url, "/") == 0 || strcmp(url, "/index.html") == 0)
            return api_serve_file(connection, "/index.html", "text/html");
        if (strstr(url, ".js"))
            return api_serve_file(connection, url, "application/javascript");
        if (strstr(url, ".css"))
            return api_serve_file(connection, url, "text/css");
        if (strstr(url, ".png") || strstr(url, ".jpg") || strstr(url, ".svg"))
            return api_serve_file(connection, url, "image/png");
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
        if (strncmp(url, "/api/setup/", 11) == 0)
        {
            char action[32] = {0};
            sscanf(url + 11, "%31s", action);
            if (strcmp(action, "language") == 0)
                ret = api_post_setup_language(smartgreen, connection, ctx->body, ctx->len);
            else if (strcmp(action, "zones") == 0)
                ret = api_post_setup_zones(smartgreen, connection, ctx->body, ctx->len);
            else if (strcmp(action, "coolers") == 0)
                ret = api_post_setup_coolers(smartgreen, connection, ctx->body, ctx->len);
            else if (strcmp(action, "sensors") == 0)
                ret = api_post_setup_sensors(smartgreen, connection, ctx->body, ctx->len);
            else if (strcmp(action, "scan") == 0)
                ret = api_post_setup_scan(smartgreen, connection);
            else if (strcmp(action, "confirm") == 0)
                ret = api_post_setup_confirm(smartgreen, connection);
            else if (strcmp(action, "purge") == 0)
                ret = api_post_setup_purge(smartgreen, connection);
            else if (strcmp(action, "water_waits") == 0)
                ret = api_post_setup_water_waits(smartgreen, connection, ctx->body, ctx->len);
            else
                ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Unknown\"}");
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/coolers/%d/%31s", &id, action) == 2 && (strcmp(action, "imd") == 0 || strcmp(action, "out") == 0 || strcmp(action, "onoff") == 0))
        {
            if (strcmp(action, "imd") == 0)
                ret = api_post_cooler_imd(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "out") == 0)
                ret = api_post_cooler_out(smartgreen, connection, id, ctx->body, ctx->len);
            else
                ret = api_post_cooler_onoff(smartgreen, connection, id, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/zones/%d/%31s", &id, action) == 2)
        {
            if (strcmp(action, "onoff") == 0)
                ret = api_post_zone_onoff(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "fanspeed") == 0)
                ret = api_post_zone_fanspeed(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "drain") == 0)
                ret = api_post_zone_drain(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "mode") == 0)
                ret = api_post_zone_mode(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "humidity") == 0)
                ret = api_post_zone_humidity(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "humiditycontrol") == 0)
                ret = api_post_zone_humidity_control(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "targettemp") == 0)
                ret = api_post_zone_targettemp(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "solenoid") == 0)
                ret = api_post_zone_solenoid(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "pump") == 0)
                ret = api_post_zone_pump(smartgreen, connection, id, ctx->body, ctx->len);
            else if (strcmp(action, "cancelprewet") == 0)
            {
                int z = ft_find_zone(smartgreen, id);
                if (z != -1) {
                    pthread_mutex_lock(&smartgreen->data_mutex);
                    ft_strcpy(smartgreen->zone_params[z].prewet_in_progress, "no", sizeof(smartgreen->zone_params->prewet_in_progress));
                    db_update_zone_params(smartgreen, &smartgreen->zone_params[z]);
                    pthread_mutex_unlock(&smartgreen->data_mutex);
                }
                ret = api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
            }
            else
                ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Unknown action\"}");
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/maintenance/%d", &id) == 1)
        {
            ret = api_post_maintenance(smartgreen, connection, id, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/sensors/%d/%31s", &id, action) == 2 && strcmp(action, "offsets") == 0)
        {
            ret = api_post_sensor_offsets(smartgreen, connection, id, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/config") == 0)
        {
            ret = api_post_config(smartgreen, connection, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return(ret);
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/scheduler") == 0)
        {
            ret = api_post_scheduler(smartgreen, connection, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }
        
        ctx = *con_cls;
        if (strcmp(url, "/api/login") == 0)
        {
            ret = api_post_login(smartgreen, connection, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/reboot") == 0)
        {
            ret = api_post_reboot(smartgreen, connection, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/keyboard") == 0)
        {
            system("DISPLAY=:0 matchbox-keyboard &");
            free(ctx);
            *con_cls = NULL;
            return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/keyboard/hide") == 0)
        {
            system("pkill matchbox-keyboard");
            free(ctx);
            *con_cls = NULL;
            return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/imd/unlock") == 0)
        {
            ret = api_post_imd_unlock(smartgreen, connection, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (strcmp(url, "/api/imd/assign") == 0)
        {
            ret = api_post_imd_assign(smartgreen, connection, ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        ctx = *con_cls;
        if (sscanf(url, "/api/coolers/%d/%31s", &id, action) == 2)
        {
            if (strcmp(action, "r0") == 0)
                ret = api_post_cooler_raw(smartgreen, connection, id, 0, ctx->body, ctx->len);
            else if (strcmp(action, "r49") == 0)
                ret = api_post_cooler_raw(smartgreen, connection, id, 49, ctx->body, ctx->len);
            else if (strcmp(action, "r50") == 0)
                ret = api_post_cooler_raw(smartgreen, connection, id, 50, ctx->body, ctx->len);
            else if (strcmp(action, "r52") == 0)
                ret = api_post_cooler_raw(smartgreen, connection, id, 52, ctx->body, ctx->len);
            else if (strcmp(action, "rearm") == 0)
                ret = api_post_cooler_rearm(smartgreen, connection, id);
            else if (strcmp(action, "heartbeat") == 0)
            {
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_HEARTBEAT, id, 400, 300);
                ret = api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
            }
            else if (strcmp(action, "prewet") == 0)
            {
                int idx = ft_find_cooler(smartgreen, id);
                if (idx == -1)
                    ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Cooler not found\"}");
                else
                {
                    t_prewet_args *args = malloc(sizeof(t_prewet_args));
                    if (args)
                    {
                        args->smartgreen  = smartgreen;
                        args->zone_id     = smartgreen->coolers[idx].zone_id;
                        args->need_prewet = 1;
                        args->from_setup  = 0;          // antes sin inicializar
                        pthread_t tid;
                        pthread_create(&tid, NULL, prewet_thread, args);
                        pthread_detach(tid);
                    }
                    ret = api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
                }
            }
            else if (strcmp(action, "drain_cycle") == 0)
            {
                int idx = ft_find_cooler(smartgreen, id);
                if (idx == -1)
                    ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Cooler not found\"}");
                else
                {
                    t_drain_args *drain_args = malloc(sizeof(t_drain_args));
                    if (drain_args)
                    {
                        drain_args->smartgreen = smartgreen;
                        drain_args->unit_id    = id;
                        drain_args->zone_id    = smartgreen->coolers[idx].zone_id;
                        drain_args->reason     = DRAIN_SALINITY;
                        pthread_t tid;
                        pthread_create(&tid, NULL, ft_drain_thread, drain_args);
                        pthread_detach(tid);
                    }
                    ret = api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
                }
            }
            else if (strcmp(action, "prewet_test") == 0)
            {
                int idx = ft_find_cooler(smartgreen, id);
                if (idx == -1)
                {
                    ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Cooler not found\"}");
                }
                else
                {
                    t_prewet_args *args = malloc(sizeof(t_prewet_args));
                    if (args)
                    {
                        args->smartgreen  = smartgreen;
                        args->zone_id     = smartgreen->coolers[idx].zone_id;
                        args->need_prewet = 1;
                        args->from_setup = 0;
                        pthread_t tid;
                        pthread_create(&tid, NULL, prewet_test_thread, args);
                        pthread_detach(tid);
                    }
                    ret = api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
                }
            }
            else
                ret = api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Unknown action\"}");
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }
        
        if (strcmp(url, "/api/reset") == 0)
        {
            ret = api_post_reset(smartgreen, connection);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }

        free(ctx);
    }

    if (strcmp(method, "DELETE") == 0)
    {
        if (strncmp(url, "/api/scheduler/", 15) == 0)
            return (api_delete_scheduler(smartgreen, connection, atoi(url + 15)));
    }

    if (strcmp(method, "PUT") == 0)
    {
        if (*con_cls == NULL)
        {
            ctx = malloc(sizeof(t_post_ctx));
            if (!ctx) return (MHD_NO);
            memset(ctx, 0, sizeof(t_post_ctx));
            *con_cls = ctx;
            return (MHD_YES);
        }
        ctx = *con_cls;
        if (*upload_data_size != 0)
        {
            if (ctx->len + *upload_data_size >= sizeof(ctx->body)) return (MHD_NO);
            memcpy(ctx->body + ctx->len, upload_data, *upload_data_size);
            ctx->len += *upload_data_size;
            ctx->body[ctx->len] = '\0';
            *upload_data_size = 0;
            return (MHD_YES);
        }
        ctx = *con_cls;
        if (strncmp(url, "/api/scheduler/", 15) == 0)
        {
            ret = api_put_scheduler(smartgreen, connection, atoi(url + 15), ctx->body, ctx->len);
            free(ctx);
            *con_cls = NULL;
            return (ret);
        }
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

void    api_stop(t_smartgreen *smartgreen)
{
    if (smartgreen->api_daemon)
        MHD_stop_daemon(smartgreen->api_daemon);
    smartgreen->api_thread.status = THREAD_STOPPED;
}