#include "../incl/smartgreen.h"

enum MHD_Result api_post_setup_purge(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    smartgreen->setup_water_fail = 0;
    for (int z = 0; z < smartgreen->num_zones; z++)
    {
        int zid = smartgreen->zone_params[z].zone_id;
        int has = 0;

        for (int i = 0; i < smartgreen->num_coolers; i++)
            if (smartgreen->coolers[i].zone_id == zid)
                has = 1;
        if (!has)
            continue;
        t_prewet_args *args = malloc(sizeof(t_prewet_args));
        if (args)
        {
            args->smartgreen  = smartgreen;
            args->zone_id     = zid;
            args->need_prewet = 1;
            args->from_setup  = 1;
            pthread_t tid;
            pthread_create(&tid, NULL, prewet_test_thread, args);
            pthread_detach(tid);
            printf("[SETUP] Purga lanzada en la zona %d\n", zid); fflush(stdout);
        }
    }
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

// enum MHD_Result api_post_setup_purge(t_smartgreen *smartgreen, struct MHD_Connection *connection)
// {
//     smartgreen->setup_water_fail = 0;
//     if (smartgreen->num_coolers == 0)
//         return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
    
//     t_prewet_args *args = malloc(sizeof(t_prewet_args));
//     if (args)
//     {
//         args->smartgreen  = smartgreen;
//         args->zone_id     = smartgreen->coolers[0].zone_id;
//         args->need_prewet = 1;
//         args->from_setup  = 1;  // ← restaura AUTO no IMD
//         pthread_t tid;
//         pthread_create(&tid, NULL, prewet_test_thread, args);
//         pthread_detach(tid);
//     }
//     return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
// }

enum MHD_Result api_get_setup_status(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    char    buf[64];
    
    // snprintf(buf, sizeof(buf), "{\"setup_required\":%s}", smartgreen->setup_mode ? "true" : "false");
    snprintf(buf, sizeof(buf), "{\"setup_required\":%s,\"water_fail\":%d}", smartgreen->setup_mode ? "true" : "false", smartgreen->setup_water_fail);
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

// Guarda los coolers del setup. Cada cooler N tiene que estar ya en la dirección MODBUS_FIRST_COOLER + N - 1
// (el setup asigna las direcciones antes de llamar aquí): así lo configurado coincide con lo que hay en el bus
// enum MHD_Result api_post_setup_coolers(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
// {
//     (void)body_size;
//     int         zone_id = 0;
//     int         num_coolers = 0;
//     int         idx = 0;
//     const char  *ptr;
//     char        err[160];

//     if (!body || sscanf(body, "{\"zone_id\":%d,\"num_coolers\":%d", &zone_id, &num_coolers) != 2 || num_coolers < 1)
//         return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid\"}"));

//     // 1. Comprobar ANTES de guardar nada: cada cooler en su dirección
//     ptr = body;
//     while ((ptr = strstr(ptr, "\"unit_id\":")) != NULL && idx < num_coolers)
//     {
//         int unit_id = 0;
//         sscanf(ptr + 10, "%d", &unit_id);
//         if (unit_id != MODBUS_FIRST_COOLER + idx)
//         {
//             snprintf(err, sizeof(err), "{\"error\":\"El cooler %d debe estar en la direccion %d (esta en la %d). Configure la placa\"}",
//                 idx + 1, MODBUS_FIRST_COOLER + idx, unit_id);
//             return (api_send_response(connection, MHD_HTTP_CONFLICT, err));
//         }
//         idx++;
//         ptr++;
//     }
//     if (idx != num_coolers)
//         return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Faltan coolers por configurar\"}"));

//     // 2. Todo correcto: guardar
//     db_update_config(smartgreen, "num_coolers", num_coolers);
//     smartgreen->num_coolers = num_coolers;
//     for (int i = 0; i < num_coolers; i++)
//     {
//         char sql[128];
//         int  unit_id = MODBUS_FIRST_COOLER + i;

//         snprintf(sql, sizeof(sql), "INSERT OR IGNORE INTO cooler_state (unit_id, zone_id) VALUES(%d, %d);", unit_id, zone_id);
//         sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
//         if (smartgreen->coolers)
//         {
//             smartgreen->coolers[i].unit_id = unit_id;
//             smartgreen->coolers[i].zone_id = zone_id;
//         }
//     }
//     return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
// }

// Guarda los evaporativos del setup, cada uno con su zona.
// Cada evaporativo N tiene que estar ya en su dirección (MODBUS_FIRST_COOLER + N - 1)
enum MHD_Result api_post_setup_coolers(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t body_size)
{
    (void)body_size;
    int         zone_def = 0;
    int         num_coolers = 0;
    int         idx = 0;
    int         zones[64];
    const char  *ptr;
    char        err[160];

    if (!body || sscanf(body, "{\"zone_id\":%d,\"num_coolers\":%d", &zone_def, &num_coolers) != 2
        || num_coolers < 1 || num_coolers > 64)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Invalid\"}"));

    // 1. Comprobar ANTES de guardar: dirección y zona de cada evaporativo
    ptr = body;
    while ((ptr = strstr(ptr, "\"unit_id\":")) != NULL && idx < num_coolers)
    {
        const char  *end = strchr(ptr, '}');
        const char  *p = strstr(ptr, "\"zone_id\":");
        int         unit_id = 0;
        int         zid = zone_def;

        sscanf(ptr + 10, "%d", &unit_id);
        if (p && (!end || p < end))
            sscanf(p + 10, "%d", &zid);
        if (unit_id != MODBUS_FIRST_COOLER + idx)
        {
            snprintf(err, sizeof(err), "{\"error\":\"El evaporativo %d debe estar en la direccion %d (esta en la %d). Configure la placa\"}",
                idx + 1, MODBUS_FIRST_COOLER + idx, unit_id);
            return (api_send_response(connection, MHD_HTTP_CONFLICT, err));
        }
        if (zid < 1 || zid > smartgreen->num_zones)
        {
            snprintf(err, sizeof(err), "{\"error\":\"El evaporativo %d tiene una zona no valida (%d)\"}", idx + 1, zid);
            return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, err));
        }
        zones[idx] = zid;
        idx++;
        ptr++;
    }
    if (idx != num_coolers)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Faltan evaporativos por configurar\"}"));

    // 2. Ajustar el array de memoria al número de evaporativos (puede crecer)
    pthread_mutex_lock(&smartgreen->data_mutex);
    if (num_coolers != smartgreen->num_coolers)
    {
        t_cooler_state *nc = realloc(smartgreen->coolers, sizeof(t_cooler_state) * num_coolers);
        if (!nc)
        {
            pthread_mutex_unlock(&smartgreen->data_mutex);
            return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"Sin memoria\"}"));
        }
        if (num_coolers > smartgreen->num_coolers)
            memset(nc + smartgreen->num_coolers, 0, sizeof(t_cooler_state) * (num_coolers - smartgreen->num_coolers));
        smartgreen->coolers = nc;
        smartgreen->num_coolers = num_coolers;
    }
    // 3. Guardar
    for (int i = 0; i < num_coolers; i++)
    {
        char sql[160];
        int  unit_id = MODBUS_FIRST_COOLER + i;

        snprintf(sql, sizeof(sql), "INSERT OR IGNORE INTO cooler_state (unit_id, zone_id) VALUES(%d, %d); UPDATE cooler_state SET zone_id=%d WHERE unit_id=%d;",
            unit_id, zones[i], zones[i], unit_id);
        sqlite3_exec(smartgreen->db, sql, NULL, NULL, NULL);
        smartgreen->coolers[i].unit_id = unit_id;
        smartgreen->coolers[i].zone_id = zones[i];
        printf("[SETUP COOLERS] Evaporativo %d (direccion %d) -> zona %d\n", i + 1, unit_id, zones[i]); fflush(stdout);
    }
    pthread_mutex_unlock(&smartgreen->data_mutex);
    db_update_config(smartgreen, "num_coolers", num_coolers);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

enum MHD_Result api_post_setup_scan(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    char        buf[4096] = {0};
    int         offset = 0;
    int         first = 1;
    uint16_t    reg;

    // Coolers (direcciones 1-20)
    offset += snprintf(buf + offset, sizeof(buf) - offset, "{\"coolers\":[");
    for (int addr = 1; addr <= 20; addr++)
    {
        // if (ft_modbus_probe(smartgreen, addr, 0, 1, &reg) == 0)
        if (ft_probe_retry(smartgreen, addr, 0, 1, &reg, 2) == 0)
        {
            offset += snprintf(buf + offset, sizeof(buf) - offset, "%s{\"unit_id\":%d}", first ? "" : ",", addr);
            first = 0;
        }
    }

    // Sensores (direcciones 160-180)
    offset += snprintf(buf + offset, sizeof(buf) - offset, "],\"sensors\":[");
    first = 1;
    for (int addr = 160; addr <= 180; addr++)
    {
        //if (ft_modbus_probe(smartgreen, addr, MODBUS_SENSOR_ADDR, 1, &reg) == 0)
        if (ft_probe_retry(smartgreen, addr, MODBUS_SENSOR_ADDR, 1, &reg, 2) == 0)
        {
            offset += snprintf(buf + offset, sizeof(buf) - offset, "%s{\"unit_id\":%d}", first ? "" : ",", addr);
            first = 0;
        }
    }
    offset += snprintf(buf + offset, sizeof(buf) - offset, "]}");
    return (api_send_response(connection, MHD_HTTP_OK, buf));
}

enum MHD_Result api_post_setup_confirm(t_smartgreen *smartgreen, struct MHD_Connection *connection)
{
    // Marcar instalación completa
    db_save_config(smartgreen, "new_installation", 1);
    smartgreen->setup_mode = 0;
    // Reinicializar datos con la nueva configuración
    ft_init_data(smartgreen);
    db_load_cooler_faults(smartgreen);
    db_load_zone_params(smartgreen);
    for (int i = 0; i < smartgreen->num_coolers; i++)
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_READ_COOLER, smartgreen->coolers[i].unit_id, 0, 0);
    for (int i = 0; i < smartgreen->num_sensors; i++)
        ft_modbus_enqueue(&smartgreen->modbus_queue, CMD_READ_SENSOR, smartgreen->sensors[i].sensor_id, 0, 0);
    return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
}

// enum MHD_Result api_post_setup_sensors(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t len)
// {
//     (void)len;

//     printf("[SETUP SENSORS] Recibidos datos: %s\n", body);
//     fflush(stdout);

//     pthread_mutex_lock(&smartgreen->data_mutex);

//     int sensor_count = 0;
//     const char *ptr = body;
//     while ((ptr = strstr(ptr, "unit_id")) != NULL)
//     {
//         sensor_count++;
//         ptr += 7; // avanzar despues de "unit_id"
//     }

//     smartgreen->num_sensors = sensor_count;
//     db_update_config(smartgreen, "num_sensors", sensor_count);

//     ptr = body;
//     for (int i = 0; i < sensor_count; i++)
//     {
//         ptr = strstr(ptr, "unit_id");
//         if (!ptr) break;

//         int unit_id = 0;
//         char role_buf[8] = {0};

//         sscanf(ptr, "unit_id\":%d", &unit_id);

//         // Buscamos el rol asociado dentro del mismo objeto JSON del sensor
//         const char *role_ptr = strstr(ptr, "role");
//         if (role_ptr)
//         {
//             sscanf(role_ptr, "role\":\"%7[^\"]", role_buf);
//         }

//         printf("[SETUP SENSORS] Configurando Sensor unit_id=%d con rol=%s\n", unit_id, role_buf[0] ? role_buf : "INT");

//         ptr += 7; // avanzar para buscar el siguiente
//     }

//     pthread_mutex_unlock(&smartgreen->data_mutex);

//     return api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}");
// }

// Guarda los sensores del setup: {"sensors":[{"unit_id":175,"role":"INT","zone_id":1},{"unit_id":177,"role":"EXT"}]}
// Reglas: un INT por zona (obligatorio) y como máximo un EXT (común a toda la instalación)
enum MHD_Result api_post_setup_sensors(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t len)
{
    (void)len;
    t_sensor_state  *ns;
    const char      *ptr;
    int             count = 0;
    int             n = 0;
    int             ext = 0;
    int             int_zone[65] = {0};
    char            err[160];

    printf("[SETUP SENSORS] Recibidos datos: %s\n", body ? body : "(null)"); fflush(stdout);
    if (!body)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    for (ptr = body; (ptr = strstr(ptr, "\"unit_id\"")) != NULL; ptr++)
        count++;
    if (count == 0)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No hay sensores\"}"));
    ns = calloc(count, sizeof(t_sensor_state));
    if (!ns)
        return (api_send_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, "{\"error\":\"Sin memoria\"}"));

    // 1. Leer y comprobar
    ptr = body;
    while (n < count && (ptr = strstr(ptr, "\"unit_id\"")) != NULL)
    {
        const char      *end = strchr(ptr, '}');
        const char      *p;
        char            role[8] = "INT";
        int             zid = 1;
        t_sensor_state  *s = &ns[n];

        sscanf(ptr, "\"unit_id\":%d", &s->sensor_id);
        if ((p = strstr(ptr, "\"role\"")) && (!end || p < end))
            sscanf(p, "\"role\":\"%7[^\"]", role);
        if ((p = strstr(ptr, "\"zone_id\"")) && (!end || p < end))
            sscanf(p, "\"zone_id\":%d", &zid);

        if (strcmp(role, "EXT") == 0)
        {
            ft_strcpy(s->type, "EXT", sizeof(s->type));
            ft_strcpy(s->name, "Exterior", sizeof(s->name));
            s->zone_id = 1;                 // común a toda la instalación (zona 1 por compatibilidad)
            ext++;
        }
        else
        {
            if (zid < 1 || zid > smartgreen->num_zones || zid > 64)
            {
                snprintf(err, sizeof(err), "{\"error\":\"El sensor %d tiene una zona no valida\"}", s->sensor_id);
                free(ns);
                return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, err));
            }
            if (int_zone[zid])
            {
                snprintf(err, sizeof(err), "{\"error\":\"La zona %d tiene dos sensores interiores\"}", zid);
                free(ns);
                return (api_send_response(connection, MHD_HTTP_CONFLICT, err));
            }
            int_zone[zid] = 1;
            ft_strcpy(s->type, "INT", sizeof(s->type));
            ft_strcpy(s->name, "Interior", sizeof(s->name));
            s->zone_id = zid;
        }
        s->temperature = -200.0;
        s->humidity = -200.0;
        s->last_mod = get_timestamp();
        n++;
        ptr++;
    }
    if (ext > 1)
    {
        free(ns);
        return (api_send_response(connection, MHD_HTTP_CONFLICT, "{\"error\":\"Solo puede haber un sensor exterior\"}"));
    }
    for (int z = 1; z <= smartgreen->num_zones && z <= 64; z++)
        if (!int_zone[z])
        {
            snprintf(err, sizeof(err), "{\"error\":\"La zona %d no tiene sensor interior\"}", z);
            free(ns);
            return (api_send_response(connection, MHD_HTTP_CONFLICT, err));
        }

    // 2. Guardar: sustituir los sensores (memoria y BD)
    pthread_mutex_lock(&smartgreen->data_mutex);
    free(smartgreen->sensors);
    smartgreen->sensors = ns;
    smartgreen->num_sensors = n;
    pthread_mutex_unlock(&smartgreen->data_mutex);
    sqlite3_exec(smartgreen->db, "DELETE FROM sensor_state; DELETE FROM sensor_zone;", NULL, NULL, NULL);
    for (int i = 0; i < n; i++)
    {
        db_save_sensor(smartgreen, &ns[i]);
        db_save_sensor_zone(smartgreen, &ns[i]);
        printf("[SETUP SENSORS] Sensor %d: %s zona %d\n", ns[i].sensor_id, ns[i].type, ns[i].zone_id); fflush(stdout);
    }
    db_update_config(smartgreen, "num_sensors", n);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}

int  ft_wait_valid(int v)
{
    return (v == 0 || v == 60 || v == 90 || v == 120 || v == 180 || v == 300);
}

// POST /api/setup/water_waits {"unit_id":2,"prewet_wait":180,"run_wait":0}
enum MHD_Result api_post_setup_water_waits(t_smartgreen *smartgreen, struct MHD_Connection *connection, const char *body, size_t len)
{
    const char  *p;
    int         unit_id = 0, prewet = 0, run = 0, idx;

    (void)len;
    if (!body)
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"No body\"}"));
    if ((p = strstr(body, "\"unit_id\"")))
        sscanf(p, "\"unit_id\":%d", &unit_id);
    if ((p = strstr(body, "\"prewet_wait\"")))
        sscanf(p, "\"prewet_wait\":%d", &prewet);
    if ((p = strstr(body, "\"run_wait\"")))
        sscanf(p, "\"run_wait\":%d", &run);
    idx = ft_find_cooler(smartgreen, unit_id);
    if (idx == -1)
        return (api_send_response(connection, MHD_HTTP_NOT_FOUND, "{\"error\":\"Cooler not found\"}"));
    if (!ft_wait_valid(prewet) || !ft_wait_valid(run))
        return (api_send_response(connection, MHD_HTTP_BAD_REQUEST, "{\"error\":\"Valor no valido\"}"));
    pthread_mutex_lock(&smartgreen->data_mutex);
    smartgreen->coolers[idx].prewet_wait = prewet;
    smartgreen->coolers[idx].run_wait = run;
    pthread_mutex_unlock(&smartgreen->data_mutex);
    db_save_cooler_waits(smartgreen, idx);
    printf("[SETUP] Esperas de agua cooler unit_id=%d: prewet=%d run=%d (0 = global)\n", unit_id, prewet, run); fflush(stdout);
    return (api_send_response(connection, MHD_HTTP_OK, "{\"ok\":true}"));
}