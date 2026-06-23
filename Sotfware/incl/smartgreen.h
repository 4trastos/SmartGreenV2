#ifndef SMARTGREEN_H
# define SMARTGREEN_H

# include <string.h>
# include <stdio.h>
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
}   t_thread_ctrl:  

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
}   t_cooler_state;

typedef struct  s_sensor_state
{
    int             sensor_id;                // dirección Modbus (177-178)
    int             flags;
    int             valid;
    float           temperature;
    float           humidity;
    char            type[4];                // "INT" o "EXT"
    time_t          last_read;
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
}   t_smartgreen;

/*  FUNCTIONS   */
int     main(void);
int     ft_check_database(t_smartgreen *smartgreen);

/*  MODBUS  */
int     modbus_init(t_smartgreen *smartgreen);
int     modbus_read_cooler(t_smartgreen *smartgreen, int unit_id);
int     modbus_read_sensor(t_smartgreen *smartgreen, int unit_id);
int     modbus_write_cooler(t_smartgreen *smartgreen, int unit_id, int addr, int value);
void    modbus_close(t_smartgreen *smartgreen);

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
int     db_save_cooler(t_smartgreen *smartgreen, t_cooler_state *cooler);
int     db_save_sensor(t_smartgreen *smartgreen, t_sensor_state *sensor);
int     db_save_history(t_smartgreen *smartgreen);
int     db_save_error(t_smartgreen *smartgreen, const char *message);

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

#endif