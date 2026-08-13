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

enum MHD_Result     api_get_alarms(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    sqlite3_stmt        *stmt = NULL;
    const char          *sql = "SELECT id, unit_id, timestamp, level, message FROM error_log ORDER BY timestamp DESC LIMIT 50;";
    int                 rc;
    struct json_object  *array = json_object_new_array();
    struct json_object  *obj;
    enum MHD_Result     result; 

    pthread_mutex_lock(&smartgreen->data_mutex);
    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        json_object_put(array);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }

    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        obj = json_object_new_object();
        json_object_object_add(obj, "id",        json_object_new_int((int)sqlite3_column_int(stmt, 0)));
        json_object_object_add(obj, "unit_id",   json_object_new_int((int)sqlite3_column_int(stmt, 1)));
        json_object_object_add(obj, "timestamp", json_object_new_int64((int64_t)sqlite3_column_int(stmt, 2)));
        json_object_object_add(obj, "level",     json_object_new_string((const char *)sqlite3_column_text(stmt, 3)));
        json_object_object_add(obj, "message",   json_object_new_string((const char *)sqlite3_column_text(stmt, 4)));
        json_object_array_add(array, obj);
    }

    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&smartgreen->data_mutex);

    const char *json_str = json_object_to_json_string(array);
    result = api_send_response(connection, MHD_HTTP_OK, json_str);
    json_object_put(array);
    return (result);
}

enum MHD_Result     api_get_config(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT key, value FROM config ORDER BY key ASC";
    char            responsed[16384];
    char            row[512];
    int             offset = 0;
    int             rc;
    int             first = 1;

    pthread_mutex_lock(&smartgreen->data_mutex);
    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    
    offset += snprintf(responsed + offset, sizeof(responsed), "[");

    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        snprintf(row, sizeof(row),
            "%s{"
            "\"key\":\"%s\","
            "\"value\":%s"
            "}",
            first ? "" : ",",
            sqlite3_column_text(stmt, 0),
            sqlite3_column_text(stmt, 1) 
        );
        offset += snprintf(responsed + offset, sizeof(responsed) - offset, "%s", row);
        first = 0;
    }
    offset += snprintf(responsed + offset, sizeof(responsed), "]");
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, responsed));
}