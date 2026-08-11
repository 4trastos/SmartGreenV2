#include "../incl/smartgreen.h"

void    ft_sha256(const char *input, char *output)
{
    EVP_MD_CTX      *ctx = EVP_MD_CTX_new();
    unsigned char   hash[EVP_MAX_MD_SIZE];
    unsigned int    hash_len = 0;

    EVP_DigestInit_ex(ctx, EVP_sha256(), NULL);
    EVP_DigestUpdate(ctx, input, strlen(input));
    EVP_DigestFinal_ex(ctx, hash, &hash_len);
    EVP_MD_CTX_free(ctx);

    for (unsigned int i = 0; i < hash_len; i++)
        snprintf(output + (i * 2), 3, "%02x", hash[i]);
    output[64] = '\0';
}

void    ft_init_users(t_smartgreen *smartgreen)
{
    sqlite3_stmt    *stmt = NULL;
    const char      *sql = SQL_INIT_USER;
    int             rc;
    char            hashed[65];

    ft_sha256("admin1234", hashed);
    rc = sqlite3_prepare_v2(smartgreen->db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK)
    {
        fprintf(stderr, "Users database prepare error: ( %s )\n", sqlite3_errmsg(smartgreen->db));
        return;
    }
    
    sqlite3_bind_text(stmt, 2, "admin", -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, hashed, -1 ,SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, "admin", -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 5, 1);
    
    rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE)
        printf("Users initialized correctly\n");
    else
        fprintf(stderr, "Error users inserting ( %s )\n", sqlite3_errmsg(smartgreen->db));
}