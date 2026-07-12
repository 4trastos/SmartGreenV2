#include "../incl/smartgreen.h"

// enum MHD_Result     api_post_config(t_smartgreen *smartgreen, struct MHD_Connection *connection, int unit_id, const char *body, size_t body_size)
// {
//     if (!body || body_size == 0)
//         return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    
//     return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
// }

enum MHD_Result     api_post_maintenance(t_smartgreen *smartgreen, struct MHD_Connection *connection, int unit_id, const char *body, size_t body_size)
{
    t_maintenance_log   maint;
    char                type[64] = {0};
    char                description[256] = {0};
    char                technician[256] = {0};

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    
    // Parsear JSON simple
    sscanf(body, "{\"type\":\"%63[^\"]\",\"technician\":\"%255[^\"]\",\"description\":\"%255[^\"]\"}", type, technician, description);

    if (type[0] == '\0')
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"type required\"}"));
    
    maint.unit_id = unit_id;
    maint.timestamp = get_timestamp();
    maint.next_service = 0;
    ft_strcpy(maint.type, type, sizeof(maint.type));
    ft_strcpy(maint.description, description, sizeof(maint.description));
    ft_strcpy(maint.technician, technician, sizeof(maint.technician));

    if (db_save_maintenance_log(smartgreen, &maint) == -1)
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    return(api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_zone_onoff(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    action[8] = {0};
    int     zone_idx;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    // Extraer el valor de "action"
    if (sscanf(body, "{\"action\":\"%7[^\"]\"}", action) != 1)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON ONOFF\"}"));
    
    // Encontrar la zona
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return(api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));

    // Actualizar el estado en memoria
    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].on_off, action, sizeof(smartgreen->zone_params->on_off));
    pthread_mutex_unlock(&smartgreen->data_mutex);

    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_zone_fanspeed(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    int zone_idx;
    int speed = 0;

    if (!body || body_size == 0)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    if (sscanf(body, "{\"speed\":%d}", &speed) != 1)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON SPEED\"}"));
    
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return(api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].fan_speed_cmd = speed;
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}