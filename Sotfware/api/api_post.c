#include "../incl/smartgreen.h"

enum MHD_Result api_post_cooler_raw(t_smartgreen *smartgreen, struct MHD_Connection *connection, int unit_id, int reg, const char *body, size_t body_size)
{
    int value = 0;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"value\":%d}", &value) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));
    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, unit_id, reg, value);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_post_zone_solenoid(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    action[8] = {0};
    int     on;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"action\":\"%7[^\"]\"}", action) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));
    on = (strcmp(action, "ON") == 0) ? 1 : 0;
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == id)
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE,
                smartgreen->coolers[i].unit_id, 50, calculate_register_51(on, 1));
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_post_zone_pump(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    action[8] = {0};
    int     on;
    int     zone_idx;
    int     fan_speed;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"action\":\"%7[^\"]\"}", action) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));

    on = (strcmp(action, "ON") == 0) ? 1 : 0;
    zone_idx = ft_find_zone(smartgreen, id);
    fan_speed = (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "IMD") == 0) ? 0 : smartgreen->zone_params[zone_idx].fan_speed_cmd;
    if (zone_idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].pump_on = on;
    pthread_mutex_unlock(&smartgreen->data_mutex);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        if (smartgreen->coolers[i].zone_id == id)
            ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, calculate_register_50(0, on, fan_speed));
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_post_zone_targettemp(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    float   value = 0.0f;
    int     zone_idx;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"value\":%f}", &value) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].target_temp = value;
    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_post_zone_humidity_control(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    int     zone_idx;
    int     value = 0;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"value\":%d}", &value) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));
    if (value != 0 && value != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"value must be 0 or 1\"}"));
    
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].humidity_control = value;
    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);

    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_post_zone_humidity(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    type[8] = {0};
    float   value = 0.0f;
    int     zone_idx;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"type\":\"%7[^\"]\",\"value\":%f}", type, &value) != 2)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));
    if (strcmp(type, "min") != 0 && strcmp(type, "max") != 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"type must be min or max\"}"));
    if (value < 0 || value > 100)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"value must be 0-100\"}"));

    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    if (strcmp(type, "min") == 0)
        smartgreen->zone_params[zone_idx].humidity_min = value;
    else
        smartgreen->zone_params[zone_idx].humidity_max = value;
    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);

    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_zone_drain(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    action[8] = {0};
    int     zone_idx;
    int     on;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    if (sscanf(body, "{\"action\":\"%7[^\"]\"}", action) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}"));

    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    if (strcmp(action, "ON") != 0 && strcmp(action, "OFF") != 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"action must be ON or OFF\"}"));

    on = (strcmp(action, "ON") == 0) ? 1 : 0;

    pthread_mutex_lock(&smartgreen->data_mutex);
    if (smartgreen->modbus_ctx)
    {
        for (int i = 0; i < smartgreen->num_coolers; i++)
        {
            if (smartgreen->coolers[i].zone_id == id)
                ft_cooler_drain(smartgreen, smartgreen->coolers[i].unit_id, on);
        }
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

enum MHD_Result     api_post_zone_mode(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    char    mode[8];
    int     zone_idx;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    sscanf(body, "{\"mode\":\"%7[^\"]\"}", mode);
    if (mode[0] == '\0')
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"mode required\"}"));
    
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}");
    
    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].cool_fan_mode, mode, sizeof(smartgreen->zone_params->cool_fan_mode));
    if (db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]) == -1)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_reboot(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    enum MHD_Result ret;
    (void)smartgreen;
    (void)body;
    (void)body_size;

    ret = api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
    sleep(1);  // dar tiempo a que llegue la respuesta
    sync();
    reboot(RB_AUTOBOOT);
    return (ret);
}

enum MHD_Result     api_post_login(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = "SELECT id, role FROM users WHERE username = ? AND password = ? AND active = 1";
    int             rc;
    char            username[64] = {0};
    char            password[64] = {0};
    char            token[128];
    char            role[32];
    char            response[256];
    unsigned char   rand_bytes[32];
    char            hashed_pw[65];

    if (!body || body_size == 0)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    
    sscanf(body, "{\"username\":\"%63[^\"]\",\"password\":\"%63[^\"]\"}", username, password);
    if (username[0] == '\0')
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"username required\"}"));
    if (password[0] == '\0')
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"password requiered\"}"));
    
    ft_sha256(password, hashed_pw);    
    pthread_mutex_lock(&smartgreen->data_mutex);

    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return(api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, hashed_pw, -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) == SQLITE_ROW)
    {
        ft_strcpy(role, (char *)sqlite3_column_text(stmt, 1), sizeof(role));
        // snprintf(token, sizeof(token), "sg_%s_%ld", username, get_timestamp());
        RAND_bytes(rand_bytes, sizeof(rand_bytes));
        for (int i = 0; i < 32; i++)
            snprintf(token + (i * 2), 3, "%02x", rand_bytes[i]);
        token[64] = '\0';

        ft_strcpy(smartgreen->active_token, token, sizeof(smartgreen->active_token));
        smartgreen->token_expiry = get_timestamp() + 3600;  // 1 hora
        snprintf(response, sizeof(response), "{\"ok\":true,\"token\":\"%s\",\"role\":\"%s\"}", token, role);

        sqlite3_finalize(stmt);
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return(api_send_response(connection, MHD_HTTP_OK, response));
    }

    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return(api_send_response(connection, MHD_HTTP_UNAUTHORIZED, "{\"error\":\"Invalid credentials\"}"));
}

enum MHD_Result     api_post_scheduler(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    t_scheduler_entry   schedul;
    char                name[64] = {0};
    char                action[8] = {0};
    char                hour[8] = {0};
    char                *ptr = NULL;
    char                *end = NULL;
    int                 zone_id = 0;
    int                 len = 0;
    int                 mon = 0;
    int                 tue = 0;
    int                 wed = 0;
    int                 thu = 0;
    int                 fri = 0;
    int                 sat = 0;
    int                 sun = 0;
    char                mode[64] = {0};
    float               target_temp = 0.00; 

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    ptr = strstr(body, "\"name\":\"");
    if (ptr)
    {
        ptr += 8;
        end = strchr(ptr, '"');
        if (end)
        {
            len = end - ptr;
            if (len > 63) len = 63;
            strncpy(name, ptr, len);
            name[len] = '\0';
        }
    }

    ptr = strstr(body, "\"hour\":\"");
    if (ptr)
    {
        ptr += 8;
        end = strchr(ptr, '"');
        if (end)
        {
            len = end - ptr;
            if (len > 7) len = 7;
            strncpy(hour, ptr, len);
            hour[len] = '\0';
        }
    }

    ptr = strstr(body, "\"mode\":\"");
    if (ptr)
        sscanf(ptr, "\"mode\":\"%63[^\"]\"", mode);
    if (mode[0] == '\0')
        ft_strcpy(mode, "AUTO", sizeof(mode));

    ptr = strstr(body, "\"target_temp\":");
    if (ptr)
        sscanf(ptr + 14, "%f", &target_temp);

    ptr = strstr(body, "\"action\":\"");
    if (ptr)
        sscanf(ptr, "\"action\":\"%7[^\"]\"", action);

    ptr = strstr(body, "\"zone_id\":");
    if (ptr)
        sscanf(ptr + 10, "%d", &zone_id);

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
    ft_strcpy(schedul.mode, mode, sizeof(schedul.mode));
    schedul.target_temp = target_temp;

    if (db_save_scheduler(smartgreen, &schedul) == -1)
    {
        pthread_mutex_unlock(&smartgreen->data_mutex);
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"DB error\"}"));
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_config(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    char    key[64] = {0};
    int     value = 0;
    int     parsed;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    
    parsed = sscanf(body, "{\"key\":\"%63[^\"]\",\"value\":%d}", key, &value);
    if (key[0] == '\0')
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"key required\"}"));
    if (value == 0 || parsed < 2)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"key and value required\"}"));
    
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
    t_prewet_args   *args;
    char            action[8] = {0};
    char            cool_fan_mode[8];
    char            sql_off[128];
    int             zone_idx;
    int             on;
    int             prewet_sel;
    int             need_prewet;
    int             unit_id;
    int             already_running;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));

    if (sscanf(body, "{\"action\":\"%7[^\"]\"}", action) != 1)
        return(api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON ONOFF\"}"));
    
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return(api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));
    if (strcmp(action, "ON") != 0 && strcmp(action, "OFF") != 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"action must be ON or OFF\"}"));

    on = (strcmp(action, "ON") == 0) ? 1 :0;

    pthread_mutex_lock(&smartgreen->data_mutex);
    ft_strcpy(smartgreen->zone_params[zone_idx].on_off, action, sizeof(smartgreen->zone_params->on_off));

    if (smartgreen->modbus_ctx)
    {
        for (int i = 0; i < smartgreen->num_coolers; i++)
        {
            if (smartgreen->coolers[i].zone_id == id)
                ft_cooler_onoff(smartgreen, smartgreen->coolers[i].unit_id, on);
        }
    }
    // pthread_mutex_unlock(&smartgreen->data_mutex);

    int ret = db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    printf("db_update_zone_params ret=%d on_off=%s pump=%d zone_id=%d\n", ret, smartgreen->zone_params[zone_idx].on_off, smartgreen->zone_params[zone_idx].pump_on, smartgreen->zone_params[zone_idx].zone_id);
    fflush(stdout);

    pthread_mutex_unlock(&smartgreen->data_mutex);
   
    ft_strcpy(cool_fan_mode, smartgreen->zone_params[zone_idx].cool_fan_mode, sizeof(smartgreen->zone_params->cool_fan_mode));
    if (on && smartgreen->modbus_ctx)
    {
        // Modo FAN — solo ventilador sin agua ni prewet
        if (strcmp(cool_fan_mode, "FAN") == 0)
        {
            for (int i = 0; i < smartgreen->num_coolers; i++)
                if (smartgreen->coolers[i].zone_id == id)
                {
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, 16); // fan=1, pump=OFF, drain=0
                    ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 50, REG50_SOLENOID_OFF); // solenoid=OFF
                }
        }
        else
        {
            prewet_sel = db_read_config(smartgreen, "prewet_selector");
            unit_id = -1;
            for (int i = 0; i < smartgreen->num_coolers; i++)
                if (smartgreen->coolers[i].zone_id == id)
                    { unit_id = smartgreen->coolers[i].unit_id; break; }
            
            need_prewet = cooler_need_prewet(smartgreen, zone_idx, unit_id);
            printf("DEBUG onoff: on=%d prewet_sel=%d need_prewet=%d last_prewet=%ld\n", on, prewet_sel, need_prewet, (long)smartgreen->zone_params[zone_idx].last_prewet); fflush(stdout);
    
            pthread_mutex_lock(&smartgreen->data_mutex);
            already_running = strcmp(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes") == 0;
            if (!already_running && (prewet_sel && need_prewet))
                ft_strcpy(smartgreen->zone_params[zone_idx].prewet_in_progress, "yes",
                        sizeof(smartgreen->zone_params->prewet_in_progress));
            pthread_mutex_unlock(&smartgreen->data_mutex);
    
            if (!already_running)
            {
                args = malloc(sizeof(t_prewet_args));
                if (args)
                {
                    args->smartgreen = smartgreen;
                    args->zone_id = id;
                    args->need_prewet = (prewet_sel && need_prewet);
                    pthread_t tid;
                    pthread_create(&tid, NULL, prewet_thread, args);
                    pthread_detach(tid);
                }
            }
        }
    }
    if (!on)
    {
        pthread_mutex_lock(&smartgreen->data_mutex);
        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == id)
            {
                smartgreen->coolers[i].last_off = get_timestamp();
                snprintf(sql_off, sizeof(sql_off), "UPDATE cooler_state SET last_off=%ld WHERE unit_id=%d", (long)smartgreen->coolers[i].last_off, smartgreen->coolers[i].unit_id);
                sqlite3_exec(smartgreen->db, sql_off, NULL, NULL, NULL);
                //db_save_cooler(smartgreen, &smartgreen->coolers[i]);
            }
        pthread_mutex_unlock(&smartgreen->data_mutex);
    }

    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result     api_post_zone_fanspeed(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size)
{
    int zone_idx;
    int speed = 0;
    int r50 = 0;
    int r52 = 0;
    int pump = 0;

    if (!body || body_size == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if (sscanf(body, "{\"speed\":%d}", &speed) != 1)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON SPEED\"}"));
    if (speed < 0 || speed > 10)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"speed must be between 0 and 10\"}"));
    zone_idx = ft_find_zone(smartgreen, id);
    if (zone_idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Zone not found\"}"));

    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->zone_params[zone_idx].fan_speed_cmd = speed;

    // En modo FAN no encender bomba
    pump = (strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "FAN") == 0 || strcmp(smartgreen->zone_params[zone_idx].cool_fan_mode, "IMD") == 0) ? 0 : 1;
    smartgreen->zone_params[zone_idx].pump_on = pump;

    db_update_zone_params(smartgreen, &smartgreen->zone_params[zone_idx]);
    pthread_mutex_unlock(&smartgreen->data_mutex);

    if (smartgreen->modbus_ctx)
    {
        for (int i = 0; i < smartgreen->num_coolers; i++)
        {
            if (smartgreen->coolers[i].zone_id == id)
            {
                r50 = calculate_register_50(0, pump, speed);
                r52 = calculate_register_52(speed);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 49, r50);
                ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_WRITE, smartgreen->coolers[i].unit_id, 52, r52);
            }
        }
    }
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}