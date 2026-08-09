#ifndef UPDATE_H
# define UPDATE_H

# include <curl/curl.h>
# include <json-c/json.h>
# include <openssl/sha.h>
# include <unistd.h>

# define UPDATE_SERVER          "https://smartgreen.australair.com/updates"
# define UPDATE_CHECK_INTERVAL  86400             // 24 horas
# define MANIFEST_PATH          "/opt/smartgreen/update_manifest.json"

/*  STRUCTS */
typedef struct s_update_info
{
    char    version[16];
    char    url[128];
    char    cheksum[65];     // SHA-256
    char    release_date[32];
    char    requires_restart;
}   t_update_info;

/*  FUNCTIONS   */
int         ft_check_for_updates(t_update_info *update);
int         ft_download_update(const char *url, const char *dest);
int         ft_verify_checksum(const char *file, const char *expected);
int         ft_apply_update(const char *new_binary);
size_t      ft_write_callback(void *ptr, size_t size, size_t nmemb, FILE *stream);

#endif