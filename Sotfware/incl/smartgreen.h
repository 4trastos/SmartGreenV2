#ifndef SMARTGREEN_H
# define SMARTGREEN_H

# include <string.h>
# include <stdio.h>
# include <stdlib.h>
# include <unistd.h>
# include <ctype.h>
# include <stdint.h>
# include <math.h>
# include <pthread.h>
# include <sqlite3.h>
# include <time.h>
# include <modbus.h>
# include <signal.h>
# include <stdbool.h>
# include <limits.h>
# include <fcntl.h>
# include <errno.h>
# include <signal.h>
# include <microhttpd.h>

/*  PATHS   */
# define DB_PATH                "/var/lib/smartgreen/smartgreen.db"
# define SQL_INSERT_COOLER      "INSERT OR REPLACE INTO cooler_state (unit_id, zone_id, is_extractor, error_count, drain_valve_open, drain_valve_confirm, cool_mode_on, fan_on, fault_present, inlet_valve_open, actual_fan_speed, fan_speed_confirmed, most_recent_fault, " \
                                "water_present, pump_on, solenoid_on, salinity_ppm, salinity_us, last_read, last_mod, alarm_fault, alarm_salinity, alarm_water, alarm_comms, alarm_warranty, alarm_maint_opening, alarm_maint_closing, alarm_maint_legionella, hours_running, install_date, warranty_months) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
# define SQL_INSERT_SENSOR      "INSERT OR REPLACE INTO sensor_state (sensor_id, zone_id, type, name, temperature, humidity, flags, valid, offset_val, error_count, last_read, last_mod, alarm_signal, alarm_temp) " \
                                "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_CONFIG        "INSERT OR IGNORE INTO config (key, value) VALUES(?, ?)"
# define SQL_SAVE_HISTOTY       "INSERT INTO history (id, timestamp, unit_id, zone_id, device_type, temp_raw, hum_raw, fan_speed_cmd, target_temp, humidity_min, humidity_max, pump_on, cool_fan_mode, water_present, salinity_ppm, " \
                                "salinity_us, drain_open, solenoid_on, on_off, fault_code) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_ZONE_PARAMS   "INSERT OR REPLACE INTO zone_params (zone_id, fan_speed_cmd, target_temp, humidity_min, humidity_max, pump_on, cool_fan_mode, drain_valve, solenoid, on_off, inmediate_drain, prewet_in_progress, last_prewet, last_drain, last_pump_time) "\
                                " VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_ERROR         "INSERT INTO error_log (id, unit_id, timestamp, level, message) VALUES(?, ?, ?, ?, ?)"
# define SQL_SAVE_FAULT_LOG     "INSERT INTO fault_log (id, unit_id, fault_code, fault_present, time_created, time_cleared) VALUES(?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_ZONES         "INSERT OR REPLACE INTO zones (id, name, enabled) VALUES(?, ?, ?)"
# define SQL_SAVE_SENSOR_ZONE   "INSERT OR REPLACE INTO sensor_zone (sensor_id, zone_id) VALUES(?, ?)"
# define SQL_SAVE_SCHEDULER     "INSERT OR REPLACE INTO scheduler (id, name, zone_id, active, action, hour, mon, tue, wed, thu, fri, sat, sun) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_MAINTENANCE   "INSERT OR REPLACE INTO maintenance_log (id, unit_id, timestamp, type, description, technician, next_service) VALUES(?, ?, ?, ?, ?, ?, ?)"

/*  MODBUS CONST   */
# define MODBUS_PORT            "/dev/ttyUSB0"
# define MODBUS_BAUD            9600
# define MODBUS_PARITY          'N'
# define MODBUS_DATA_BITS       8
# define MODBUS_STOP_BITS       1
# define MODBUS_COOLER_REGS     59
# define MODBUS_SENSOR_REGS     4
# define MODBUS_SENSOR_ADDR     299
# define MODBUS_CMD_ADDR        400
# define MODBUS_CMD_VALUE       300
# define MODBUS_MAX_UNIT_ID     247    // límite protocolo Modbus RTU
# define MODBUS_MAX_COOLERS     32     // límite práctico RS485 en un bus
# define MODBUS_MIN_UNIT_ID     1      // dirección mínima válida (0=broadcast)
# define MODBUS_FIRST_SENSOR    177
# define MODBUS_FIRST_COOLER    2

/*  LIMITS  */
# define SENSOR_NO_SIGNAL       -200
# define MAX_SENSOR_TEMP        500
# define MAX_SENSOR_HUM         100
# define MAX_COOLER_ERRORS      10
# define MAX_SENSOR_ERRORS      10
# define SALINITY_TRIGGER       4275
# define MAX_SCHEDULERS         50

/*  TIMINGS (Seconds)   */
# define SCHEDULER_READ_MIN     900
# define SCHEDULER_WRITE_MIN    10
# define SCHEDULER_WRITE_MAX    30
# define SCHEDULER_SEQUENCE     15      // Mirar el horario cada 15 segundos
# define HISTORY_INTERVAL       300
# define DB_MAX_RETRIES         10
# define DB_RETRY_DELAY         500000  // microsegundos (500ms)

/*  MAINTENACE  */
# define MAINT_OPENING          "opening"      // Apertura / inicio temporada
# define MAINT_CLOSING          "closing"      // Cierre / fin temporada
# define MAINT_LEGIONELLA       "legionella"   // Tratamiento legionela
# define MAINT_REPAIR           "repair"       // Reparación puntual


extern const char *SCHEMA_SQL;

/*  STRUCTS */

typedef enum e_alarm_level
{
    ALARM_GREEN = 0,                // Todo OK
    ALARM_YELLOW = 1,               // Aviso
    ALARM_RED = 2,                  // Crítico
}   t_alarm_level;

typedef enum e_thread_status
{
    THREAD_IDLE,
    THREAD_RUNNING,
    THREAD_LOCKED,
    THREAD_STOPPED,
    THREAD_ERROR,
}   t_thread_status;

typedef struct  s_thread_ctrl
{
    pthread_t           tid;
    pthread_mutex_t     mutex;
    t_thread_status     status;
    int                 unit_id;                    // qué cooler controla este hilo
}   t_thread_ctrl;

typedef struct s_post_ctx
{
    char                body[2048];
    size_t              len;
}   t_post_ctx;

typedef struct s_maintenance_log
{
    int                 id;
    int                 unit_id;
    time_t              timestamp;
    char                type[64];
    char                description[256];
    char                technician[256];
    time_t              next_service;
}   t_maintenance_log;

typedef struct s_scheduler_entry
{
    int                 id;
    char                name[64];
    int                 zone_id;
    int                 active;
    char                action[8];
    char                hour[8];
    int                 mon;
    int                 tue;
    int                 wed;
    int                 thu;
    int                 fri;
    int                 sat;
    int                 sun;
}   t_scheduler_entry;

typedef struct s_zones
{
    int                 id;
    char                name[64];
    int                 enabled;
}   t_zones;

typedef struct s_zone_params
{
    int                 zone_id;
    int                 fan_speed_cmd;
    float               target_temp;
    float               humidity_min;
    float               humidity_max;
    int                 pump_on;
    char                cool_fan_mode[8];
    char                drain_valve[8];
    char                solenoid[8];
    char                on_off[4];
    char                inmediate_drain[8];
    char                prewet_in_progress[8];
    int                 last_prewet;
    int                 last_drain;
    int                 last_pump_time;
}   t_zone_params;

typedef struct  s_cooler_state
{
    int                 unit_id;                    // dirección Modbus (2-6)
    int                 zone_id;
    int                 is_extractor;
    int                 error_count;
    int                 drain_valve_open;           // drain valve open/close" (estado leído)
    int                 drain_valve_confirm;        // drain valve open/close" (comando/confirmación)
    int                 cool_mode_on;
    int                 fan_on;
    int                 fault_present;
    int                 inlet_valve_open;
    int                 actual_fan_speed;
    int                 fan_speed_confirmed;
    int                 most_recent_fault;
    int                 water_present;
    int                 pump_on;
    int                 solenoid_on;
    double              salinity_ppm;
    double              salinity_us;
    time_t              last_read;
    time_t              last_mod;
    int                 alarm_fault;                    // 1=alarma activa, 0=resuelta
    int                 alarm_salinity;                 // 1=alarma activa, 0=resuelta
    int                 alarm_water;                    // 1=alarma activa, 0=resuelta
    int                 alarm_comms;                    // 1=alarma activa, 0=resuelta
    int                 alarm_warranty;                 // 1=alarma activa, 0=resuelta
    int                 alarm_maint_opening;            // 1=alarma activa, 0=resuelta
    int                 alarm_maint_closing;            // 1=alarma activa, 0=resuelta
    int                 alarm_maint_legionella;         // 1=alarma activa, 0=resuelta
    int                 hours_running;                  // horas totales fan_on=1
    int                 install_date;                   // timestamp instalación
    int                 warranty_months;                // meses de garantía
}   t_cooler_state;

typedef struct  s_sensor_state
{
    int                 sensor_id;                      // dirección Modbus (177-178)
    int                 zone_id;
    char                type[4];                        // "INT" o "EXT"
    char                name[64];                 
    float               temperature;
    float               humidity;
    int                 flags;
    int                 valid;
    int                 offset_val;
    int                 error_count;
    time_t              last_read;
    time_t              last_mod;
    int                 alarm_signal;                   // 1=alarma activa, 0=resuelta
    int                 alarm_temp;                     // 1=alarma activa, 0=resuelta
}   t_sensor_state;

typedef struct s_smartgreen
{
    int                 num_coolers;
    int                 num_sensors;
    int                 num_zones;
    int                 num_schedulers;
    int                 read_interval;
    modbus_t            *modbus_ctx;
    sqlite3             *db;
    t_cooler_state      *coolers;
    t_sensor_state      *sensors;
    t_zone_params       *zone_params;
    t_zones             *zones;
    t_scheduler_entry   *scheduler;
    t_thread_ctrl       api_thread;
    pthread_mutex_t     data_mutex;
    struct MHD_Daemon   *api_daemon;
}   t_smartgreen;

extern volatile sig_atomic_t g_sigint_received;
extern volatile sig_atomic_t g_sigterm_received;
extern volatile sig_atomic_t g_alarm_modbus;

/*  FUNCTIONS   */
int     main(void);
int     ft_check_database(t_smartgreen *smartgreen);
int     ft_init_data(t_smartgreen *smartgreen);
int     ft_find_zone(t_smartgreen *smartgreen, int id);
int     ft_find_cooler(t_smartgreen *smargreen, int id);
int     ft_find_sensor(t_smartgreen *smargreen, int id);
void    ft_free_structs(t_smartgreen *smartgreen);
void    ft_free_modbus(t_smartgreen *smartgreen);
void    ft_init_struct(t_smartgreen *smartgreen);
void    ft_init_config(t_smartgreen *smartgreen);
void    sigint_handler(int sig);
void    sigterm_handler(int sig);
void    init_signal();

/*  MODBUS  */
int     ft_modbus(t_smartgreen *smartgreen);
int     ft_modbus_init(t_smartgreen *smartgreen);
int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id);
int     ft_modbus_read_sensor(t_smartgreen *smartgreen, int unit_id);
int     ft_modbus_write_cooler(t_smartgreen *smartgreen, int unit_id, int addr, int value);

/*  REGISTERS   */
void    decode_cooler_state(uint16_t *regs, t_cooler_state *state);
void    decode_sensor_state(uint16_t *regs, t_sensor_state *state);
int     decode_water_present_zone(int r_40054, int zone);
int     calculate_register_0(t_smartgreen *smartgreen);
int     calculate_register_50(int drain_valve, int pump_on, int fan_speed);
int     calculate_register_51(int solenoid_on, int drain_closed);
int     calculate_register_52(int fan_speed);
double  calculate_salinity_ppm(int raw_value);
double  calculate_salinity_us(int raw_value);

/*  DATABASE    */
int     db_init(t_smartgreen *smartgreen);
int     db_read_config(t_smartgreen *smartgreen, const char *key);
int     db_read_scheduler(t_smartgreen *smartgreen);
int     db_save_cooler(t_smartgreen *smartgreen, t_cooler_state *cooler);
int     db_save_sensor(t_smartgreen *smartgreen, t_sensor_state *sensor);
int     db_save_zone_params(t_smartgreen *smartgreen, t_zone_params *zone_params);
int     db_save_history(t_smartgreen *smartgreen, const char *device_type, t_cooler_state *cooler, t_sensor_state *sensor);
int     db_save_error(t_smartgreen *smartgreen, const char *message);
int     db_save_fault(t_smartgreen *smartgreen, int unit_id, int fault_code);
int     db_save_config(t_smartgreen *smartgreen, const char *key, int value);
int     db_save_zones(t_smartgreen *smartgreen, t_zones *zones);
int     db_save_sensor_zone(t_smartgreen *smartgreen, t_sensor_state *sensor);
int     db_save_scheduler(t_smartgreen *smartgreen, t_scheduler_entry *scheduler);
int     db_save_maintenance_log(t_smartgreen *smartgreen, t_maintenance_log *maintenance);
int     db_get_last_maintenance(t_smartgreen *smartgreen, int unit_id, const char *type, t_maintenance_log *out);

/*  CONTROL */
void    scheduler_run(t_smartgreen *smartgreen);
int     cooler_water_management(t_smartgreen *smartgreen);
int     cooler_prewet(t_smartgreen *smartgreen, int zone_id);
int     sensor_validate(t_sensor_state *sensor);
int     scheduler_is_active_today(t_scheduler_entry *scheduler, int day);
int     scheduler_is_active_now(t_scheduler_entry *scheduler, int hour, int min);
void    ft_check_alarms(t_smartgreen *smartgreen);
void    ft_maintenance_alarms(t_smartgreen *smartgreen);

/*  UTILS   */
void    log_error(const char *message);
void    log_info(const char *message);
time_t  get_timestamp(void);

/*  AUXILIARS   */
int     ft_strlen(char *str);
char    *ft_strcpy(char *dst, char *src, int max_len);

/*  API */
int                 api_start(t_smartgreen *smartgreen);
int                 api_stop(t_smartgreen *smartgreen);
enum MHD_Result     api_request_handler(void *cls, struct MHD_Connection *connection, const char *url, const char *method, const char *version, const char *upload_data, size_t *upload_data_size, void **con_cls);
enum MHD_Result     api_get_coolers(t_smartgreen *smartgreen, struct MHD_Connection *connection);
enum MHD_Result     api_get_sensors(t_smartgreen *smartgreen, struct MHD_Connection *connection);
enum MHD_Result     api_get_zones(t_smartgreen *smartgreen, struct MHD_Connection *connection);
enum MHD_Result     api_get_status(t_smartgreen *smartgreen, struct MHD_Connection *connection);
enum MHD_Result     api_get_alarms(t_smartgreen *smartgreen, struct MHD_Connection *connection);
enum MHD_Result     api_get_maintenance(t_smartgreen *smartgreen, struct MHD_Connection *connection);
enum MHD_Result     api_send_response(struct MHD_Connection *connection, int status_code, const char *response);
enum MHD_Result     api_post_zone_onoff(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size);
enum MHD_Result     api_post_zone_fanspeed(t_smartgreen *smartgreen, struct MHD_Connection *connection, int id, const char *body, size_t body_size);
enum MHD_Result     api_post_maintenance(t_smartgreen *smartgreen, struct MHD_Connection *connection, int unit_id, const char *body, size_t body_size);

#endif