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

/*  PATHS   */
# define DB_PATH                "/var/lib/smartgreen/smartgreen.db"
# define SQL_INSERT_COOLER      "INSERT OR REPLACE INTO cooler_state (unit_id, zone_id, is_extractor, error_count, drain_valve_open, cool_mode_on, fan_on, fault_present, inlet_valve_open, actual_fan_speed, most_recent_fault, " \
                                "water_present, salinity_ppm, salinity_us, last_read, last_mod) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
# define SQL_INSERT_SENSOR      "INSERT OR REPLACE INTO sensor_state (sensor_id, zone_id, type, name, temperature, humidity, flags, valid, offset_val, last_read, last_mod) " \
                                "VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_CONFIG        "INSERT OR REPLACE INTO config (key, value) VALUES(?, ?)"
# define SQL_SAVE_HISTOTY       "INSERT INTO history (id, timestamp, unit_id, zone_id, device_type, temp_raw, hum_raw, fan_speed_cmd, target_temp, humidity_min, humidity_max, pump_on, cool_fan_mode, water_present, salinity_ppm, " \
                                "salinity_us, drain_open, solenoid_on, on_off, fault_code) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_ZONE_PARAMS   "INSERT OR REPLACE INTO zone_params (zone_id, fan_speed_cmd, target_temp, humidity_min, humidity_max, pump_on, cool_fan_mode, drain_valve, solenoid, on_off, inmediate_drain, prewet_in_progress, last_prewet, last_drain, last_pump_time) "\
                                " VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
# define SQL_SAVE_ERROR         "INSERT INTO error_log (id, unit_id, timestamp, level, message) VALUES(?, ?, ?, ?, ?)"
# define SQL_SAVE_FAULT_LOG     "INSERT INTO fault_log (id, unit_id, fault_code, fault_present, time_created, time_cleared) VALUES(?, ?, ?, ?, ?, ?)"

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

/*  LIMITS  */
# define SENSOR_NO_SIGNAL       -200
# define MAX_SENSOR_TEMP        500
# define MAX_SENSOR_HUM         100
# define MAX_COOLER_ERRORS      10
# define SALINITY_TRIGGER       4275

/*  TIMINGS (Seconds)   */
# define SCHEDULER_READ_MIN     900
# define SCHEDULER_WRITE_MIN    10
# define SCHEDULER_WRITE_MAX    30
# define HISTORY_INTERVAL       300
# define DB_MAX_RETRIES         10
# define DB_RETRY_US            50000


extern const char *SCHEMA_SQL;

/*  STRUCTS */

typedef enum    e_thread_status
{
    THREAD_IDLE,
    THREAD_RUNNING,
    THREAD_LOCKED,
    THREAD_STOPPED,
    THREAD_ERROR,
}   t_thread_status;

typedef struct  s_thread_ctrl
{
    pthread_t       tid;
    pthread_mutex_t mutex;
    t_thread_status status;
    int             unit_id;                    // qué cooler controla este hilo
}   t_thread_ctrl;

typedef struct s_scheduler_entry
{
    int             id;
    char            name[64];
    int             zone_id;
    int             active;
    char            action[8];
    char            hour[8];
    int             mon;
    int             tue;
    int             wed;
    int             thu;
    int             fri;
    int             sat;
    int             sun;
}t_scheduler_entry;

typedef struct s_zones
{
    int             id;
    char            *name;
}   t_zones;

typedef struct s_zone_params
{
    int             zone_id;
    int             fan_speed_cmd;
    float           target_temp;
    float           humidity_min;
    float           humidity_max;
    int             pump_on;
    char            cool_fan_mode[8];
    char            drain_valve[8];
    char            solenoid[8];
    char            on_off[4];
    char            inmediate_drain[8];
    char            prewet_in_progress[8];
    int             last_prewet;
    int             last_drain;
    int             last_pump_time;
}   t_zone_params;

typedef struct  s_cooler_state
{
    int             unit_id;                    // dirección Modbus (2-6)
    int             zone_id;
    int             is_extractor;
    int             error_count;
    int             drain_valve_open;
    int             cool_mode_on;
    int             fan_on;
    int             fault_present;
    int             inlet_valve_open;
    int             actual_fan_speed;
    int             most_recent_fault;
    int             water_present;
    double          salinity_ppm;
    double          salinity_us;
    time_t          last_read;
    time_t          last_mod;
}   t_cooler_state;

typedef struct  s_sensor_state
{
    int             sensor_id;                // dirección Modbus (177-178)
    int             zone_id;
    char            type[4];                  // "INT" o "EXT"
    char            name[64];                 
    float           temperature;
    float           humidity;
    int             flags;
    int             valid;
    int             offset_val;
    time_t          last_read;
    time_t          last_mod;
}   t_sensor_state;

typedef struct s_smartgreen
{
    int             num_coolers;
    int             num_sensors;
    int             num_zones;
    modbus_t        *modbus_ctx;
    sqlite3         *db;
    t_cooler_state  *coolers;
    t_sensor_state  *sensors;
    t_zone_params   *zone_params;
}   t_smartgreen;

/*  FUNCTIONS   */
int     main(void);
int     ft_check_database(t_smartgreen *smartgreen);
void    ft_free_structs(t_smartgreen *smartgreen);
void    ft_init_struct(t_smartgreen *smartgreen);
int     ft_init_data(t_smartgreen *smartgreen);

/*  MODBUS  */
int     ft_modbus_init(t_smartgreen *smartgreen);
int     ft_modbus_read_cooler(t_smartgreen *smartgreen, int unit_id);
int     ft_modbus_read_sensor(t_smartgreen *smartgreen, int unit_id);
int     ft_modbus_write_cooler(t_smartgreen *smartgreen, int unit_id, int addr, int value);
void    ft_modbus_close(t_smartgreen *smartgreen);

/*  REGISTERS   */
void    decode_cooler_state(uint16_t *regs, t_cooler_state *state);
void    decode_sensor_state(uint16_t *regs, t_sensor_state *state);
int     calculate_register_0(t_smartgreen *smartgreen);
int     calculate_register_50(int imd, int pump_on, int fan_speed);
int     calculate_register_51(int solenoid_on, int drain_closed);
int     calculate_register_52(int fan_speed);
double  calculate_salinity_ppm(int raw);
double  calculate_salinity_us(int raw);

/*  DATABASE    */
int     db_init(t_smartgreen *smartgreen);
int     db_read_config(t_smartgreen *smartgreen, const char *key);
int     db_save_cooler(t_smartgreen *smartgreen, t_cooler_state *cooler);
int     db_save_sensor(t_smartgreen *smartgreen, t_sensor_state *sensor);
int     db_save_zone_params(t_smartgreen *smartgreen, t_zone_params *zone_params);
int     db_save_history(t_smartgreen *smartgreen, const char *device_type, t_cooler_state *cooler, t_sensor_state *sensor);
int     db_save_error(t_smartgreen *smartgreen, const char *message);
int     db_save_fault(t_smartgreen *smartgreen, int unit_id, int fault_code);
int     db_save_config(t_smartgreen *smartgreen, const char *key, int value);

/*  CONTROL */
void    scheduler_run(t_smartgreen *smartgreen);
int     cooler_water_management(t_smartgreen *smartgreen);
int     cooler_prewet(t_smartgreen *smartgreen, int zone_id);
int     sensor_validate(t_sensor_state *sensor);

/*  UTILS   */
void    log_error(const char *message);
void    log_info(const char *message);
time_t  get_timestamp(void);

/*  AUXILIARS   */
int     ft_strlen(char *str);
char    *ft_strcpy(char *dst, char *src, int max_len);

#endif