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
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT id, unit_id, timestamp, level, message FROM error_log ORDER BY timestamp DESC LIMIT 50;";
    int             rc;
    char            responsed[4096];
    char            row[512];
    int             offset = 0;
    int             first = 1;

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));

    offset += snprintf(responsed + offset, sizeof(responsed), "[");
    while (sqlite3_step(stmt) == SQLITE_ROW)
    {
        snprintf(row, sizeof(row),
            "%s{"
            "\"id\":%d,"
            "\"unit_id\":%d,"
            "\"timestamp\":%ld,"
            "\"level\":\"%s\","
            "\"message\":\"%s\""
            "}",
            first ? "" : ",",
            sqlite3_column_int(stmt, 0),
            sqlite3_column_int(stmt, 1),
            (long)sqlite3_column_int(stmt, 2),
            (const char *)sqlite3_column_text(stmt, 3),
            (const char *)sqlite3_column_text(stmt, 4)
        );
        offset += snprintf(responsed + offset, sizeof(responsed) - offset, "%s", row);
        first = 0;
    }
    offset += snprintf(responsed + offset, sizeof(responsed), "]");
    sqlite3_finalize(stmt);
    return (api_send_response(connection, MHD_HTTP_OK, responsed));
}