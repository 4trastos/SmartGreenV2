# include "../incl/smartgreen.h"

int     api_request_handler(void *cls, struct MHD_Connection *connection, const char *url, const char *method, const char *version, const char *upload_data, size_t *upload_data_size, void **con_cls)
{
    (void)version;
    (void)upload_data;
    (void)upload_data_size;
    (void)con_cls;
    (void)url;
    (void)cls;

    const char          *response = "{\"status\": \"ok\"}";
    struct MHD_Response *resp;
    int                 returned;

    resp = MHD_create_response_from_buffer(strlen(response), (void *)response, MHD_RESPMEM_PERSISTENT);
    MHD_add_response_header(resp, "Content-Type", "application/json");
    returned = MHD_queue_response(connection, MHD_HTTP_OK, resp);
    MHD_destroy_response(resp);
    return (returned);
}

int api_start(t_smartgreen *smartgreen)
{
    smartgreen->api_thread.status = THREAD_RUNNING;
    return (0);
}

int api_stop(t_smartgreen *smartgreen)
{
    smartgreen->api_thread.status = THREAD_STOPPED;
    return(0);
}