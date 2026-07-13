#include "../incl/smartgreen.h"

enum MHD_Result     api_post_scheduler(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    t_scheduler_entry   schedul;
    char                name[64] = {0};
    char                action[8] = {0};
    char                hour[8] = {0};
    int                 zone_id = 0;
    int                 mon = 0;
    int                 tue = 0;
    int                 wed = 0;
    int                 thu = 0;
    int                 fri = 0;
    int                 sat = 0;
    int                 sun = 0;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    sscanf(body, "{\"name\":\"%63[^\"]\",\"zone_id\":%d,\"action\":\"%7[^\"]\",\"hour\":\"%7[^\"]\"", name, &zone_id, action, hour);

    if (name[0] == '\0')
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"name required\"}"));
    mon = strstr(body, "\"mon\":1") ? 1 : 0;
    tue = strstr(body, "\"tue\":1") ? 1 : 0;
    wed = strstr(body, "\"wed\":1") ? 1 : 0;
    thu = strstr(body, "\"thu\":1") ? 1 : 0;
    fri = strstr(body, "\"fri\":1") ? 1 : 0;
    sat = strstr(body, "\"sat\":1") ? 1 : 0;
    sun = strstr(body, "\"sun\":1") ? 1 : 0;    
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    memset(&schedul, 0, sizeof(t_scheduler_entry));
    ft_strcpy(schedul.name, name, sizeof(schedul.name));
    schedul.zone_id = zone_id;
    ft_strcpy(schedul.action, action, sizeof(schedul.action));
    ft_strcpy(schedul.hour, hour, sizeof(schedul.hour));
    schedul.mon = mon;
    schedul.tue = tue;
    schedul.wed = wed;
    schedul.thu = thu;
    schedul.fri = fri;
    schedul.sat = sat;
    schedul.sun = sun;
    schedul.active = 1;
    
    if (db_save_scheduler(smartgreen, &schedul) == -1)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_config(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    char    key[64] = {0};
    int     value = 0;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    
    sscanf(body, "{\"key\":\"%63[^\"]\",\"value\":%d}", key, &value);
    if (key[0] == '\0')
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"key required\"}"));
    if (value == 0)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"value required\"}"));
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    if (db_update_config(smartgreen, key, value) == -1)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

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
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    maint.unit_id = unit_id;
    maint.timestamp = get_timestamp();
    maint.next_service = 0;
    ft_strcpy(maint.type, type, sizeof(maint.type));
    ft_strcpy(maint.description, description, sizeof(maint.description));
    ft_strcpy(maint.technician, technician, sizeof(maint.technician));

    if (db_save_maintenance_log(smartgreen, &maint) == -1)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
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