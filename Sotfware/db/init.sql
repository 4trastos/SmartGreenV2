-- Configuración del Sistema
CREATE TABLE IF NOT EXISTS config (
    key         TEXT    PRIMARY KEY,
    value       TEXT    NOT NULL,
    last_mod    INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Zonas
CREATE TABLE IF NOT EXISTS zones (
    id      INTEGER PRIMARY KEY,
    name    TEXT    NOT NULL,
    enabled INTEGER DEFAULT 1
);

-- Parámetros por zonas
CREATE TABLE IF NOT EXISTS zone_params (
    zone_id             INTEGER PRIMARY KEY,
    fan_speed_cmd       INTEGER DEFAULT 3,
    target_temp         REAL    DEFAULT 25.0,
    humidity_min        REAL    DEFAULT 60.0,
    humidity_max        REAL    DEFAULT 70.0,
    pump_on             INTEGER DEFAULT 0,
    cool_fan_mode       TEXT    DEFAULT 'COOL',
    drain_valve         TEXT    DEFAULT 'close',
    solenoid            TEXT    DEFAULT 'on',
    on_off              TEXT    DEFAULT 'OFF',
    inmediate_drain     TEXT    DEFAULT 'no',
    prewet_in_progress  TEXT    DEFAULT 'no',
    last_prewet         INTEGER DEFAULT '0',
    last_drain          INTEGER DEFAULT '0',
    last_pump_time      INTEGER DEFAULT '0',
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Estado actual de los coolers
CREATE TABLE IF NOT EXISTS cooler_state (
    unit_id        INTEGER PRIMARY KEY,
    zone_id         INTEGER,
    is_extractor    INTEGER DEFAULT 0,
    r_40000         INTEGER DEFAULT 0,
    r_40050         INTEGER DEFAULT 0,
    r_40051         INTEGER DEFAULT 0,
    r_40052         INTEGER DEFAULT 0,
    r_40053         INTEGER DEFAULT 0,
    r_40054         INTEGER DEFAULT 0,
    r_40055         INTEGER DEFAULT 0,
    r_40056         INTEGER DEFAULT 0,
    all_regs        TEXT,
    error_count     INTEGER DEFAULT 0,
    last_read       INTEGER DEFAULT 0,
    last_mod        INTEGER DEFAULT 0,
    present         INTEGER DEFAULT 1,
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Estado actual de los sensores
CREATE TABLE IF NOT EXISTS sensor_state (
    unit_id    INTEGER PRIMARY KEY,
    type        TEXT    DEFAULT 'INT',
    name        TEXT,
    temp_raw    INTEGER DEFAULT -200,
    hum_raw     INTEGER DEFAULT -200,
    flags       INTEGER DEFAULT 0,
    offset_val  INTEGER DEFAULT 0,
    last_read   INTEGER DEFAULT 0,
    last_mod    INTEGER DEFAULT 0
);

-- Relación sensor -> zona
CREATE TABLE IF NOT EXISTS sensor_zone (
    sensor_id   INTEGER,
    zone_id     INTEGER,
    PRIMARY KEY (sensor_id, zone_id)
);

-- Histórico de lecturas
CREATE TABLE IF NOT EXISTS history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp       INTEGER NOT NULL,
    unit_id         INTEGER PRIMARY KEY,
    zone_id         INTEGER,
    device_type     TEXT,
    temp_raw        INTEGER,
    hum_raw         INTEGER,
    fan_speed_cmd   INTEGER,
    target_temp     REAL,
    humidity_min    REAL,
    humidity_max    REAL,
    pump_on         INTEGER,
    cool_fan_mode   INTEGER,
    water_present   INTEGER,
    salinity_ppm    REAL,
    salinity_us     REAL,
    drain_open      INTEGER,
    solenoid_on     INTEGER,
    on_off          TEXT,
    fault_code      INTEGER
);

-- Log de errores
CREATE TABLE IF NOT EXISTS error_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp   INTEGER NOT NULL,
    level       TEXT    DEFAULT 'ERROR',
    message     TEXT    NOT NULL,
    unit_id     INTEGER DEFAULT 0
);

-- Log de fallos de coores
CREATE TABLE IF NOT EXISTS fault_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id         INTEGER NOT NULL,
    fault_code      INTEGER NOT NULL,
    fault_present   INTEGER DEFAULT 1,
    time_created    INTEGER NOT NULL,
    time_cleared    INTEGER DEFAULT 0

);

-- Scheduler de encendido/apagado
CREATE TABLE IF NOT EXISTS scheduler (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT,
    zone_id INTEGER DEFAULT 0,
    active  INTEGER DEFAULT 1,
    action  TEXT    NOT NULL,
    hour    TEXT    NOT NULL,
    mon     INTEGER DEFAULT 0,
    tue     INTEGER DEFAULT 0,
    wed     INTEGER DEFAULT 0,
    thu     INTEGER DEFAULT 0,
    fri     INTEGER DEFAULT 0,
    sat     INTEGER DEFAULT 0,
    sun     INTEGER DEFAULT 0
);

-- Exclusiones del Scheduler
CREATE TABLE IF NOT EXISTS scheduler_exclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_history_timestampi ON history(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_zone ON history(zone_id);
CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_fault_unit ON fault_log(unit_id);