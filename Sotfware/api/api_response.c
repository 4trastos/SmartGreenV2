#include "../incl/smartgreen.h"

enum MHD_Result     api_send_response(struct MHD_Connection *connection, int status_code, const char *response)
{
    struct MHD_Response *resp;
    enum MHD_Result     ret;

    resp = MHD_create_response_from_buffer(strlen(response), (void *)response, MHD_RESPMEM_PERSISTENT);
    MHD_add_response_header(resp, "Content-Type", "application/json");
    MHD_add_response_header(resp, "Access-Control-Allow-Origin", "*");
    ret = MHD_queue_response(connection, status_code, resp);
    MHD_destroy_response(resp);

    return (ret);
}