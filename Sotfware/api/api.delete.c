#include "../incl/smartgreen.h"

enum MHD_Result     api_delete_scheduler(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "DELETE FROM scheduler WHERE id = ?;";
    // const char      *sql = "UPDATE scheduler SET active = 0 WHERE id = ?;";
    int             rc;

    if (id <= 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid scheduler id\"}"));

    pthread_mutex_lock(&smartgreen->data_mutex);

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }

    sqlite3_bind_int(stmt, 1, id);

    rc = sqlite3_step(stmt);

    if (rc != SQLITE_DONE)
    {
        sqlite3_finalize(stmt);
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }

    sqlite3_finalize(stmt);

    /* Recargar la lista de schedulers activos en memoria. */
    if (db_read_scheduler(smartgreen) == -1)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"Scheduler reload error\"}"));
    }

    pthread_mutex_unlock(&smartgreen->data_mutex);

    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_put_scheduler(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char            name[64] = {0};
    char            action[8] = {0};
    char            hour[8] = {0};
    char            *ptr = NULL;
    char            *end = NULL;
    int             zone_id = 0;
    int             active = 1;
    int             mon = 0, tue = 0, wed = 0, thu = 0, fri = 0, sat = 0, sun = 0;
    int             len = 0;
    int             rc;
    char            mode[64] = {0};
    float           target_temp = 0.0f;
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "UPDATE scheduler SET name=?, zone_id=?, active=?, action=?, hour=?, "
                           "mon=?, tue=?, wed=?, thu=?, fri=?, sat=?, sun=?, mode=?, target_temp=? WHERE id=?;";

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    // Extraer name
    ptr = strstr(body, "\"name\":\"");
    if (ptr) {
        ptr += 8;
        end = strchr(ptr, '"');
        if (end) { len = end - ptr; if (len > 63) len = 63; strncpy(name, ptr, len); name[len] = '\0'; }
    }
    // Extraer hour
    ptr = strstr(body, "\"hour\":\"");
    if (ptr) {
        ptr += 8;
        end = strchr(ptr, '"');
        if (end) { len = end - ptr; if (len > 7) len = 7; strncpy(hour, ptr, len); hour[len] = '\0'; }
    }
    // Extraer action
    ptr = strstr(body, "\"action\":\"");
    if (ptr) sscanf(ptr, "\"action\":\"%7[^\"]\"", action);
    // Extraer zone_id
    ptr = strstr(body, "\"zone_id\":");
    if (ptr) sscanf(ptr + 10, "%d", &zone_id);

    active = strstr(body, "\"active\":1") ? 1 : 0;
    mon = strstr(body, "\"mon\":1") ? 1 : 0;
    tue = strstr(body, "\"tue\":1") ? 1 : 0;
    wed = strstr(body, "\"wed\":1") ? 1 : 0;
    thu = strstr(body, "\"thu\":1") ? 1 : 0;
    fri = strstr(body, "\"fri\":1") ? 1 : 0;
    sat = strstr(body, "\"sat\":1") ? 1 : 0;
    sun = strstr(body, "\"sun\":1") ? 1 : 0;

    ptr = strstr(body, "\"mode\":\"");
    if (ptr) sscanf(ptr, "\"mode\":\"%63[^\"]\"", mode);
    if (mode[0] == '\0') ft_strcpy(mode, "AUTO", sizeof(mode));

    ptr = strstr(body, "\"target_temp\":");
    if (ptr) sscanf(ptr + 14, "%f", &target_temp);

    pthread_mutex_lock(&smartgreen->data_mutex);
    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    sqlite3_bind_text(stmt, 1,  name,    -1, SQLITE_TRANSIENT);
    sqlite3_bind_int (stmt, 2,  zone_id);
    sqlite3_bind_int (stmt, 3,  active);
    sqlite3_bind_text(stmt, 4,  action,  -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5,  hour,    -1, SQLITE_TRANSIENT);
    sqlite3_bind_int (stmt, 6,  mon);
    sqlite3_bind_int (stmt, 7,  tue);
    sqlite3_bind_int (stmt, 8,  wed);
    sqlite3_bind_int (stmt, 9,  thu);
    sqlite3_bind_int (stmt, 10, fri);
    sqlite3_bind_int (stmt, 11, sat);
    sqlite3_bind_int (stmt, 12, sun);
    sqlite3_bind_text  (stmt, 13, mode,        -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 14, target_temp);
    sqlite3_bind_int   (stmt, 15, id);
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&smartgreen->data_mutex);

    if (rc != SQLITE_DONE)
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}