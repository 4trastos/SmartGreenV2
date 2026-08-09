#include "../incl/smartgreen.h"

// Callback para escribir archivo descargado
size_t  ft_write_callback(void *ptr, size_t size, size_t nmemb, FILE *stream)
{
    return (fwrite(ptr, size, nmemb, stream));
}

// Verificar si hay actualizaciones
int ft_check_for_updates(t_update_info *update)
{
    struct json_object  *json;
    struct json_object  *version_obj;
    struct json_object  *url_obj;
    struct json_object  *checksum_obj;
    struct json_object  *date_obj;
    CURL                *curl;
    CURLcode            res;
    char                url[256];
    char                response[4096] = {0};
    const char          *remote_version_str = NULL;
    int                 r_major = 0, r_minor = 0, r_patch = 0;
    int                 local_ver = 0, remote_ver = 0;
    
    snprintf(url, sizeof(url), "%s/%s", UPDATE_SERVER, "manifest.json");

    // Obtener manifest
    curl = curl_easy_init();
    if (!curl)
        return (-1);
    
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, ft_write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, response);

    res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    if (res != CURLE_OK)
        return (-1);

    json = json_tokener_parse(response);
    if (!json)
        return (-1);
    
    // Obtener versión remota como string del JSON
    json_object_object_get_ex(json, "version", &version_obj);
    remote_version_str = json_object_get_string(version_obj);
    strncpy(update->version, remote_version_str, sizeof(update->version) - 1);
    update->version[sizeof(update->version) - 1] = '\0';

    sscanf(remote_version_str, "%d.%d.%d", &r_major, &r_minor, &r_patch);
    local_ver = (SG_VERSION_MAJOR * 1000) + (SG_VERSION_MINOR * 100) + SG_VERSION_PATCH;
    remote_ver = (r_major * 1000) + (r_minor * 100) + r_patch;

    if (remote_ver <= local_ver)
    {
        json_object_put(json);
        return (0);         // Sin actualización
    }

    json_object_object_get_ex(json, "download_url", &url_obj);
    strncpy(update->url, json_object_get_string(url_obj), sizeof(update->url) - 1);
    update->url[sizeof(update->url) - 1] = '\0';

    json_object_object_get_ex(json, "checksum", &checksum_obj);
    strncpy(update->cheksum, json_object_get_string(checksum_obj), sizeof(update->cheksum) - 1);
    update->cheksum[sizeof(update->cheksum) - 1] = '\0';

    json_object_object_get_ex(json, "release_date", &date_obj);
    strncpy(update->release_date, json_object_get_string(date_obj), sizeof(update->release_date) - 1);
    update->release_date[sizeof(update->release_date) - 1] = '\0';

    json_object_put(json);
    return (1);
}

// Descargar update
int ft_download_update(char *url, char *dest)
{
    CURL        *curl;
    CURLcode    res;
    FILE        *fd;

    fd = fopen(dest, "wb");
    if (!fd)
        return(-1);

    curl = curl_easy_init();
    if (!curl)
    {
        fclose(fd);
        return (-1);
    }

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, ft_write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, fd);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 60L);

    res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    fclose(fd);

    return (res == CURLE_OK) ? 0 : -1;
}

// Verificar checksum
int ft_verify_checksum(char *file, char *expected)
{
    EVP_MD_CTX     *mdctx = NULL;
    unsigned char   hash[EVP_MAX_MD_SIZE];
    unsigned char   buffer[4096];
    char            checksum_str[65];
    size_t          bytes;
    unsigned int    hash_len = 0;
    FILE            *fp;

    fp = fopen(file, "rb");
    if (!fp)
        return (-1);

    mdctx = EVP_MD_CTX_new();
    if (!mdctx)
    {
        fclose(fp);
        return (-1);
    }

    if (EVP_DigestInit_ex(mdctx, EVP_sha256(), NULL) != 1)
    {
        EVP_MD_CTX_free(mdctx);
        fclose(fp);
        return (-1);
    }

    while ((bytes = fread(buffer, 1, sizeof(buffer), fp)) > 0)
    {
        if (EVP_DigestUpdate(mdctx, buffer, bytes) != 1) {
            EVP_MD_CTX_free(mdctx);
            fclose(fp);
            return (-1);
        }
    }

    if (EVP_DigestFinal_ex(mdctx, hash, &hash_len) != 1)
    {
        EVP_MD_CTX_free(mdctx);
        fclose(fp);
        return (-1);
    }

    EVP_MD_CTX_free(mdctx);
    fclose(fp);

    // Convertir a string hexadecimal
    for (unsigned int i = 0; i < hash_len; i++)
        sprintf(checksum_str + (i * 2), "%02x", hash[i]);
    checksum_str[64] = '\0';

    return (strcasecmp(checksum_str, expected) == 0) ? 0 : -1;
}

// Aplicar actualización
int ft_apply_update(char *new_binary)
{
    char    backup_path[256];
    char    current_path[256];
    char    cmd[512];
    
    snprintf(current_path, sizeof(current_path), "/opt/smartgreen/smartgreen");
    snprintf(backup_path, sizeof(backup_path), "/opt/smartgreen/smartgreen.old");
    
    // 1. Backup del actual
    if (rename(current_path, backup_path) != 0) {
        return (-1);
    }
    
    // 2. Mover nuevo binario
    if (rename(new_binary, current_path) != 0) {
        // Restaurar backup si falla
        rename(backup_path, current_path);
        return (-1);
    }
    
    // 3. Asegurar permisos
    chmod(current_path, 0755);
    
    // 4. Eliminar símbolos (por seguridad)
    snprintf(cmd, sizeof(cmd), "strip --strip-all %s 2>/dev/null", current_path);
    system(cmd);
    
    return (0);
}

void    *ft_update_checker_thread(void *arg)
{
    t_smartgreen    *smartgreen = (t_smartgreen *)arg;
    t_update_info   update;
    char            *temp_path = NULL;
    int             fd;
    int             ret;

    while (1)
    {
        sleep(UPDATE_CHECK_INTERVAL);

        ret = ft_check_for_updates(&update);
        if (ret == -1)
        {
            printf("[UPDATE] Error checking for updates\n");
            continue;
        }
        else if (ret == 0)
        {
            printf("[UPDATE] No updates available\n");
            continue;
        }

        printf("[UPDATE] New version %s available\n", update.version);
        printf("[UPDATE] Release date: %s\n", update.release_date);

        // Descargar
        temp_path = "/tmp/smartgreen_new.XXXXXX";
        fd = mkstemp(temp_path);
        if (fd < 0)
        {
            printf("[UPDATE] ❌ Cannot create temp file\n");
            continue;
        }
        close(fd);

        if (ft_download_update(update.url, temp_path) == 0)
        {
            if (ft_verify_checksum(temp_path, update.cheksum) == 0)
            {
                printf("[UPDATE] Checksum verified, applying...\n");
                if (ft_apply_update(temp_path) == 0)
                {
                    printf("[UPDATE] ✅ Update applied successfully\n");
                    printf("[UPDATE] Restarting service...\n");
                    update.requires_restart = 1;
                    g_update_pending = 1;
                    ft_ws_stop(smartgreen);
                    ft_modbus_queue_stop(&smartgreen->modbus_queue);
                    unlink(temp_path);
                    break;
                }
                else
                {
                    printf("[UPDATE] ❌ Apply update failed\n");
                    unlink(temp_path);
                }
            }
            else
                printf("[UPDATE] ❌ Checksum verification failed\n");
        }
        else
        {
            printf("[UPDATE] ❌ Download failed\n");
            unlink(temp_path);
            continue;
        }
        unlink(temp_path);
    }
    return (NULL);
}
