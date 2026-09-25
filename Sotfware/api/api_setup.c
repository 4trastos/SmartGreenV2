#include "../incl/smartgreen.h"

enum MHD_Result api_post_setup_purge(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    if (smartgreen->num_coolers == 0)
        return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
    
    t_prewet_args *args = malloc(sizeof(t_prewet_args));
    if (args)
    {
        args->smartgreen  = smartgreen;
        args->zone_id     = smartgreen->coolers[0].zone_id;
        args->need_prewet = 1;
        args->from_setup  = 1;  // ← restaura AUTO no IMD
        pthread_t tid;
        pthread_create(&tid, NULL, prewet_test_thread, args);
        pthread_detach(tid);
    }
    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

enum MHD_Result api_get_setup_status(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    char    buf[64];
    
    snprintf(buf, sizeof(buf), "{\"setup_required\":%s}", smartgreen->setup_mode ? "true" : "false");
    return api_send_response(connection, MHD_HTTP_OK, buf);
}

enum MHD_Result api_post_setup_language(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    (void)body_size;
    char lang[8] = {0};

    if (!body || sscanf(body, "{\"lang\":\"%7[^\"]\"}", lang) != 1)
        return api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid JSON\"}");
    db_save_config(smartgreen, "language", 0);                                      // guarda como string — necesita db_save_config_str
    db_update_config(smartgreen, "language", strcmp(lang, "en") == 0 ? 1 : 0);
    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

// enum MHD_Result api_post_setup_zones(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
// {
//     (void)body_size;
//     int num_zones = 0;

//     if (!body || sscanf(body, "{\"num_zones\":%d", &num_zones) != 1 || num_zones < 1 || num_zones > 8)
//         return api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid\"}");
//     db_update_config(smartgreen, "num_zones", num_zones);
//     smartgreen->num_zones = num_zones;
//     return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
// }

enum MHD_Result api_post_setup_zones(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    (void)body_size;
    int     num_zones = 0;
    char    zone_name[64] = {0};
    char    sql[256];

    if (!body || sscanf(body, "{\"num_zones\":%d", &num_zones) != 1 || num_zones < 1 || num_zones > 8)
        return api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid\"}");

    db_update_config(smartgreen, "num_zones", num_zones);
    smartgreen->num_zones = num_zones;

    // Leer nombres de zonas y guardar en BD
    for (int i = 0; i < num_zones; i++)
    {
        const char *ptr = body;
        for (int j = 0; j <= i; j++)
        {
            ptr = strstr(ptr, "\"name\":\"");
            if (!ptr) break;
            if (j < i) ptr++;
        }
        if (ptr)
        {
            ptr += 8; // saltar "name":"
            char *end = strchr(ptr, '"');
            if (end)
            {
                int len = end - ptr;
                if (len > 63) len = 63;
                strncpy(zone_name, ptr, len);
                zone_name[len] = '\0';
                snprintf(sql, sizeof(sql),
                    "UPDATE zones SET name='%s' WHERE id=%d;", zone_name, i + 1);
                sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
                printf("[SETUP] Zona %d nombre: %s\n", i + 1, zone_name); fflush(stdout);
            }
        }
    }

    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

enum MHD_Result api_post_setup_coolers(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    (void)body_size;
    
    int zone_id = 0, num_coolers = 0;

    if (!body || sscanf(body, "{\"zone_id\":%d,\"num_coolers\":%d}", &zone_id, &num_coolers) != 2)
        return api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid\"}");
    db_update_config(smartgreen, "num_coolers", num_coolers);
    smartgreen->num_coolers = num_coolers;
    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

enum MHD_Result api_post_setup_scan(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    char        buf[4096] = {0};
    int         offset = 0;

    offset += snprintf(buf + offset, sizeof(buf) - offset, "{\"coolers\":[");
    int first = 1;
    
    // Usar timeout corto temporalmente
    modbus_set_response_timeout(smartgreen->modbus_ctx, 0, 200000);

    for (int addr = 1; addr <= 20; addr++)
    {
        uint16_t reg;
        pthread_mutex_lock(&smartgreen->data_mutex);
        int found = 0;
        if (modbus_set_slave(smartgreen->modbus_ctx, addr) != -1)
            if (modbus_read_registers(smartgreen->modbus_ctx, 0, 1, &reg) != -1)
                found = 1;
        pthread_mutex_unlock(&smartgreen->data_mutex);

        usleep(15000);
        if (found)
        {
            offset += snprintf(buf + offset, sizeof(buf) - offset, "%s{\"unit_id\":%d}", first ? "" : ",", addr);
            first = 0;
        }
    }
    offset += snprintf(buf + offset, sizeof(buf) - offset, "],\"sensors\":[");
    first = 1;
    for (int addr = 160; addr <= 180; addr++)
    {
        uint16_t reg;
        pthread_mutex_lock(&smartgreen->data_mutex);
        int found = 0;
        if (modbus_set_slave(smartgreen->modbus_ctx, addr) != -1)
            if (modbus_read_registers(smartgreen->modbus_ctx, MODBUS_SENSOR_ADDR, 1, &reg) != -1)
                found = 1;
        pthread_mutex_unlock(&smartgreen->data_mutex);
        if (found)
        {
            offset += snprintf(buf + offset, sizeof(buf) - offset, "%s{\"unit_id\":%d}", first ? "" : ",", addr);
            first = 0;
        }
    }
    modbus_set_response_timeout(smartgreen->modbus_ctx, 1, 0);
    offset += snprintf(buf + offset, sizeof(buf) - offset, "]}");
    return api_send_response(connection, MHD_HTTP_OK, buf);
}

enum MHD_Result api_post_setup_confirm(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    // Marcar instalación completa
    db_save_config(smartgreen, "new_installation", 1);
    smartgreen->setup_mode = 0;
    // Reinicializar datos con la nueva configuración
    ft_init_data(smartgreen);
    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

enum MHD_Result api_post_setup_sensors(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t len)
{
    (void)len;

    printf("[SETUP SENSORS] Recibidos datos: %s\n", body);
    fflush(stdout);

    pthread_mutex_lock(&smartgreen->data_mutex);

    int sensor_count = 0;
    const char *ptr = body;
    while ((ptr = strstr(ptr, "unit_id")) != NULL)
    {
        sensor_count++;
        ptr += 7; // avanzar despues de "unit_id"
    }

    smartgreen->num_sensors = sensor_count;
    db_save_config(smartgreen, "num_sensors", sensor_count);

    ptr = body;
    for (int i = 0; i < sensor_count; i++)
    {
        ptr = strstr(ptr, "unit_id");
        if (!ptr) break;

        int unit_id = 0;
        char role_buf[8] = {0};

        sscanf(ptr, "unit_id\":%d", &unit_id);

        // Buscamos el rol asociado dentro del mismo objeto JSON del sensor
        const char *role_ptr = strstr(ptr, "role");
        if (role_ptr)
        {
            sscanf(role_ptr, "role\":\"%7[^\"]", role_buf);
        }

        printf("[SETUP SENSORS] Configurando Sensor unit_id=%d con rol=%s\n", unit_id, role_buf[0] ? role_buf : "INT");

        ptr += 7; // avanzar para buscar el siguiente
    }

    pthread_mutex_unlock(&smartgreen->data_mutex);

    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}