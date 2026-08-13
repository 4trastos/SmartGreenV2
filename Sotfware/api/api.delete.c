#include "../incl/smartgreen.h"

enum MHD_Result     api_put_scheduler(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    name[64] = {0};
    char    action[8] = {0};
    char    hour[8] = {0};
    char    sql[512];
    char    *err_msg = NULL;
    int     zone_id = 0;
    int     active = 1;
    int     mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0, sun = 0;
    int     rc;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    sscanf(body, "{\"name\":\"%63[^\"]\",\"zone_id\":%d,\"action\":\"%7[^\"]\",\"hour\":\"%7[^\"]\"", name, &zone_id, action, hour);
    active = strstr(body, "\"active\":1") ? 1 : 0;
    mon = strstr(body, "\"mon\":1") ? 1 : 0;
    tue = strstr(body, "\"tue\":1") ? 1 : 0;
    wed = strstr(body, "\"wed\":1") ? 1 : 0;
    thu = strstr(body, "\"thu\":1") ? 1 : 0;
    fri = strstr(body, "\"fri\":1") ? 1 : 0;
    sat = strstr(body, "\"sat\":1") ? 1 : 0;
    sun = strstr(body, "\"sun\":1") ? 1 : 0;

    snprintf(sql, sizeof(sql),
        "UPDATE scheduler SET name='%s', zone_id=%d, active=%d, action='%s', hour='%s', "
        "mon=%d, tue=%d, wed=%d, thu=%d, fri=%d, sat=%d, sun=%d WHERE id=%d;",
        name, zone_id, active, action, hour, mon, tue, wed, thu, fri, sat, sun, id);

    pthread_mutex_lock(&smartgreen->data_mutex);
    rc = sqlite3_exec(smartgreen->db, sql, NULL, NULL, &err_msg);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    if (rc != SQLITE_OK)
    {
        sqlite3_free(err_msg);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}