# Guía Técnica — Reimplementación SmartGreen en C
## Ingeniería Inversa y Desarrollo de Sistema Embebido Industrial

**Versión:** 2.1  
**Fecha:** Junio 2025  
**Sistema original:** SmartGreenAPI (EQTic) — Java Spring Boot  
**Objetivo:** Reimplementar en C puro con funcionalidades ampliadas  
**Lenguaje:** C puro (gcc 10.2.1 en Raspberry Pi OS Debian Bullseye)  
**Build system:** Makefile (estilo 42)

---

## Índice

1. [Contexto del sistema original](#1-contexto-del-sistema-original)
2. [Stack tecnológico descubierto](#2-stack-tecnológico-descubierto)
3. [Infraestructura de red y acceso](#3-infraestructura-de-red-y-acceso)
4. [Protocolo Modbus RTU — El núcleo del sistema](#4-protocolo-modbus-rtu--el-núcleo-del-sistema)
5. [Base de datos — Estructura completa MySQL original](#5-base-de-datos--estructura-completa-mysql-original)
6. [Esquema SQLite para el nuevo sistema](#6-esquema-sqlite-para-el-nuevo-sistema)
7. [API REST — Endpoints documentados](#7-api-rest--endpoints-documentados)
8. [Flujo de funcionamiento del sistema original](#8-flujo-de-funcionamiento-del-sistema-original)
9. [Lógica exacta de cálculo de registros Modbus](#9-lógica-exacta-de-cálculo-de-registros-modbus)
10. [Protocolo de instalación de dispositivos Modbus](#10-protocolo-de-instalación-de-dispositivos-modbus)
11. [Fórmulas matemáticas exactas — Cálculo de salinidad](#11-fórmulas-matemáticas-exactas--cálculo-de-salinidad)
12. [Funciones de utilidad — Decodificación de registros](#12-funciones-de-utilidad--decodificación-de-registros)
13. [Scheduler — Programación horaria](#13-scheduler--programación-horaria)
14. [Patrón de reintentos de base de datos](#14-patrón-de-reintentos-de-base-de-datos)
15. [Hardware conectado](#15-hardware-conectado)
16. [Arquitectura objetivo en C](#16-arquitectura-objetivo-en-c)
17. [Stack tecnológico del nuevo sistema en C](#17-stack-tecnológico-del-nuevo-sistema-en-c)
18. [Estructura del proyecto](#18-estructura-del-proyecto)
19. [Hoja de ruta de desarrollo](#19-hoja-de-ruta-de-desarrollo)
20. [Referencias y credenciales del sistema original](#20-referencias-y-credenciales-del-sistema-original)
21. [Resumen ejecutivo para el desarrollador](#21-resumen-ejecutivo-para-el-desarrollador)
22. [Portabilidad a hardware dedicado](#22-portabilidad-a-hardware-dedicado)
23. [Arquitectura de conectividad — SIM IoT, WiFi, Ethernet y SSH](#23-arquitectura-de-conectividad--sim-iot-wifi-ethernet-y-ssh)

---

## 1. Contexto del sistema original

El sistema SmartGreen es un controlador industrial de enfriadores evaporativos desarrollado por **EQTic** (`net.eqt`). Entregado en una Raspberry Pi 4 como caja negra, controla instalaciones de climatización industrial mediante el protocolo **Modbus RTU** sobre RS485.

**Instalación de referencia analizada:**
- Cliente: EQT
- Edificio: Calders
- ID Equipo: EQT01
- Zona: BCN, Sede SQG, Sala P1
- Desarrollador original: R. Serra (EQTic) — extraído de paths internos del JAR

**Proceso de ingeniería inversa realizado:**
- Acceso físico a la Pi mediante modificación del shadow en SD
- Extracción del JAR (54MB) y decompilación con jadx 1.4.7
- Análisis completo del código fuente Java decompilado
- Documentación del protocolo Modbus mediante análisis de logs y código

---

## 2. Stack tecnológico descubierto

| Componente | Tecnología | Detalles |
|---|---|---|
| Backend | Java Spring Boot 2.2.5 | JAR ejecutable: SmartGreenAPI.jar (54MB) |
| Base de datos | MariaDB/MySQL | Puerto 3306, BD: smartgreen |
| Servidor web | Lighttpd | Puerto 80, sirve el frontend React |
| Frontend | React (build estático) | Servido desde dentro del JAR |
| Interfaz visual | Chromium kiosco | --force-device-scale-factor=0.81, http://localhost |
| Protocolo industrial | Modbus RTU | Librería Java: net.wimpi.modbus |
| Puerto serie | jssc 2.8.0 + rxtxcomm 2.2pre2 | Comunicación RS485 |
| Conectividad remota | OpenVPN + PPP 4G | Módulo Sixfab LTE (LE910/LE920) |
| GPIO | WiringPi | Acceso a pines Raspberry Pi |
| Autenticación | OAuth2 + JWT | Spring Security 5.2.2 |
| Scheduler | Spring @Scheduled | Cron expressions, tick cada 1s |
| WebSocket | STOMP sobre SockJS | Tiempo real al frontend |

**Package Java del fabricante:** `net.eqt.smartgreenapi`
**Clase principal:** `net.eqt.smartgreenapi.app.MbusApplication`

**Clases clave analizadas:**
- `ModBusActions.java` — comunicación Modbus RTU/TCP
- `CoolerControl.java` — lógica principal (scheduler, prewet, water management)
- `GlobalValues.java` — estado global, mapas de registros, configuración
- `CoolerControlInstalacion.java` — wizard de instalación de dispositivos
- `DatabaseActions.java` — acceso a BD con patrón de reintentos
- `ScheddulerControl.java` — programación horaria ON/OFF
- `Utils.java` — fórmulas de salinidad, conversiones

---

## 3. Infraestructura de red y acceso

### Raspberry Pi (sistema original)
```
Modelo:       Raspberry Pi 4 Model B (alimentación USB-C)
OS:           Raspberry Pi OS Debian Bullseye (32-bit ARM)
IP Ethernet:  192.168.2.135/24
SSH:          ssh -p 2222 pi@192.168.2.135
Password pi:  N64dggomez903100
API REST:     http://192.168.2.135:8888
Frontend:     http://192.168.2.135 (puerto 80, lighttpd)
```

### IMPORTANTE — Configuración previa obligatoria en el Mac
```bash
# Ejecutar SIEMPRE antes de conectar por SSH desde el Mac
# Se pierde al reiniciar el Mac o cambiar de red
sudo ifconfig en0 192.168.2.100 netmask 255.255.255.0

# Luego conectar
ssh -p 2222 pi@192.168.2.135

# Copiar archivos Mac → Pi
scp -P 2222 archivo pi@192.168.2.135:/home/pi/destino/

# Copiar archivos Pi → Mac
scp -P 2222 pi@192.168.2.135:/ruta/archivo ~/destino/
```

### Interfaces de red de la Pi
```
eth0:   192.168.2.135/24  → Ethernet directo al Mac de desarrollo
wwan0:  169.254.68.244/16 → Módulo 4G Sixfab (DESHABILITADO)
wlan0:  DOWN              → WiFi bloqueada por rfkill
```

### SIM IoT EQTic — DESHABILITADA
```bash
# Estado actual: DESHABILITADA (cortado acceso remoto EQTic)
sudo systemctl status ppp_connection_manager.service

# Para REHABILITAR si fuera necesario (solo emergencia)
sudo systemctl enable ppp_connection_manager.service
sudo systemctl start ppp_connection_manager.service
sudo ip link set wwan0 up

# Script: /opt/sixfab/ppp_connection_manager/ppp_connection_manager.sh
# Servicio: /etc/systemd/system/ppp_connection_manager.service
```

### Firewall (UFW) en la Pi
```
Puerto 2222/tcp → SSH (ABIERTO)
Puerto 8888/tcp → API Spring Boot (interno)
Policy INPUT: DROP (por defecto)
```

### Puertos serie disponibles
```
/dev/ttyUSB0  → ACTIVO — Modbus RTU principal
/dev/ttyUSB1  → disponible
/dev/ttyUSB2  → disponible
/dev/ttyUSB3  → disponible
/dev/ttyUSB4  → disponible
/dev/ttyUSB5  → disponible
```

---

## 4. Protocolo Modbus RTU — El núcleo del sistema

### Parámetros del puerto serie
```
Puerto:    /dev/ttyUSB0
Baudrate:  9600
Paridad:   N (None)
Bits dato: 8
Stop bits: 1
Timeout:   5 décimas de segundo
Modo:      RTU (Remote Terminal Unit)
```
Verificado con: `sudo stty -F /dev/ttyUSB0` → `speed 9600 baud`

### Direcciones Modbus de los dispositivos

**Coolers Coolair CPMD:**
| Unit ID | Modelo | SW Rev | Zona | Tipo |
|---|---|---|---|---|
| 2 | CPMD0064 | 23R0314 | Zona 1 | Enfriador |
| 3 | CPMD0013 | 20R0813 | Zona 2 | Enfriador |
| 4 | CPMD0064 | 23R0314 | Zona 1 | Extractor |
| 5 | CPMD0064 | 23R0314 | Zona 2 | Extractor |
| 6 | CPMD0064 | 23R0314 | Zona 2 | Extractor |

**Sensores temperatura/humedad:**
| Unit ID | Nombre | Tipo | Zonas |
|---|---|---|---|
| 177 | S-Exterior | EXT | Global |
| 178 | S-178 | INT | Zona 1 y Zona 2 |

### Function Codes usados
| FC | Nombre | Uso |
|---|---|---|
| 3 | Read Holding Registers | Leer estado coolers y sensores |
| 16 | Write Multiple Registers | Escribir comandos a coolers |

### Operación 1 — Leer sensor (FC 03)
```
Function Code: 3
Unit ID:       177 o 178
Address:       299  (offset desde 40000)
Quantity:      4    (registros 40300 a 40303)
```

**Mapa de registros del sensor:**
| Offset | Registro | Contenido |
|---|---|---|
| 0 | 40300 | ID del sensor (debe coincidir con unit_id) |
| 1 | 40301 | Temperatura raw (×0.1 °C, -200 = sin señal) |
| 2 | 40302 | Humedad raw (×0.1 %, -200 = sin señal) |
| 3 | 40303 | Flags de estado |

```c
#define SENSOR_NO_SIGNAL      -200
#define MAX_SENSOR_TEMP_LIMIT  500
#define MAX_SENSOR_HUM_LIMIT   100
// temperatura_celsius = raw / 10.0
// humedad_percent     = raw / 10.0
```

### Operación 2 — Leer cooler (FC 03)
```
Function Code: 3
Unit ID:       2 a 6
Address:       0
Quantity:      59  (registros 40000 a 40058)
```

**Mapa de los 59 registros del cooler (offsets 0-58):**
| Offset | Registro | Contenido |
|---|---|---|
| 0 | 40000 | R_0: configuración global (bitmap) |
| 1-3 | 40001-40003 | Identificador fabricante |
| 4 | 40004 | Versión firmware |
| 5 | 40005 | Identificador modelo |
| 8 | 40008 | Dirección Modbus actual |
| 10 | 40010 | Estado extendido |
| 19-23 | 40019-40023 | Fan Speed Setpoints zonas 1-5 |
| 24 | 40024 | Ramp rate actual |
| 25 | 40025 | Tiempo mínimo llenado tanque |
| 26 | 40026 | Tiempo máximo llenado tanque |
| 27 | 40027 | Número de cold starts |
| 28 | 40028 | Número de fan starts |
| 29 | 40029 | Horas funcionamiento ventilador |
| 32 | 40032 | Número de tank drains |
| 43 | 40043 | Average tank fill time |
| 44 | 40044 | Número mensajes RF recibidos |
| 49 | 40049 | R_49: inmediate drain (escritura) |
| 50 | 40050 | R_50: bomba + fan speed (escritura) |
| 51 | 40051 | R_51: solenoide + drenaje (escritura) |
| 52 | 40052 | R_52: fan on/speed individual |
| 53 | 40053 | Estado adicional |
| 54 | 40054 | Salinidad PPM raw |
| 55 | 40055 | Salinidad uS raw |
| 56 | 40056 | Registros servicio/test |

**Decodificación del registro de estado 40050 (lectura):**
| Bit(s) | Campo |
|---|---|
| bit 0 | drain_valve_open |
| bit 1 | cool_mode_on |
| bit 2 | fan_on |
| bit 3 | fault_present |
| bit 4 | inlet_valve_open |
| bits 8-11 | actual_fan_speed (0-10) |
| bits 12-15 | most_recent_fault_code (0-15) |

### Operación 3 — Escribir comando (FC 16)
```
Function Code: 16
Unit ID:       2-6 (o 0 para broadcast)
Address:       400
Value:         300  (comando estándar de actualización periódica)
```

**Otras direcciones de escritura:**
| Address | Registro | Uso |
|---|---|---|
| 0 | 40000 | Escribir configuración global R_0 |
| 8 | 40008 | Asignar nueva dirección Modbus |
| 49 | 40049 | Inmediate drain ON/OFF |
| 50 | 40050 | Bomba + fan speed |
| 51 | 40051 | Solenoide + drenaje |
| 52 | 40052 | Fan on/speed individual |
| 400 | 40400 | Comando periódico estándar (value=300) |

### Timings del sistema original
```
Scheduler tick principal:     cada 1 segundo
Scheduler horario ON/OFF:     cada 15 segundos
Lectura coolers:              cada 900s mínimo, 3600s máximo
Escritura coolers:            cada 10s mínimo, 30s máximo
Grabación histórico:          cada 300s
Delay entre operaciones:      10ms (delayEsperaGlobalRead)
Reintentos Modbus:            1 reintento (modbusReintentos)
Umbral desactivación cooler:  error_count > 10
```

---

## 5. Base de datos — Estructura completa MySQL original

### Conexión MySQL original
```
Host:     localhost:3306
BD:       smartgreen
Usuario:  root / root
Driver:   com.mysql.cj.jdbc.Driver
```

### Las 23 tablas

**cooler_registros** — Estado actual de cada cooler
```sql
register_id   INT UNSIGNED PK  -- Unit ID Modbus (2-6)
r_40000       INT UNSIGNED     -- Configuración global
r_40020-24    INT UNSIGNED     -- Fan speed setpoints zonas 1-5
r_40050       INT UNSIGNED     -- Estado bomba/fan
r_40051       INT UNSIGNED     -- Estado solenoide/drenaje
r_40052       INT UNSIGNED     -- Estado fan individual
r_40053       INT UNSIGNED     -- Estado adicional
r_40054       INT UNSIGNED     -- Salinidad PPM raw
r_40055       INT UNSIGNED     -- Salinidad uS raw
r_40056       INT UNSIGNED     -- Registros servicio
last_mod      BIGINT UNSIGNED  -- Timestamp última modificación
error_count   INT UNSIGNED     -- Contador errores comunicación
last_read     BIGINT UNSIGNED  -- Timestamp última lectura OK
all_registers VARCHAR(1024)    -- JSON con los 59 registros completos
present       INT UNSIGNED     -- Cooler presente en bus (1/0)
extractor     INT UNSIGNED     -- Es extractor=1 o enfriador=0
```

**sensor_registros** — Estado actual de cada sensor
```sql
register_id  INT UNSIGNED PK  -- Unit ID Modbus (177-178)
r_40300      INT UNSIGNED     -- ID sensor
r_40301      INT              -- Temperatura raw (×0.1°C, -200=sin señal)
r_40302      INT              -- Humedad raw (×0.1%, -200=sin señal)
r_40303      INT              -- Flags de estado
last_mod     BIGINT           -- Timestamp última modificación
offset       INT              -- Corrección offset del sensor
type         VARCHAR(3)       -- 'EXT' o 'INT'
```

**zone** — Definición de zonas
```sql
id       INT UNSIGNED PK
name     VARCHAR(100)
enabled  VARCHAR(45)          -- "true" o "false"
```

**cooler_zone** — Relación cooler ↔ zona
```sql
id       INT UNSIGNED PK
id_zone  INT UNSIGNED FK
```

**sensor_zone** — Relación sensor ↔ zona
```sql
id       INT UNSIGNED
id_zone  INT UNSIGNED PK
```

**zone_parameters** — Parámetros de control por zona
```sql
zoneparametersid INT UNSIGNED PK
zoneid           INT UNSIGNED FK
FanSpeedCmd      VARCHAR(10)   -- Velocidad ventilador (0-10)
TargetTemp       VARCHAR(10)   -- Temperatura objetivo (°C)
HumidityMin      VARCHAR(10)   -- Humedad mínima (%)
HumidityMax      VARCHAR(10)   -- Humedad máxima (%)
PumpOnOffCmd     VARCHAR(10)   -- Estado bomba: "on"/"off"
LastPrewet       VARCHAR(100)  -- Timestamp último prewet
FanStart         VARCHAR(10)   -- Fan start setpoint
CoolFan          VARCHAR(10)   -- Modo: "COOL","FAN","AUTO","IMD"
DrainValve       VARCHAR(10)   -- Válvula: "open"/"close"
Solenoid         VARCHAR(10)   -- Solenoide: "on"/"off"
LastDrain        VARCHAR(100)  -- Timestamp último drenaje
LastPumpTime     VARCHAR(100)  -- Timestamp último encendido bomba
OnOff            VARCHAR(10)   -- Estado zona: "ON"/"OFF"
InmediateDrain   VARCHAR(10)   -- Drenaje inmediato: "yes"/"no"
PrewetInProgress VARCHAR(10)   -- Prewet en curso: "yes"/"no"/"pwt"
PrewetInExec     VARCHAR(10)   -- Prewet ejecutándose: "0"/"1"
```

**equipos** — Configuración global del sistema
```sql
param        VARCHAR(14) PK
param_value  VARCHAR(14)
last_mod     BIGINT
```
Valores instalación Calders:
```
NumeroCoolers  = 5
NumeroSensores = 2
NumeroZonas    = 2
PrimerCooler   = 2
PrimerSensor   = 177
UsarExterior   = true
```

**parameters** — Parámetros de operación
```sql
param        VARCHAR(21) PK
param_value  VARCHAR(21)
last_mod     BIGINT
used         VARCHAR(1)        -- 'S'=usado, 'N'=no usado
zones        VARCHAR(1)        -- 'D'=por zonas
```
Valores instalación Calders:
```
COMPort               = /dev/ttyUSB0
WaterManagerMode      = ms
SalinityLevelConfig   = 4275
WaterSealOpeningSpeed = 3
PrewetSelector        = yes
AutorestartConfig     = standby
TemperatureUnit       = C
TankDrainDelay        = 3Days
modBusSimulated       = false
ForceConfigFromDB     = true
GlobalInit            = true
OnOff                 = OFF
TargetTemp            = 25
HumidityMin           = 60
HumidityMax           = 70
FanSpeedCmd           = 0
PrewetTime            = 601
```

**initconfig** — Configuración de inicialización
```sql
gkey   VARCHAR(36) PK
value  VARCHAR(1024)
```
Valores instalación Calders:
```
generalOnOff                         = ON
refreshIntervalInSeconds             = 900
refreshCoolersInSeconds              = 30
minSetpointTemperature               = 20
maxSetpointTemperature               = 30
minSetpointFanSpeed                  = 0
maxSetpointFanSpeed                  = 10
minSetpointHumidity                  = 20
maxSetpointHumidity                  = 80
prewetDelayCloseValvle               = 9
prewetMaxDelayOpenedSolenoid         = 90
prewetMaxDelayOpenedSolenoidInterval = 30
prewetDelayWaterIsPresent            = 30
prewetDelayPumpOn                    = 120
prewetPartialDelay                   = 20
salinityTankDrainDelay               = 120
salinityTankDrainInterval            = 30
modbusReintentos                     = 1
broadcastCoolers                     = false
debug                                = true
logErrorsToDb                        = false
logHistoryToDb                       = false
multiplesSensores                    = true
usoEstractores                       = true
usarSensorExterior                   = true
webSocketEndPoint                    = /service/websocket-data
webSocketTopic                       = /service/topic/websocket-data
zz_schedduler                        = OFF
z_historyTime                        = 300
freeCoolingTemp                      = 0
autoLiberaIndividualCooler           = 120
hoursShowErrors                      = 12
retryFaultAuto                       = true
timeOffSetMillis                     = 0
```

**instalacion** — Datos de la instalación
```sql
param        VARCHAR(20) PK
param_value  VARCHAR(20)
last_mod     BIGINT
```
Valores: Cliente=EQT, Edificio=Calders, ID_Equipo=EQT01, Zona=BCN, Sede=SQG, Sala=P1

**sensor_names** — Nombres de los sensores
```sql
sensorid    INT UNSIGNED PK
sensorname  VARCHAR(20)
last_mod    BIGINT UNSIGNED
```

**schedduler** — Programación horaria ON/OFF
```sql
id              INT UNSIGNED PK auto_increment
scheddulerid    INT UNSIGNED
scheddulername  VARCHAR(45)
scheddulerzone  INT UNSIGNED     -- 0=todas las zonas
active          INT UNSIGNED     -- 1=activo
action          VARCHAR(3)       -- 'ON' o 'OFF'
hour            VARCHAR(10)      -- 'HH:MM'
lu              INT UNSIGNED     -- Lunes (1=activo)
ma              INT UNSIGNED     -- Martes
mi              INT UNSIGNED     -- Miércoles
ju              INT UNSIGNED     -- Jueves
vi              INT UNSIGNED     -- Viernes
sa              INT UNSIGNED     -- Sábado
do              INT UNSIGNED     -- Domingo
```

**schedduler_exclusions** — Fechas excluidas
```sql
id    INT UNSIGNED PK
date  VARCHAR(10)              -- 'YYYY-MM-DD'
```

**history** — Histórico principal de lecturas
```sql
id          INT PK auto_increment
historyid   INT
deviceid    INT                 -- Unit ID
devicetype  VARCHAR(2)
r_40000     INT                 -- Estado cooler en ese momento
r_40050-56  INT                 -- Registros cooler
r_40300-03  INT                 -- Registros sensor
fanspeed    INT                 -- Fan speed setpoint
tgttemp     INT                 -- Temperatura objetivo
hummin      INT                 -- Humedad mínima
hummax      INT                 -- Humedad máxima
bomba       VARCHAR(10)
fanstart    INT
mode        VARCHAR(10)
drain       VARCHAR(10)
solenoid    VARCHAR(10)
onoff       VARCHAR(10)
imd         VARCHAR(10)
timestamp   BIGINT
```

**historydata** — Histórico extendido en JSON
```sql
id        INT UNSIGNED PK auto_increment
data      LONGTEXT             -- JSON completo del sistema
timestamp BIGINT PK            -- clave compuesta
```

**historydatatemp** — Buffer temporal de histórico
```sql
id        INT UNSIGNED PK auto_increment
data      LONGTEXT
timestamp BIGINT
```

**statushistory** — Histórico de estados por zona
```sql
timestamp        BIGINT PK             -- clave compuesta
zone             INT PK
date             VARCHAR(45)
on_off           VARCHAR(5)
mode_setted      VARCHAR(5)
fanspeed_setted  VARCHAR(5)
temp_setted      VARCHAR(5)
hum_min_setted   VARCHAR(5)
hum_max_setted   VARCHAR(5)
int_temp1        VARCHAR(5)
int_temp2        VARCHAR(5)
int_hum          VARCHAR(5)
ext_temp1        VARCHAR(5)
ext_temp2        VARCHAR(5)
ext_hum          VARCHAR(5)
fanspeed         VARCHAR(1024)         -- JSON por cooler
cool_mode_on_off VARCHAR(1024)
water_present    VARCHAR(1024)
water_salinity   VARCHAR(1024)
solenoid_status  VARCHAR(1024)
drain_status     VARCHAR(1024)
```

**errorlog** — Log de errores
```sql
errorlogid  INT PK auto_increment
message     TEXT
timestamp   BIGINT
```

**faultlog** — Log de fallos de coolers
```sql
faultlogid    INT PK auto_increment
coolerid      INT
faultpresent  INT UNSIGNED
faultcode     INT UNSIGNED             -- 0-30
showit        INT
timecreated   BIGINT
timecleared   BIGINT
```

**user** — Usuarios
```sql
id        INT UNSIGNED PK
firstname VARCHAR(100)
lastname  VARCHAR(100)
password  VARCHAR(100)             -- Hash bcrypt
username  VARCHAR(100)
pin       VARCHAR(4) UNIQUE        -- PIN 4 dígitos
```

Usuarios conocidos:
| username | pin | rol |
|---|---|---|
| admin | 6060 | ADMIN_USER |
| mantenimiento | 7378 | MAINT_USER |
| operador | 6368 | OPER_USER |
| eqticadmin | 6061 | ADMIN_USER (EQTic) |
| operador_ext | 6369 | OPER_USER_EXT |

**role** y **user_role** — Roles y permisos
```sql
-- role: id, description, rolename (ADMIN_USER, MAINT_USER, OPER_USER, OPER_USER_EXT)
-- user_role: id, userid FK, roleid FK
```

**zone_sensorxxx** — Tabla auxiliar sensor-zona
```sql
id        INT UNSIGNED PK
id_sensor INT UNSIGNED
```

---

## 6. Esquema SQLite para el nuevo sistema

```sql
-- Configuración del sistema
CREATE TABLE IF NOT EXISTS config (
    key      TEXT PRIMARY KEY,
    value    TEXT NOT NULL,
    last_mod INTEGER DEFAULT (strftime('%s','now'))
);

-- Zonas
CREATE TABLE IF NOT EXISTS zones (
    id      INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    enabled INTEGER DEFAULT 1
);

-- Parámetros por zona
CREATE TABLE IF NOT EXISTS zone_params (
    zone_id            INTEGER PRIMARY KEY,
    fan_speed_cmd      INTEGER DEFAULT 3,
    target_temp        REAL    DEFAULT 25.0,
    humidity_min       REAL    DEFAULT 60.0,
    humidity_max       REAL    DEFAULT 70.0,
    pump_on            INTEGER DEFAULT 0,
    cool_fan_mode      TEXT    DEFAULT 'COOL',
    drain_valve        TEXT    DEFAULT 'close',
    solenoid           TEXT    DEFAULT 'on',
    on_off             TEXT    DEFAULT 'OFF',
    inmediate_drain    TEXT    DEFAULT 'no',
    prewet_in_progress TEXT    DEFAULT 'no',
    last_prewet        INTEGER DEFAULT 0,
    last_drain         INTEGER DEFAULT 0,
    last_pump_time     INTEGER DEFAULT 0,
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Estado actual de coolers
CREATE TABLE IF NOT EXISTS cooler_state (
    unit_id      INTEGER PRIMARY KEY,
    zone_id      INTEGER,
    is_extractor INTEGER DEFAULT 0,
    r_40000      INTEGER DEFAULT 0,
    r_40050      INTEGER DEFAULT 0,
    r_40051      INTEGER DEFAULT 0,
    r_40052      INTEGER DEFAULT 0,
    r_40053      INTEGER DEFAULT 0,
    r_40054      INTEGER DEFAULT 0,
    r_40055      INTEGER DEFAULT 0,
    r_40056      INTEGER DEFAULT 0,
    all_regs     TEXT,
    error_count  INTEGER DEFAULT 0,
    last_read    INTEGER DEFAULT 0,
    last_mod     INTEGER DEFAULT 0,
    present      INTEGER DEFAULT 1,
    FOREIGN KEY (zone_id) REFERENCES zones(id)
);

-- Estado actual de sensores
CREATE TABLE IF NOT EXISTS sensor_state (
    unit_id    INTEGER PRIMARY KEY,
    type       TEXT    DEFAULT 'INT',
    name       TEXT,
    temp_raw   INTEGER DEFAULT -200,
    hum_raw    INTEGER DEFAULT -200,
    flags      INTEGER DEFAULT 0,
    offset_val INTEGER DEFAULT 0,
    last_read  INTEGER DEFAULT 0,
    last_mod   INTEGER DEFAULT 0
);

-- Relación sensor ↔ zona
CREATE TABLE IF NOT EXISTS sensor_zone (
    sensor_id INTEGER,
    zone_id   INTEGER,
    PRIMARY KEY (sensor_id, zone_id)
);

-- Histórico de lecturas
CREATE TABLE IF NOT EXISTS history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp     INTEGER NOT NULL,
    zone_id       INTEGER,
    unit_id       INTEGER,
    device_type   TEXT,
    temp_raw      INTEGER,
    hum_raw       INTEGER,
    fan_speed     INTEGER,
    target_temp   REAL,
    hum_min       REAL,
    hum_max       REAL,
    pump_on       INTEGER,
    cool_mode     INTEGER,
    water_present INTEGER,
    salinity_ppm  REAL,
    salinity_us   REAL,
    drain_open    INTEGER,
    solenoid_on   INTEGER,
    on_off        TEXT,
    fault_code    INTEGER
);

-- Log de errores
CREATE TABLE IF NOT EXISTS error_log (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    level     TEXT    DEFAULT 'ERROR',
    message   TEXT    NOT NULL,
    unit_id   INTEGER DEFAULT 0
);

-- Log de fallos de coolers
CREATE TABLE IF NOT EXISTS fault_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    unit_id       INTEGER NOT NULL,
    fault_code    INTEGER NOT NULL,
    fault_present INTEGER DEFAULT 1,
    time_created  INTEGER NOT NULL,
    time_cleared  INTEGER DEFAULT 0
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

-- Exclusiones del scheduler
CREATE TABLE IF NOT EXISTS scheduler_exclusions (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT    NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp);
CREATE INDEX IF NOT EXISTS idx_history_zone      ON history(zone_id);
CREATE INDEX IF NOT EXISTS idx_error_timestamp   ON error_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_fault_unit        ON fault_log(unit_id);
```

---

## 7. API REST — Endpoints documentados

### Autenticación del sistema original
```
Base URL:      http://localhost:8888
Auth:          OAuth2 + JWT Bearer Token
Client ID:     smartgreen / Client Secret: smartgreen
JWT key:       MaYzkSjmkzPC57LMaYzkSjmkzPC57LMaYzkSjmkzPC57L
```

```bash
curl -X POST http://192.168.2.135:8888/oauth/token \
  -u smartgreen:smartgreen \
  -d "grant_type=password&username=admin&password=admin123"
```

### Endpoints (base: /service/)

**Lectura de datos:**
| Endpoint | Método | Descripción |
|---|---|---|
| /service/get_all_zones_data | GET | Estado completo todas las zonas |
| /service/get_all_zones_data_resum | GET | Resumen de zonas |
| /service/coolers_info | GET | Info detallada todos los coolers |
| /service/coolers_info/{cooler_id} | GET | Info de un cooler específico |
| /service/get_equipos | GET | Configuración de equipos |
| /service/get_all_other_data | GET | Todos los datos del sistema |
| /service/get_desplegables | GET | Opciones para dropdowns UI |
| /service/get_cooler_zone_relation | GET | Relación cooler-zona |
| /service/get_zone_sensor_relation | GET | Relación zona-sensor |
| /service/get_initconfigs | GET | Configuración inicialización |
| /service/memory_status | GET | Estado memoria JVM |

**Control de zonas:**
| Endpoint | Método | Descripción |
|---|---|---|
| /service/generalOnOff | POST | Encender/apagar sistema |
| /service/onOffZona/{zona}/{onoff} | POST | Encender/apagar zona |
| /service/setFanSpeedCmdZona/{zona}/{speed} | POST | Velocidad ventilador |
| /service/setSetpointTempToDbZona/{zona}/{temp} | POST | Temperatura objetivo |
| /service/setHumedadMinimaZona/{zona}/{hum} | POST | Humedad mínima |
| /service/setHumedadMaximaZona/{zona}/{hum} | POST | Humedad máxima |
| /service/setFanCoolAutoZona/{zona}/{mode} | POST | Modo FAN/COOL/AUTO |
| /service/llenarVaciarZona/{zona}/{accion} | POST | Llenar/vaciar zona |

**Control individual de coolers:**
| Endpoint | Método | Descripción |
|---|---|---|
| /service/individualize_cooler/{id} | POST | Control individual |
| /service/liberaIndividualCooler | POST | Liberar control individual |
| /service/writeR_0 | POST | Escribir R_0 (configuración) |
| /service/writeR_50 | POST | Escribir R_50 |
| /service/writeR_51 | POST | Escribir R_51 |
| /service/clearFaultPresentByCooler/{id} | POST | Limpiar fallo cooler |
| /service/clearFaultPresentByZone/{zona} | POST | Limpiar fallos zona |
| /service/runWaterManagement | POST | Gestión manual agua |

**Instalación de dispositivos:**
| Endpoint | Método | Descripción |
|---|---|---|
| /service/scanMbus/{ini}/{end}/{addr} | GET | Scan bus Modbus |
| /service/installCooler/{id}/{factory} | POST | Instalar cooler |
| /service/wizardInstalacionStartEndFactory | POST | Wizard coolers |
| /service/wizardInstalacionSensores | POST | Wizard sensores |
| /service/checkCoolerAfterReset | GET | Verificar tras reset |

**Histórico:**
| Endpoint | Método | Descripción |
|---|---|---|
| /service/getHistory/{page} | GET | Histórico paginado |
| /service/getAllHistory | GET | Todo el histórico |
| /service/generateHistory | POST | Generar histórico manual |

**WebSocket (tiempo real):**
```
Endpoint: /service/websocket-data
Topic:    /service/topic/websocket-data
Protocolo: STOMP sobre SockJS
```

---

## 8. Flujo de funcionamiento del sistema original

### Arranque del sistema
```
1. systemd arranca MariaDB (puerto 3306)
2. systemd arranca Lighttpd (puerto 80)
3. smartgreen.sh arranca SmartGreenAPI.jar (puerto 8888)
4. Spring Boot carga GlobalValues desde BD:
   instalacion → initconfig → parameters → equipos
   → sensores → coolers → zonas → zone_parameters
5. Scheduler arranca (tick cada 1s)
6. ScheddulerControl carga lista de schedules
7. OpenBox lanza Chromium kiosco → http://localhost
```

### Ciclo principal del scheduler (cada 1 segundo)
```
readSensorsShedulerNew():

  SI NOT inicializado OR NOT inicializadoGlobal → return
  SI generalOnOff == "OFF" AND NOT write_pending → return

  SI primer arranque (NOT inicializadoPrimeraLecturaModbus):
    1. readModBusData() → readSensors() + readCoolers()
    2. Para cada cooler: limpiar error_count si > 0
    3. Para cada cooler: limpiar fault_present si activo
    4. Reset individualCooler = 0
    5. FC16 → addr 51, val 0, a todos los coolers
    6. Calcular R_0 desde BD → FC16 addr 0, a todos
    7. Para cada zona: calcular e inicializar R_40050 y R_40051
    8. inicializadoPrimeraLecturaModbus = true

  SI timer >= delayReadCoolers (cada 900s mínimo):
    1. readSensors() → FC03, unit 177/178, addr 299, qty 4
    2. readCoolers() → FC03, unit 2-6, addr 0, qty 59
    3. Actualizar BD y memoria

  SI write_pending == true:
    Para cada zona:
      1. R_50 = calculate_register_50(imd, pump, fan_speed)
      2. R_51 = calculate_register_51(solenoid, drain)
      3. FC16 → addr 49, valor R_50, todos los coolers de la zona
      4. FC16 → addr 50, valor R_51, todos los coolers de la zona
    write_pending = false

  SI individualCooler > 0:
    Escribir solo al cooler individualizado
    FC16, addr 50/51, valores específicos
```

### Lógica de lectura con manejo de errores
```
mutex globalRead = true durante cualquier operación Modbus
  → Cualquier otra operación espera (sleep 10ms)
globalRead = false al terminar

Para cada cooler en la lectura:
  SI error_count > 10 → ignorar, no leer
  SI lectura OK       → error_count = 0, actualizar BD
  SI lectura ERROR    → error_count++, registrar en errorlog
```

### Ciclo Prewet completo
```
cicloPrewet(zona):
  1.  Esperar 2000ms (evitar cambios rápidos de modo)
  2.  SI modo == "FAN" o "IMD" → no hacer prewet, salir
  3.  prewetInProgress = true
  4.  Cerrar válvula drenaje (DrainValve = "close")
  5.  Apagar solenoide (Solenoid = "off")
  6.  FC16 → R_51 con solenoid=off, drain=close
  7.  Esperar prewetDelayCloseValvle (9s)
  8.  Abrir solenoide (Solenoid = "on")
  9.  FC16 → R_51 con solenoid=on, drain=close
  10. Bucle verificación agua (máx 90s, intervalos 30s):
        Leer coolers → verificar water_present
        SI todos los no-extractores tienen agua → salir bucle
  11. Esperar prewetDelayWaterIsPresent (30s)
  12. Encender bomba (PumpOnOffCmd = "on")
  13. FC16 → R_50 con pump=on, fan_speed=0
  14. Esperar prewetDelayPumpOn (120s)
  15. Cerrar solenoide
  16. prewetInProgress = false
```

### Lógica Water Management (control salinidad)
```
waterManagement():
  waterManager   = parameters["WaterManagerMode"]    // "ms"
  salinityTrigger = parameters["SalinityLevelConfig"] // 4275

  SI waterManager == "ms":
    Para cada cooler CON water_present == 1:
      SI salinity_uS >= salinityTrigger:
        1. Marcar cooler en mantenimiento
        2. FC16 addr 49, val 1 (inmediate drain ON)
        3. FC16 addr 50, val 0 (todo off)
        4. Bucle hasta salinityTankDrainDelay (120s):
             cada salinityTankDrainInterval (30s): repetir escritura
        5. Restaurar R_51 al valor anterior de la zona
        6. Quitar cooler de mantenimiento

  SI waterManager == "nc": no hacer nada
  SI waterManager == "nw": modo sin agua
  SI waterManager == "tm": por tiempo entre vaciados
```

### Códigos de fallo (fault codes)
| Código | Descripción |
|---|---|
| 0 | Sin error |
| 1 | Error de comunicaciones |
| 2 | Las sondas no detectan agua |
| 3 | Fault Code 03 |
| 4 | Presencia de agua después del vaciado |
| 5-30 | Fault codes reservados |

---

## 9. Lógica exacta de cálculo de registros Modbus

### Registro 40000 — Configuración global del cooler (R_0)

```
R_0 = water_manager + salinity_trigger + water_seal_opening_speed
    + prewet_selector + auto_restart + temperature_unit + tank_drain_delay
```

| Parámetro | Clave | Valor |
|---|---|---|
| water_manager | ms | 0 |
| water_manager | tm | 1 |
| water_manager | nc | 2 |
| water_manager | nw | 3 |
| salinity_trigger | 4275 uS | 0 |
| salinity_trigger | 2305 uS | 4 |
| water_seal_opening_speed | 0-15 | valor × 16 |
| prewet_selector | no | 0 |
| prewet_selector | yes | 256 |
| auto_restart | standby | 0 |
| auto_restart | restart | 512 |
| temperature_unit | C | 0 |
| temperature_unit | F | 1024 |
| tank_drain_delay | instant | 0 |
| tank_drain_delay | 3Hrs | 4096 |
| tank_drain_delay | 12Hrs | 8192 |
| tank_drain_delay | 3Days | 12288 |

**Verificación instalación Calders:**
```
ms=0 + 4275=0 + speed3=(3×16=48) + prewet_yes=256 + standby=0 + C=0 + 3Days=12288
R_0 = 12592 ✅ (coincide exactamente con r_40000 leído de los coolers)
```

```c
int calculate_register_0(const char *wm, const char *st, int ws,
                          const char *ps, const char *ar,
                          const char *tu, const char *td)
{
    int v_wm = strcmp(wm,"ms")==0?0:strcmp(wm,"tm")==0?1:strcmp(wm,"nc")==0?2:3;
    int v_st = strcmp(st,"4275")==0?0:4;
    int v_ws = ws * 16;
    int v_ps = strcmp(ps,"yes")==0?256:0;
    int v_ar = strcmp(ar,"restart")==0?512:0;
    int v_tu = strcmp(tu,"F")==0?1024:0;
    int v_td = strcmp(td,"3Hrs")==0?4096:strcmp(td,"12Hrs")==0?8192:
               strcmp(td,"3Days")==0?12288:0;
    return (v_wm + v_st + v_ws + v_ps + v_ar + v_tu + v_td);
}
```

### Registro 40050 — Comando escritura cooler (R_50)

```
R_50 = inmediate_drain + pump_on_off + fan_speed
```

| Parámetro | Valor |
|---|---|
| inmediate_drain yes | 1 |
| inmediate_drain no | 0 |
| pump ON | 2 |
| pump OFF | 0 |
| fan speed N (0-10) | N × 16 |

```c
int calculate_register_50(int inmediate_drain, int pump_on, int fan_speed)
{
    return ((inmediate_drain ? 1 : 0) + (pump_on ? 2 : 0) + (fan_speed * 16));
}
```

### Registro 40051 — Comando solenoide y válvula drenaje (R_51)

```
R_51 = solenoid_on_off + drain_open_close
```

| Parámetro | Valor |
|---|---|
| solenoid ON | 8 |
| solenoid OFF | 0 |
| drain open | 0 |
| drain close | 16 |

```c
int calculate_register_51(int solenoid_on, int drain_closed)
{
    return ((solenoid_on ? 8 : 0) + (drain_closed ? 16 : 0));
}
// solenoid ON + drain CLOSE = 24
// solenoid ON + drain OPEN  = 8
// solenoid OFF + drain OPEN = 0
```

### Registro 40052 — Fan on + fan speed individual (R_52)

| Fan speed | R_52 valor |
|---|---|
| 0 (off) | 0 |
| 1 | 4352 |
| 2 | 8448 |
| 3 | 12544 |
| 4 | 16640 |
| 5 | 20736 |
| 6 | 24832 |
| 7 | 28928 |
| 8 | 33024 |
| 9 | 37120 |
| 10 | 41216 |

```c
int calculate_register_52(int fan_speed)
{
    if (fan_speed == 0) return 0;
    return ((fan_speed * 4096) + 256);
}
```

### R_51 completo — Control individual (pump + solenoid + drain)

```c
int calculate_register_51_full(int pump_on, int solenoid_on, int drain_closed)
{
    return ((pump_on ? 1 : 0) + (solenoid_on ? 8 : 0) + (drain_closed ? 16 : 0));
}
```

---

## 10. Protocolo de instalación de dispositivos Modbus

### Instalar un cooler nuevo

```
PRERREQUISITO: generalOnOff = "OFF"

Paso 1 — Reset broadcast
  FC16, unit_id=0, address=400, qty=1
  value=100 (reset fábrica completo) o value=200 (reset solo dirección)

Paso 2 — Verificar cooler en dirección temporal 1
  FC03, unit_id=1, address=8, qty=1
  Respuesta OK → cooler encontrado y listo

Paso 3 — Asignar nueva dirección Modbus
  FC16, unit_id=1, address=8, qty=1, value=nuevo_id

Paso 4 — Escribir R_0 calculado desde configuración
  FC16, unit_id=nuevo_id, address=0, qty=1
  value = calculate_register_0(...)

Paso 5 — Inicializar registro 49
  FC16, unit_id=nuevo_id, address=49, qty=1, value=1

Paso 6 — Inicializar registro 50
  FC16, unit_id=nuevo_id, address=50, qty=1, value=0

Paso 7 — Inicializar registro 51
  FC16, unit_id=nuevo_id, address=51, qty=1, value=0

Paso 8 — Verificar cooler en nueva dirección
  FC03, unit_id=nuevo_id, address=8, qty=1
  Respuesta OK → instalación completada ✅
```

### Instalar un sensor nuevo

```
PRERREQUISITO: generalOnOff = "OFF"

Paso 1 — Reset broadcast sensores
  FC16, unit_id=0, address=299, qty=1, value=165

Paso 2 — Asignar nueva dirección
  FC16, unit_id=165, address=299, qty=1, value=nuevo_id
  Direcciones: 177 (EXT), 178 (INT), 179...

Paso 3 — Verificar sensor
  FC03, unit_id=nuevo_id, address=299, qty=4
  Respuesta OK → instalación completada ✅
```

### Scan Modbus

```c
void scan_modbus(modbus_t *ctx, int ini, int end, int address)
{
    int      i;
    uint16_t reg[1];

    for (i = ini; i <= end; i++)
    {
        modbus_set_slave(ctx, i);
        if (modbus_read_registers(ctx, address, 1, reg) == 1)
            printf("unit_id=%d encontrado, valor=%d\n", i, reg[0]);
        else
            printf("unit_id=%d sin respuesta\n", i);
    }
}
```

### Valores especiales de reset
| Valor | Significado |
|---|---|
| 100 | Reset completo a valores de fábrica |
| 200 | Reset solo dirección Modbus |
| 300 | Comando estándar de actualización periódica |
| 165 | Dirección temporal sensores tras reset |
| 1 | Dirección temporal coolers tras reset |

---

## 11. Fórmulas matemáticas exactas — Cálculo de salinidad

Extraídas directamente de `Utils.java`. Polinomios cúbicos que convierten el valor raw del registro Modbus a unidades reales.

### Fórmula PPM
```
PPM = (-1.06044991723606e-6 × x³) + (0.027993053 × x²) + (7.22299846 × x)
```

### Fórmula uS
```
uS = (3.7502257285455e-7 × x³) + (0.0501146383216609 × x²) + (13.1533305274848 × x)
```

```c
#include <math.h>

double  calculate_salinity_ppm(int raw_value)
{
    double  x;

    x = (double)raw_value;
    return ((-1.06044991723606e-6 * pow(x, 3.0))
            + (0.027993053 * pow(x, 2.0))
            + (7.22299846 * x));
}

double  calculate_salinity_us(int raw_value)
{
    double  x;

    x = (double)raw_value;
    return ((3.7502257285455e-7 * pow(x, 3.0))
            + (0.0501146383216609 * pow(x, 2.0))
            + (13.1533305274848 * x));
}
```

### Verificación con datos reales (instalación Calders)
```
Cooler 2: r_40054=4886 → PPM≈391 ✅  |  r_40055=63534 → uS≈711 ✅
Cooler 3: r_40054=4886 → PPM≈513 ✅  |  r_40055=65082 → uS≈932 ✅
```

---

## 12. Funciones de utilidad — Decodificación de registros

```c
typedef struct s_cooler_state
{
    int     drain_valve_open;
    int     cool_mode_on;
    int     fan_on;
    int     fault_present;
    int     inlet_valve_open;
    int     actual_fan_speed;
    int     most_recent_fault;
    int     water_present;
    double  salinity_ppm;
    double  salinity_us;
}   t_cooler_state;

void    decode_cooler_state(uint16_t *regs, t_cooler_state *state)
{
    state->drain_valve_open  = (regs[50] >> 0) & 0x01;
    state->cool_mode_on      = (regs[50] >> 1) & 0x01;
    state->fan_on            = (regs[50] >> 2) & 0x01;
    state->fault_present     = (regs[50] >> 3) & 0x01;
    state->inlet_valve_open  = (regs[50] >> 4) & 0x01;
    state->actual_fan_speed  = (regs[51] >> 8) & 0x0F;
    state->most_recent_fault = (regs[51] >> 12) & 0x0F;
    state->water_present     = regs[55] > 0 ? 1 : 0;
    state->salinity_ppm      = calculate_salinity_ppm(regs[54]);
    state->salinity_us       = calculate_salinity_us(regs[55]);
}

typedef struct s_sensor_state
{
    int     sensor_id;
    float   temperature;
    float   humidity;
    int     flags;
    int     valid;
}   t_sensor_state;

void    decode_sensor_state(uint16_t *regs, t_sensor_state *state)
{
    int temp_raw;
    int hum_raw;

    temp_raw = (int16_t)regs[1];
    hum_raw  = (int16_t)regs[2];
    state->sensor_id = regs[0];
    state->flags     = regs[3];
    if (temp_raw == -200 || temp_raw > 500 || hum_raw == -200 || hum_raw > 100)
    {
        state->valid       = 0;
        state->temperature = 0.0f;
        state->humidity    = 0.0f;
    }
    else
    {
        state->valid       = 1;
        state->temperature = temp_raw / 10.0f;
        state->humidity    = hum_raw / 10.0f;
    }
}
```

### Conversiones de bits

```c
void    int_to_bin16(int value, char *out)
{
    int i;

    for (i = 15; i >= 0; i--)
        out[15 - i] = (value >> i) & 1 ? '1' : '0';
    out[16] = '\0';
}

void    int_to_hex4(int value, char *out)
{
    sprintf(out, "%04x", value);
}
```

---

## 13. Scheduler — Programación horaria

Extraído de `ScheddulerControl.java`. Corre cada 15 segundos.

### Lógica
```
runSchedduler() cada 15 segundos:

  SI NOT inicializado OR generalOnOff == "OFF"
     OR zz_schedduler != "ON" → return

  Obtener hora actual en Europe/Madrid (+ timeOffSetMillis)
  Para cada schedule activo:
    SI el día de la semana está activo en el schedule:
      SI hora:minuto actual == schedule.hour:
        SI action == "ON" AND no hay exclusión para hoy:
          setOnOff("ON", zona)
        SI action == "OFF":
          setOnOff("OFF", zona)
```

### Zona horaria
```
Zona horaria: Europe/Madrid (CET/CEST)
Offset:       timeOffSetMillis (configurable, permite ajuste fino)
Exclusiones:  fechas en tabla schedduler_exclusions (días festivos)
              → Las acciones ON se saltan, las OFF se ejecutan siempre
```

### Implementación C
```c
#include <time.h>

void    run_scheduler(void)
{
    time_t      now;
    struct tm  *tm_info;
    int         current_day;
    int         current_hour;
    int         current_min;

    // Asegurarse de que TZ=Europe/Madrid está configurado en el sistema
    time(&now);
    tm_info = localtime(&now);
    current_day  = (tm_info->tm_wday == 0) ? 7 : tm_info->tm_wday;
    current_hour = tm_info->tm_hour;
    current_min  = tm_info->tm_min;
    // Iterar sobre schedules de la BD y ejecutar si coincide
}
```

---

## 14. Patrón de reintentos de base de datos

Extraído de `DatabaseActions.java`. Todas las operaciones de BD usan este patrón sin excepción.

```
Máximo intentos:        10 (cnt = 10)
Timeout entre reintentos: 500ms
Si todos fallan:        error crítico, registrar en log
```

```c
#define DB_MAX_RETRIES  10
#define DB_RETRY_DELAY  500000  // microsegundos (500ms)

int db_execute_with_retry(sqlite3 *db, const char *sql)
{
    int attempts;
    int rc;

    attempts = 0;
    while (attempts < DB_MAX_RETRIES)
    {
        rc = sqlite3_exec(db, sql, NULL, NULL, NULL);
        if (rc == SQLITE_OK)
            return (0);
        attempts++;
        if (attempts < DB_MAX_RETRIES)
            usleep(DB_RETRY_DELAY);
    }
    return (-1);
}
```

---

## 15. Hardware conectado

### Raspberry Pi 4
```
OS:          Raspberry Pi OS Debian Bullseye (32-bit ARM)
gcc:         10.2.1 (Raspbian 10.2.1-6+rpi1)
make:        GNU Make 4.3
SD:          58.9GB (mmcblk0p1=256MB /boot, mmcblk0p2=58.7GB /)
```

### Coolers Coolair CPMD
| Unit ID | Modelo | SW Rev | Serie | Zona |
|---|---|---|---|---|
| 2 | CPMD0064 | 23R0314 | SN00000001 | 1 |
| 3 | CPMD0013 | 20R0813 | SN00000001 | 2 |
| 4 | CPMD0064 | 23R0314 | SN00000001 | 1 (extractor) |
| 5 | CPMD0064 | 23R0314 | SN00000001 | 2 (extractor) |
| 6 | CPMD0064 | 23R0314 | SN00000001 | 2 (extractor) |

```
Protocolo:  CPMDF (Coolair Modbus DF)
Conexión:   RS485 via USB → /dev/ttyUSB0
Ramp Rate:  55uS per 100mS
```

### Sensores temperatura/humedad
```
Unit ID 177: S-Exterior (EXT) — sensor exterior
Unit ID 178: S-178 (INT)      — sensor interior (zonas 1 y 2)
Sin señal:   valor -200
```

### Concentrador RS485/USB
```
6 puertos: /dev/ttyUSB0 a /dev/ttyUSB5
Activo:    /dev/ttyUSB0
Grupo:     dialout (el usuario pi debe estar en este grupo)
```

---

## 16. Arquitectura objetivo en C

```
┌──────────────────────────────────────────┐
│               HARDWARE                    │
│  RS485 ──► /dev/ttyUSB0 ──► Pi 4         │
│  Coolers (unit 2-6)                       │
│  Sensores (unit 177-178)                  │
└─────────────────┬────────────────────────┘
                  │ libmodbus RTU
┌─────────────────▼────────────────────────┐
│          CAPA MODBUS                      │
│  modbus/modbus_client.c                   │
│  modbus/registers.c                       │
└─────────────────┬────────────────────────┘
                  │ structs C
┌─────────────────▼────────────────────────┐
│          CAPA DE CONTROL                  │
│  control/cooler.c    (salinidad, prewet)  │
│  control/sensor.c    (validación)         │
│  control/scheduler.c (ciclo + horario)    │
└─────────────────┬────────────────────────┘
                  │ sqlite3
┌─────────────────▼────────────────────────┐
│          PERSISTENCIA                     │
│  db/database.c  (SQLite + reintentos)     │
└─────────────────┬────────────────────────┘
                  │ HTTP
┌─────────────────▼────────────────────────┐
│          API REST + WebSocket             │
│  api/api_server.c                         │
└─────────────────┬────────────────────────┘
                  │ http://localhost:8080
┌─────────────────▼────────────────────────┐
│          FRONTEND React (kiosco)          │
│  Chromium → http://localhost:8080         │
│  Misma interfaz para local y remoto       │
└─────────────────┬────────────────────────┘
                  │ SIM IoT LTE-M
┌─────────────────▼────────────────────────┐
│     SERVIDOR CENTRAL AUSTRALAIR           │
│  API + PostgreSQL + Mapa España           │
│  Portal cliente + Alarmas 🔴🟡🟢         │
└──────────────────────────────────────────┘
```

---

## 17. Stack tecnológico del nuevo sistema en C

### Comunicación Modbus
```bash
sudo apt-get install -y libmodbus-dev
pkg-config --modversion libmodbus
```
```c
#include <modbus.h>
// Enlazar: -lmodbus
```

### Base de datos
```bash
sudo apt-get install -y libsqlite3-dev
pkg-config --modversion sqlite3
```
```c
#include <sqlite3.h>
// Enlazar: -lsqlite3
```

### Matemáticas
```c
#include <math.h>
// Enlazar: -lm
```

### Threading
```c
#include <pthread.h>
// Enlazar: -lpthread
```

### JSON (cJSON — C puro, sin dependencias)
```
URL:   https://github.com/DaveGamble/cJSON
Uso:   copiar cJSON.h y cJSON.c al proyecto
```

### API REST + WebSocket
```bash
sudo apt-get install -y libmicrohttpd-dev libwebsockets-dev
```

### Pantalla de arranque (Plymouth)
```bash
sudo apt-get install -y plymouth plymouth-themes
# Configurar splash screen personalizado Australair
# /etc/plymouth/themes/smartgreen/
```

---

## 18. Estructura del proyecto

```
SmartGreen_V2/
├── Smartgreen_cpp_guiatecnica.md
├── Smartgreen_productvision.md
└── Software/
    ├── Makefile
    ├── incl/
    │   └── smartgreen.h       ← ÚNICO header: tipos, constantes, prototipos
    ├── src/
    │   └── main.c             ← entrada principal, inicialización
    ├── modbus/
    │   ├── modbus_client.c    ← conexión RTU, read/write Modbus
    │   └── registers.c        ← decodificación e interpretación registros
    ├── control/
    │   ├── cooler.c           ← lógica coolers, salinidad, prewet, water mgmt
    │   ├── sensor.c           ← lógica sensores, validación, offset
    │   └── scheduler.c        ← ciclo principal, timers, programación horaria
    ├── db/
    │   └── database.c         ← SQLite, CRUD, histórico, reintentos
    ├── api/
    │   └── api_server.c       ← REST API + WebSocket
    └── utils/
        └── utils.c            ← conversiones, logs, utilidades
```

**Regla de includes — todos los `.c` incluyen únicamente:**
```c
#include "../incl/smartgreen.h"
```

**Contenido obligatorio de `smartgreen.h`:**
```c
#ifndef SMARTGREEN_H
# define SMARTGREEN_H

// Includes de sistema
# include <stdio.h>
# include <stdlib.h>
# include <string.h>
# include <stdint.h>
# include <unistd.h>
# include <math.h>
# include <time.h>
# include <pthread.h>
# include <modbus.h>
# include <sqlite3.h>

// Constantes Modbus
# define MODBUS_PORT        "/dev/ttyUSB0"
# define MODBUS_BAUD        9600
# define MODBUS_PARITY      'N'
# define MODBUS_DATA_BITS   8
# define MODBUS_STOP_BITS   1
# define MODBUS_COOLER_REGS 59
# define MODBUS_SENSOR_REGS 4
# define MODBUS_SENSOR_ADDR 299
# define MODBUS_CMD_ADDR    400
# define MODBUS_CMD_VALUE   300

// Límites
# define SENSOR_NO_SIGNAL      -200
# define MAX_SENSOR_TEMP       500
# define MAX_SENSOR_HUM        100
# define MAX_COOLER_ERRORS     10
# define SALINITY_TRIGGER      4275

// Timings (segundos)
# define SCHEDULER_READ_MIN    900
# define SCHEDULER_WRITE_MIN   10
# define SCHEDULER_WRITE_MAX   30
# define HISTORY_INTERVAL      300
# define DB_MAX_RETRIES        10
# define DB_RETRY_US           500000

// Structs, typedefs y prototipos...

#endif
```

### Normas de codificación (estilo 42)
```
- Un solo header: incl/smartgreen.h
- Todos los .c incluyen solo: #include "../incl/smartgreen.h"
- Makefile con targets: all, clean, fclean, re
- Máximo 25 líneas por función
- Sin variables globales salvo contexto principal
- Sin funciones sin usar
- Gestión de errores en TODAS las llamadas a libmodbus y sqlite3
- Nombres en snake_case
- Prototipos en el header, implementación en los .c
```

---

## 19. Hoja de ruta de desarrollo

### Fase 1 — Modbus funcional (semana 1-2)
```
□ smartgreen.h — tipos y constantes completos
□ Makefile — compilación limpia
□ main.c — inicialización, contexto Modbus
□ modbus/modbus_client.c — conexión RTU, read/write
□ modbus/registers.c — decodificación 59 registros cooler, 4 sensor
□ Test: leer cooler real → verificar con datos del sistema EQTic
□ Test: leer sensores → verificar temperatura/humedad
□ Test: verificar fórmulas salinidad con datos reales
□ Test: escribir comando y verificar respuesta
```

### Fase 2 — Base de datos (semana 2-3)
```
□ db/database.c — esquema SQLite, CRUD completo
□ Guardar estado coolers y sensores
□ Implementar histórico de lecturas
□ Implementar log de errores y fault log
□ Patrón de reintentos (10 intentos, 500ms)
```

### Fase 3 — Lógica de control (semana 3-5)
```
□ control/scheduler.c — tick 1s, lectura, escritura
□ control/cooler.c — por zonas, salinidad, water management
□ control/sensor.c — validación, offset, sin señal
□ Ciclo Prewet completo (16 pasos)
□ Scheduler horario (zona horaria Europe/Madrid)
□ Sistema de alarmas básico
```

### Fase 4 — API REST (semana 5-6)
```
□ api/api_server.c — servidor HTTP
□ Endpoints lectura (/zones, /coolers, /sensors)
□ Endpoints control (/onoff, /fanspeed, /setpoint)
□ WebSocket tiempo real
□ Autenticación JWT básica
```

### Fase 5 — Frontend React (semana 6-8)
```
□ Dashboard principal (zonas y coolers)
□ Control básico (encender/apagar, setpoints)
□ Histórico con gráficas
□ Alarmas visual 🔴🟡🟢
□ Responsive para pantalla táctil
□ Chromium kiosco → http://localhost:8080
```

### Fase 6 — Servidor Australair (semana 8-10)
```
□ API central (Node.js o Go)
□ PostgreSQL + TimescaleDB
□ Dashboard mapa de España
□ Portal cliente web
□ Alarmas con email/SMS
□ SIM IoT LTE-M integrada
```

### Fase 7 — Hardware dedicado (semana 10-12)
```
□ Raspberry Pi CM4 (recomendado)
□ Pantalla táctil industrial
□ Caja industrial IP65
□ Plymouth splash screen SmartGreen by Australair
□ Servicio systemd arranque automático
□ OTA updates remotos
```

---

## 20. Referencias y credenciales del sistema original

### Acceso SSH
```bash
# PASO 1 — Obligatorio antes de cada sesión desde el Mac
sudo ifconfig en0 192.168.2.100 netmask 255.255.255.0

# PASO 2 — Conectar
ssh -p 2222 pi@192.168.2.135
# Password: N64dggomez903100
```

### Archivos clave en la Pi
```
JAR original:     /home/pi/smartgreen_java/SmartGreenAPI.jar
JAR backup:       /home/pi/smartgreen_java/SmartGreenAPI_bck_20250617.jar
Script arranque:  /home/pi/smartgreen_java/smartgreen.sh
Logs Java:        /home/pi/smartgreen_java/logs/smartgreen_java.log
Backup BD:        /home/pi/smartgreen_java/smartgreen_bck_20250527_dev.sql
OpenVPN configs:  /home/pi/ovpns/
Autostart X11:    /home/pi/autostart
```

### Archivos en Mac/Linux de desarrollo
```
JAR decompilado:  ~/smartgreen_src/decompiled/sources/net/eqt/
JAR original:     ~/smartgreen_src/SmartGreenAPI.jar
Backup SD:        ~/Documents/backup_pi_original.img (portátil Linux)
Proyecto nuevo:   ~/SmartGreen_V2/Software/
```

### Credenciales sistema original
```
MySQL:         root / root (BD: smartgreen, puerto 3306)
API admin:     admin / admin123
API JWT:       smartgreen / smartgreen
JWT key:       MaYzkSjmkzPC57LMaYzkSjmkzPC57LMaYzkSjmkzPC57L
```

### Comandos útiles de referencia
```bash
# Token JWT
curl -X POST http://192.168.2.135:8888/oauth/token \
  -u smartgreen:smartgreen \
  -d "grant_type=password&username=admin&password=admin123"

# Estado completo sistema EQTic
curl -H "Authorization: Bearer $TOKEN" \
  http://192.168.2.135:8888/service/get_all_other_data | python3 -m json.tool

# Estado zonas
curl -H "Authorization: Bearer $TOKEN" \
  http://192.168.2.135:8888/service/get_all_zones_data | python3 -m json.tool

# Info coolers
curl -H "Authorization: Bearer $TOKEN" \
  http://192.168.2.135:8888/service/coolers_info | python3 -m json.tool

# MySQL directo
mysql -u root -proot smartgreen -e "SELECT * FROM cooler_registros;"
mysql -u root -proot smartgreen -e "SELECT * FROM sensor_registros;"
mysql -u root -proot smartgreen -e "SELECT * FROM parameters;"
mysql -u root -proot smartgreen -e "SELECT * FROM zone_parameters;"
mysql -u root -proot smartgreen -e "SELECT * FROM initconfig;"

# Verificar puerto serie
sudo stty -F /dev/ttyUSB0

# Reconectar SIM EQTic (solo emergencia)
sudo systemctl enable ppp_connection_manager.service
sudo systemctl start ppp_connection_manager.service
sudo ip link set wwan0 up
```

---

## 21. Resumen ejecutivo para el desarrollador

### Mínimo viable — lo que DEBES implementar primero

```
1.  modbus_new_rtu("/dev/ttyUSB0", 9600, 'N', 8, 1)
2.  FC03: modbus_read_registers(ctx, 299, 4, regs)     → leer sensor
3.  FC03: modbus_read_registers(ctx, 0, 59, regs)      → leer cooler
4.  FC16: modbus_write_registers(ctx, 400, 1, &cmd)    → actualización periódica
5.  calculate_register_0()                              → config cooler
6.  calculate_register_50()                             → bomba/fan
7.  calculate_register_51()                             → solenoide/válvula
8.  calculate_register_52()                             → fan individual
9.  decode_cooler_state()                               → decodificar 59 regs
10. decode_sensor_state()                               → decodificar 4 regs
11. calculate_salinity_ppm() y calculate_salinity_us()
12. Scheduler: tick 1s, lectura cada 900s, escritura cada 10-30s
13. SQLite con reintentos: guardar estado, histórico, errores
```

---

## 22. Portabilidad a hardware dedicado

El código en C puro es **completamente portable**. No hay dependencia de Java, JVM, ni frameworks pesados. Compilar para otra arquitectura es cambiar el compilador en el Makefile.

### Por qué C puro garantiza la portabilidad

```
Java Spring Boot:  requiere JVM, mínimo 512MB RAM, lento en ARM pequeño
C puro:            binario nativo, < 5MB RAM en reposo, arranca en < 1 segundo
                   compila para cualquier arquitectura con un cross-compiler
```

### Placas candidatas para producción

| Placa | CPU | RAM | Ventaja | Uso recomendado |
|---|---|---|---|---|
| Raspberry Pi CM4 | ARM Cortex-A72 | 1-8GB | Misma arch que Pi 4, ecosistema maduro | Primera versión de producto |
| Raspberry Pi CM5 | ARM Cortex-A76 | 2-16GB | Más potente, mismo factor de forma | Versiones premium |
| STM32MP157 | ARM Cortex-A7 | 512MB | Industrial, -40°C a +85°C | Entornos extremos |
| i.MX8M Plus | ARM Cortex-A53 | 2-8GB | NPU integrada, muy usado en HMI | Pantallas táctiles industriales |
| NVIDIA Jetson Nano | ARM Cortex-A57 | 4GB | Potente, si se necesita IA futura | Expansión con predicción de fallos |
| BeagleBone Black | ARM Cortex-A8 | 512MB | Muy barato, PRU para tiempo real | Instalaciones básicas de bajo coste |

### Recomendación: Raspberry Pi CM4

```
Razones:
- Misma arquitectura que la Pi 4 en la que desarrollamos
- El código compilará sin cambios
- Factor de forma compacto para PCB propia
- Módulo de cómputo: se integra en PCB con RS485, pantalla, SIM
- Variantes: 1GB/2GB/4GB/8GB RAM, con/sin eMMC, con/sin WiFi/BT
- Precio: 25-75€ según variante
- Disponibilidad industrial (CM4 Lite para soldar eMMC propio)

Periféricos a integrar en PCB propia:
- Conversor RS485/USB (o RS485 directo via UART)
- Slot SIM para módulo LTE-M (Quectel EC21 o similar)
- Conector pantalla táctil (DSI o HDMI)
- RTC (reloj tiempo real con batería backup)
- Conector Ethernet
- Leds de estado (PWR, MODBUS, CLOUD, ALARM)
- Botón de reset
- Watchdog hardware
```

### Cross-compilación en el Makefile

```makefile
# Compilación nativa en Pi (desarrollo)
CC      = gcc
CFLAGS  = -Wall -Wextra -O2

# Cross-compilación para ARM desde Mac/Linux (producción)
# CC      = arm-linux-gnueabihf-gcc
# CFLAGS  = -Wall -Wextra -O2 -march=armv7-a

# Cross-compilación para ARM64 (CM4, CM5)
# CC      = aarch64-linux-gnu-gcc
# CFLAGS  = -Wall -Wextra -O2 -march=armv8-a
```

### Requisitos mínimos de hardware

```
RAM mínima:        256MB (SQLite + lógica Modbus + API REST)
RAM recomendada:   1GB (con frontend React en Chromium kiosco)
Almacenamiento:    4GB mínimo, 16GB recomendado (histórico)
Temperatura:       Según placa elegida (-20°C a +70°C para CM4)
Conectividad:      1× Ethernet, 1× slot SIM, WiFi opcional
Puerto serie:      1× RS485 (mínimo), 2× recomendado (redundancia)
Pantalla:          HDMI o DSI táctil, resolución mínima 800×480
```

### Diseño PCB propio (Fase 7)

```
Componentes a integrar en PCB dedicada:
  - Slot CM4 (conector Hirose DF40)
  - Módulo LTE-M: Quectel EC21-E o BG77 (NB-IoT/LTE-M)
  - Conversor RS485: MAX485 o SP3485
  - RTC: DS3231 (I2C, precisión ±2ppm)
  - Watchdog: MAX6369 (reset hardware si el sistema se cuelga)
  - LEDs de estado: PWR (verde), MODBUS (azul), CLOUD (cyan), ALARM (rojo)
  - Conector industrial: bornes roscados para RS485 y alimentación
  - Alimentación: 12-24V DC industrial con protección contra inversión
  - Caja: IP65 para instalación en exterior o salas técnicas

Certificaciones objetivo:
  - CE (obligatorio para venta en Europa)
  - RoHS
  - IP65 (resistencia a polvo y agua)
```

---

## 23. Arquitectura de conectividad — SIM IoT, WiFi, Ethernet y SSH

### Principio fundamental

**Australair tiene control absoluto sobre todas las instalaciones en todo momento**, independientemente de si el cliente coopera o no. Esto se garantiza mediante una SIM IoT gestionada exclusivamente por Australair que no puede ser desactivada por el cliente.

### Jerarquía de conectividad (failover automático)

```
PRIORIDAD 1: SIM IoT LTE-M (siempre activa — Australair la gestiona)
  → Canal primario de control y monitorización
  → El cliente NO puede desconectarla
  → Australair paga el coste (~5-10€/mes por instalación)
  → Tecnología: LTE-M (Cat-M1) o NB-IoT

PRIORIDAD 2: Ethernet del cliente (si disponible)
  → Canal secundario para transferencia masiva de datos
  → Backups de histórico, actualizaciones OTA grandes
  → El cliente puede desconectarlo — no es canal crítico

PRIORIDAD 3: WiFi del cliente (si disponible)
  → Canal terciario, igual que Ethernet
  → El cliente puede desconectarlo — no es canal crítico

PRIORIDAD 4: SSH (sobre cualquier interfaz activa)
  → Acceso técnico de Australair para diagnóstico
  → Puerto configurable (por defecto 2222)
  → Solo accesible con clave SSH de Australair
```

### Daemon de conectividad

El sistema incluirá un daemon en C que gestiona la conectividad de forma autónoma:

```c
/*
** connectivity_daemon.c
** Gestiona las interfaces de red y garantiza conectividad con servidor Australair
** Se ejecuta como servicio systemd independiente del daemon principal SmartGreen
*/

typedef enum    e_iface_type
{
    IFACE_SIM,        // SIM IoT LTE-M — prioridad 1
    IFACE_ETHERNET,   // Ethernet cliente — prioridad 2
    IFACE_WIFI,       // WiFi cliente — prioridad 3
}   t_iface_type;

typedef struct  s_iface_status
{
    t_iface_type    type;
    char            name[16];       // "wwan0", "eth0", "wlan0"
    int             active;         // 1=up, 0=down
    int             has_ip;         // 1=tiene IP asignada
    int             can_reach_server; // 1=puede alcanzar servidor Australair
    time_t          last_check;
}   t_iface_status;

/*
** Ciclo del daemon (cada 30 segundos):
** 1. Verificar estado de cada interfaz
** 2. Si SIM caída → intentar reconexión (ppp/ModemManager)
** 3. Seleccionar interfaz activa con mayor prioridad
** 4. Verificar túnel MQTT TLS con servidor Australair
** 5. Si túnel caído → reconectar
** 6. Publicar estado de conectividad en SQLite
*/
```

### Protocolo de comunicación con servidor Australair

```
Protocolo:    MQTT sobre TLS 1.3
Puerto:       8883 (MQTT TLS estándar)
Auth:         Certificado X.509 por dispositivo (único por instalación)
QoS:          1 (at least once) para datos de sensores
              2 (exactly once) para comandos de control
Keepalive:    60 segundos
Will message: "device/EQT01/status" = "offline" (detectar desconexión)

Topics publicados por el dispositivo:
  device/{id}/telemetry     → datos sensores/coolers cada 30s
  device/{id}/status        → estado del sistema cada 60s
  device/{id}/alarms        → alarmas en tiempo real
  device/{id}/logs          → logs de errores

Topics suscritos por el dispositivo:
  device/{id}/commands      → comandos remotos (ON/OFF, setpoints)
  device/{id}/config        → actualizaciones de configuración
  device/{id}/ota           → notificación de actualización OTA
```

### Configuración de interfaces de red

**SIM IoT LTE-M:**
```bash
# Módulo: Quectel EC21 o BG77
# Interfaz: wwan0 o ppp0 según driver
# APN: según proveedor (1NCE, Simbase, etc.)
# Gestión: ModemManager + NetworkManager o PPP directo

# Verificar módem
mmcli -m 0

# Estado de conectividad
nmcli device status

# Forzar reconexión SIM
mmcli -m 0 --simple-connect="apn=iot.1nce.net"
```

**WiFi del cliente:**
```bash
# Configuración en /etc/wpa_supplicant/wpa_supplicant.conf
network={
    ssid="RED_CLIENTE"
    psk="PASSWORD_CLIENTE"
    priority=2
}

# El cliente puede proporcionar sus credenciales WiFi
# Se configuran en el portal web local o via SSH por técnico Australair
```

**Ethernet:**
```bash
# Configuración estática o DHCP según red del cliente
# /etc/network/interfaces o NetworkManager
# Prioridad más alta que WiFi para mayor estabilidad
```

### SSH — Acceso técnico Australair

```bash
# Configuración en /etc/ssh/sshd_config del dispositivo SmartGreen
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile /home/pi/.ssh/authorized_keys

# Solo clave pública de Australair en authorized_keys
# El cliente NO tiene acceso SSH
# Acceso via túnel reverso sobre SIM IoT si no hay IP pública
```

**Túnel SSH reverso (para instalaciones sin IP pública):**
```bash
# El dispositivo abre túnel reverso al servidor Australair
# Permite a Australair conectar aunque el dispositivo esté detrás de NAT
ssh -N -R 10000:localhost:2222 tunnel@servidor.australair.com

# Automatizado con autossh para reconexión automática
autossh -M 10001 -N -R 10000:localhost:2222 tunnel@servidor.australair.com
```

### OTA Updates (Over The Air)

```
Proceso de actualización remota:

1. Australair publica nueva versión en servidor
2. Servidor envía notificación via MQTT: device/{id}/ota
3. Daemon OTA en el dispositivo descarga el binario
4. Verifica checksum SHA256 y firma digital
5. Detiene servicio SmartGreen
6. Reemplaza binario: /usr/local/bin/smartgreen
7. Reinicia servicio SmartGreen
8. Verifica arranque correcto (watchdog)
9. Si fallo → rollback automático a versión anterior
10. Confirma actualización al servidor via MQTT
```

```c
/*
** ota_update.c
** Descarga y aplica actualizaciones OTA de forma segura
*/

typedef struct  s_ota_update
{
    char    version[32];        // "2.1.0"
    char    url[256];           // URL del binario en servidor Australair
    char    checksum[65];       // SHA256 del binario
    char    signature[512];     // Firma digital de Australair
    int     size;               // Tamaño en bytes
}   t_ota_update;

/*
** Proceso:
** 1. Descargar a /tmp/smartgreen_new
** 2. Verificar SHA256
** 3. Verificar firma con clave pública de Australair
** 4. Backup del binario actual: /usr/local/bin/smartgreen.bak
** 5. Reemplazar: mv /tmp/smartgreen_new /usr/local/bin/smartgreen
** 6. chmod +x /usr/local/bin/smartgreen
** 7. systemctl restart smartgreen
*/
```

### Servicio systemd del daemon de conectividad

```ini
# /etc/systemd/system/sg-connectivity.service
[Unit]
Description=SmartGreen Connectivity Daemon
After=network.target ModemManager.service
Wants=ModemManager.service

[Service]
Type=simple
ExecStart=/usr/local/bin/sg-connectivity
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
```

### Servicio systemd del daemon SmartGreen principal

```ini
# /etc/systemd/system/smartgreen.service
[Unit]
Description=SmartGreen Industrial Control System
After=network.target sg-connectivity.service
Wants=sg-connectivity.service

[Service]
Type=simple
ExecStart=/usr/local/bin/smartgreen
Restart=always
RestartSec=5
User=pi
WorkingDirectory=/home/pi/smartgreen

[Install]
WantedBy=multi-user.target
```

### Secuencia de arranque completa del sistema

```
1. Alimentación conectada
2. BIOS/bootloader → Plymouth splash screen (logo SmartGreen by Australair)
3. systemd arranca servicios:
   a. ModemManager (gestión módulo LTE-M)
   b. sg-connectivity (daemon conectividad — SIM IoT siempre)
   c. smartgreen (daemon principal — Modbus, SQLite, API REST)
   d. nginx o lighttpd (sirve frontend React)
   e. openbox + chromium (kiosco en pantalla táctil)
4. sg-connectivity establece túnel MQTT TLS con servidor Australair
5. smartgreen inicializa Modbus, lee BD, arranca scheduler
6. Chromium muestra dashboard local → http://localhost:8080
7. Sistema operativo (< 30 segundos desde encendido)
```

### Proveedores SIM IoT recomendados para España

| Proveedor | Tecnología | Precio | Ventaja |
|---|---|---|---|
| 1NCE | LTE-M / NB-IoT | ~10€ pago único + 500MB/vida | Sin cuota mensual, ideal para bajo tráfico |
| Simbase | 4G / LTE-M | ~2-5€/mes | Multioperador España (Movistar+Voda+Orange) |
| Matooma | 4G / LTE-M | Variable | 5M líneas activas en España |
| Onomondo | LTE-M / NB-IoT | Variable | Plataforma de gestión IoT incluida |

**Recomendación para SmartGreen:** 1NCE para el MVP (coste mínimo, suficiente para telemetría). Evaluar Simbase para escalar a más instalaciones con mejor cobertura multioperador.

### Volumen de datos estimado por instalación

```
Telemetría cada 30s:        ~200 bytes/mensaje × 2880/día ≈ 576KB/día
Estado sistema cada 60s:    ~100 bytes × 1440/día ≈ 144KB/día
Alarmas (estimado):         ~10 mensajes/día × 500 bytes ≈ 5KB/día
OTA updates:                ~5MB/actualización × 4/año ≈ 20MB/año
TOTAL estimado:             ~250MB/año por instalación
```

Con 1NCE (500MB/vida útil del dispositivo) es suficiente para 2 años en condiciones normales. Con Simbase (plan mensual) hay margen amplio.

### Seguridad de la conectividad

```
Cifrado:          TLS 1.3 en todas las comunicaciones
Autenticación:    Certificado X.509 único por dispositivo
Rotación de keys: Cada 12 meses via OTA
Firewall:         UFW en el dispositivo:
                    - Entrada: solo puerto SSH (2222) y puerto API local (8080)
                    - Salida: solo MQTT (8883) y HTTPS (443) hacia servidores Australair
                    - Todo lo demás: DENY
VPN fallback:     Túnel WireGuard opcional si MQTT no disponible
```

---

### Lo que MEJORAMOS respecto al original EQTic

```
+ C puro → 10× menos memoria que Java Spring Boot
+ SQLite embebido → sin servidor MySQL
+ SIM IoT Australair → control absoluto, sin dependencia del cliente
+ Dashboard multi-instalación con mapa de España
+ Sistema de alarmas 🔴🟡🟢 con notificaciones push
+ Plymouth splash screen en arranque
+ OTA updates remotos
+ Soporte multi-fabricante de coolers futuro
+ API REST propia más simple y eficiente
+ WebSocket nativo sin STOMP/SockJS
```

---

*Guía Técnica SmartGreen by Australair — Versión 2.1 — Junio 2025*
*Ingeniería inversa completada. Código fuente decompilado con jadx 1.4.7 desde SmartGreenAPI.jar (54MB)*
*Toda la información fue obtenida por análisis del sistema propiedad de la empresa*