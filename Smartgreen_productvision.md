# SmartGreen by Australair — Visión del Producto
## Document de Producto, Arquitectura y Modelo de Negocio

**Versión:** 1.0  
**Fecha:** Junio 2025  
**Confidencial — Uso interno Australair**

---

## Índice

1. [Visión general del producto](#1-visión-general-del-producto)
2. [Principio fundamental — Control absoluto](#2-principio-fundamental--control-absoluto)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Conectividad — SIM IoT por defecto](#4-conectividad--sim-iot-por-defecto)
5. [Las tres interfaces del sistema](#5-las-tres-interfaces-del-sistema)
6. [Sistema de alarmas](#6-sistema-de-alarmas)
7. [Datos monitorizados](#7-datos-monitorizados)
8. [Modelos de servicio al cliente](#8-modelos-de-servicio-al-cliente)
9. [Hoja de ruta del producto](#9-hoja-de-ruta-del-producto)

---

## 1. Visión general del producto

SmartGreen by Australair es una plataforma de monitorización y control industrial de máquinas evaporativas. Se compone de:

- Un **dispositivo embebido** instalado en cada cliente que controla los coolers evaporativos via protocolo Modbus RTU/RS485.
- Un **servidor central de Australair** que agrega datos de todas las instalaciones, gestiona alarmas y ofrece acceso remoto.
- Un **portal web para el cliente** (opcional, según plan contratado) donde puede ver el estado de su instalación.
- Un **dashboard interno de Australair** con mapa de España y acceso total a todas las instalaciones.

El producto se vende al cliente como un sistema de control y monitorización de sus máquinas. Australair mantiene en todo momento el control absoluto de la infraestructura, independientemente de si el cliente contrata o no servicios adicionales.

---

## 2. Principio fundamental — Control absoluto

**Australair tiene control total sobre todas las instalaciones SmartGreen en todo momento.**

Esto se garantiza mediante:

- **Conectividad IoT propia** — cada SmartGreen lleva una SIM IoT gestionada por Australair. El cliente no tiene acceso a esta SIM ni puede desconectarla. El coste lo asume Australair como inversión estratégica.
- **Comunicación cifrada** — toda la comunicación entre el dispositivo y el servidor de Australair va cifrada (TLS/HTTPS o MQTT con TLS). El cliente no puede interceptarla.
- **Acceso remoto garantizado** — Australair puede acceder a cualquier instalación en cualquier momento para diagnóstico, configuración y soporte, sin depender del cliente.
- **Firmware actualizable remotamente (OTA)** — Australair puede actualizar el software de cualquier dispositivo sin desplazamiento físico.
- **Sin dependencia del cliente** — el sistema funciona aunque el cliente apague su WiFi, cambie su router o no coopere. La SIM IoT es el canal primario.

### Jerarquía de acceso

```
NIVEL 1 — Australair (acceso total)
  ✅ Ver todas las instalaciones
  ✅ Control remoto de cualquier máquina
  ✅ Configurar cualquier parámetro
  ✅ Ver logs completos y raw Modbus
  ✅ Actualizar firmware remotamente
  ✅ Activar/desactivar instalación

NIVEL 2 — Cliente con plan Premium
  ✅ Ver su instalación
  ✅ Control básico (encender/apagar zonas, setpoint temperatura)
  ✅ Ver histórico y alarmas
  ✅ Descargar informes
  ❌ No puede acceder a configuración Modbus
  ❌ No puede ver otras instalaciones
  ❌ No puede desactivar la monitorización de Australair

NIVEL 3 — Cliente sin plan (solo hardware)
  ✅ Control local via pantalla táctil en la instalación
  ❌ Sin acceso web ni remoto
  ❌ Australair sigue monitorizando en background
```

---

## 3. Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      INSTALACIÓN CLIENTE                        │
│                                                                 │
│  Coolers Coolair ──RS485──► SmartGreen Box                      │
│  Sensores Temp/Hum ─────────────┤                               │
│                           │     │                               │
│                    Pantalla táctil                              │
│                    (control local)                              │
│                           │                                     │
│                    SIM IoT Australair                           │
│                    (siempre activa)                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS / MQTT TLS
                            │ (cifrado, siempre activo)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    SERVIDOR AUSTRALAIR                          │
│                                                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐   │
│  │  API Central │  │  PostgreSQL   │  │  Motor de Alarmas   │   │
│  │  REST + MQTT │  │  (time-series)│  │  🔴 🟡 🟢            │   │
│  └──────────────┘  └───────────────┘  └─────────────────────┘   │ 
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              DASHBOARD INTERNO AUSTRALAIR                │   │
│  │                                                          │   │
│  │  🗺️ Mapa España — todas las instalaciones                │   │
│  │  🔴🟡🟢 Estado en tiempo real por instalación             │   │
│  │  📊 Acceso completo a datos, logs y control remoto        │   │
│  │  🔧 Gestión de configuración y firmware OTA               │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────-┐
              │     PORTAL CLIENTE          │
              │     (solo si contrata)      │
              │                             │
              │  📱 Web + móvil             │
              │  Su instalación únicamente  │
              │  Alarmas + histórico        │
              │  Control básico             │
              └────────────────────────────-┘
```

---

## 4. Conectividad — SIM IoT por defecto

**Decisión estratégica: todas las instalaciones llevan SIM IoT gestionada por Australair.**

El cliente no decide. El coste lo asume Australair. El beneficio es el control absoluto.

### Por qué SIM IoT y no WiFi del cliente

| Criterio | WiFi cliente | SIM IoT Australair |
|---|---|---|
| Control de Australair | ❌ Cliente puede desconectar | ✅ Siempre activa |
| Dependencia del cliente | ❌ Alta | ✅ Ninguna |
| Coste | Sin coste de datos | ~5-10€/mes |
| Cobertura | Donde haya WiFi | España completa |
| Fiabilidad industrial | Variable | Alta |
| Actualizaciones OTA | Solo si hay WiFi | Siempre |

### Tecnología recomendada: LTE-M

LTE-M es el punto óptimo para este caso de uso:
- Suficiente velocidad para telemetría y control (no necesitamos más)
- Consumo de batería reducido (útil si hay backup)
- Cobertura excelente en España (Movistar, Vodafone, Orange, Yoigo)
- Preparado para 5G futuro
- Precio muy competitivo en tarjetas M2M industriales

### Proveedores recomendados (evaluar)

| Proveedor | Tecnología | Precio orientativo | Ventaja |
|---|---|---|---|
| 1NCE | LTE-M / NB-IoT | ~10€ pago único + 500MB/vida | Sin cuota mensual |
| Simbase | 4G/LTE-M | ~2-5€/mes | Multioperador España |
| Onomondo | LTE-M / NB-IoT | Variable | Plataforma de gestión |
| Matooma | 4G / LTE-M | Variable | 5M líneas en España |

**Recomendación inicial:** evaluar 1NCE para instalaciones con bajo volumen de datos (telemetría básica) y Simbase para instalaciones con más tráfico.

### Canal de conectividad secundario (failover)

La SIM IoT es el canal primario. Si el cliente tiene WiFi estable, se puede usar como canal secundario para mayor velocidad (descarga de histórico, actualizaciones grandes). El sistema detecta automáticamente el mejor canal disponible.

```
Prioridad de conexión:
1. SIM IoT Australair (siempre activa, canal de control)
2. WiFi cliente (si disponible, canal de datos masivos)
3. Ethernet cliente (si disponible)
```

---

## 5. Las tres interfaces del sistema

### 5.1 Pantalla táctil local (en la instalación)

Siempre presente. No requiere internet para funcionar en modo local.

**Vista principal (operador):**
```
┌─────────────────────────────────────────────┐
│  SmartGreen          🟢 Sistema ON  14:32    │
├─────────────────────────────────────────────┤
│  ZONA 1              ZONA 2                 │
│  🌡️ 24.5°C           🌡️ 23.8°C               │
│  💧 65% HR           💧 68% HR               │
│  💨 Fan: 3/10        💨 Fan: 3/10            │
│  [ON/OFF]  [CONFIG]  [ON/OFF]  [CONFIG]     │ 
├─────────────────────────────────────────────┤
│  COOLERS                                    │
│  C2 🟢  C3 🟢  C4 🟢  C5 🟢  C6 🟢            │
│  Salinidad: 391ppm / 711uS                  │
├─────────────────────────────────────────────┤
│  🔴 0 alarmas críticas  🟡 0 avisos          │
└─────────────────────────────────────────────┘
```

**Vista técnica (mantenimiento — PIN requerido):**
- Registros Modbus en tiempo real por cooler
- Histórico de fallos y fault codes
- Configuración de parámetros (setpoints, salinidad, prewet)
- Wizard de instalación de nuevos coolers/sensores
- Logs del sistema
- Estado de conectividad SIM

---

### 5.2 Dashboard interno Australair (web)

Acceso exclusivo del equipo de Australair.

**Mapa de España:**
```
┌─────────────────────────────────────────────────┐
│  SmartGreen Fleet — Australair           🔍 [+] │
├─────────────────────────────────────────────────┤
│                                                 │
│        🟢 Madrid (Calders)                      │
│              🔴 Barcelona                       │
│        🟡 Valencia                              │
│                    🟢 Sevilla                   │
│                                                 │
├─────────────────────────────────────────────────┤
│  Total: 4 instalaciones                         │
│  🟢 2 OK  🟡 1 Aviso  🔴 1 Crítica               │
│  [Ver todas]  [Alarmas activas]  [Informes]     │
└─────────────────────────────────────────────────┘
```

**Por instalación (click en el mapa):**
- Todos los datos en tiempo real
- Control remoto completo (igual que pantalla táctil + más)
- Histórico sin límite de tiempo
- Logs raw Modbus
- Configuración completa de parámetros
- Estado de conectividad (SIM, WiFi, última conexión)
- Gestión de firmware (versión actual, actualizar OTA)
- Historial de intervenciones y mantenimientos

**Gestión de alarmas:**
- Cola de alarmas activas de todas las instalaciones
- Asignación a técnico
- Registro de resolución
- Estadísticas de MTTR (tiempo medio de resolución)

---

### 5.3 Portal web cliente (opcional — según plan)

Solo visible para clientes con plan Monitorizado o Premium.

**Dashboard cliente:**
```
┌─────────────────────────────────────────────────┐
│  Mi Instalación — Edificio Calders      🟢 OK   │
├─────────────────────────────────────────────────┤
│  Temperatura actual    Humedad actual           │
│       24.5°C               65%                  │
│  ──────────────────────────────────────────     │
│  📈 Últimas 24 horas                            │
│  [gráfica temperatura y humedad]                │
├─────────────────────────────────────────────────┤
│  Estado coolers     Consumo agua (estimado)     │
│  5/5 operativos     127L esta semana            │
├─────────────────────────────────────────────────┤
│  Alarmas recientes                              │
│  🟢 Sin alarmas activas                         │
│  [Ver histórico alarmas]  [Descargar informe]   │
└─────────────────────────────────────────────────┘
```

**Control básico (cliente):**
- Encender/apagar zonas
- Ajustar temperatura objetivo
- Ajustar velocidad ventilador
- Programar horario on/off

**Lo que el cliente NO puede hacer:**
- Acceder a parámetros Modbus
- Desactivar la monitorización de Australair
- Ver datos de otras instalaciones
- Modificar configuración avanzada del sistema

---

## 6. Sistema de alarmas

### 🔴 Roja — Crítica (notificación inmediata)

Requiere intervención urgente. Australair es notificado automáticamente.

| Condición | Descripción |
|---|---|
| Cooler sin comunicación > 30 min | Posible avería hardware |
| Fault code activo no resuelto | Fallo interno del cooler |
| Temperatura > máximo configurado | Riesgo para la instalación |
| Salinidad > límite crítico sin drenaje | Riesgo de daño en coolers |
| Sistema OFF sin programación | Parada no planificada |
| Sin conexión Pi > 1 hora | Dispositivo inaccesible |
| Todos los coolers de una zona con error | Zona completamente inoperativa |

### 🟡 Amarilla — Aviso (revisión en 24-48h)

Situación anómala que requiere seguimiento pero no es urgente.

| Condición | Descripción |
|---|---|
| Error de comunicación recuperado | Inestabilidad en el bus RS485 |
| Salinidad > 80% del límite | Acercándose al trigger de drenaje |
| Temperatura > 90% del máximo | Acercándose al límite |
| Error count > 5 en cualquier cooler | Cooler con problemas recurrentes |
| Sin datos de sensor > 15 min | Posible fallo de sensor |
| Prewet fallido | El sistema de pre-mojado no funcionó correctamente |
| Tiempo de llenado de tanque anormal | Posible problema de agua |

### 🟢 Verde — Todo correcto (estado por defecto)

Sin alarmas activas. Sistema funcionando dentro de parámetros normales.

### Canales de notificación de alarmas

| Tipo | 🔴 Roja | 🟡 Amarilla | 🟢 Verde |
|---|---|---|---|
| Dashboard Australair | ✅ Inmediato | ✅ Inmediato | ✅ |
| Email Australair | ✅ Inmediato | ✅ Resumen diario | ❌ |
| SMS/WhatsApp técnico | ✅ Inmediato | ❌ | ❌ |
| Email cliente (Premium) | ✅ Inmediato | ✅ Resumen diario | ❌ |
| SMS cliente (Premium) | ✅ Inmediato | ❌ | ❌ |

---

## 7. Datos monitorizados

### Por instalación

| Dato | Fuente | Frecuencia |
|---|---|---|
| Temperatura interior | Sensor Modbus (reg 40301) | Cada 30s |
| Humedad interior | Sensor Modbus (reg 40302) | Cada 30s |
| Temperatura exterior | Sensor EXT (reg 40301) | Cada 30s |
| Humedad exterior | Sensor EXT (reg 40302) | Cada 30s |
| Estado general ON/OFF | BD local | Tiempo real |
| Modo de operación | BD local | Tiempo real |

### Por cooler

| Dato | Fuente | Frecuencia |
|---|---|---|
| Velocidad ventilador actual | Reg 40051 (bits 8-11) | Cada 30s |
| Modo cool/fan | Reg 40050 (bit 1) | Cada 30s |
| Ventilador ON/OFF | Reg 40050 (bit 2) | Cada 30s |
| Válvula entrada abierta | Reg 40050 (bit 4) | Cada 30s |
| Válvula drenaje abierta | Reg 40050 (bit 0) | Cada 30s |
| Presencia de agua | Calculado desde uS | Cada 30s |
| Salinidad PPM | Fórmula cúbica desde reg 40054 | Cada 30s |
| Salinidad uS | Fórmula cúbica desde reg 40055 | Cada 30s |
| Fault present | Reg 40050 (bit 3) | Cada 30s |
| Fault code | Reg 40051 (bits 12-15) | Cada 30s |
| Error count | Contador interno | Cada ciclo |
| Horas funcionamiento ventilador | Reg 40029 | Cada 30min |
| Nº arranques ventilador | Reg 40028 | Cada 30min |
| Nº drenajes realizados | Reg 40032 | Cada 30min |
| Nº arranques en frío | Reg 40027 | Cada 30min |

### Métricas calculadas (KPIs para cliente)

| KPI | Cómo se calcula |
|---|---|
| Consumo de agua estimado | Nº drenajes × volumen tanque |
| Tiempo de operación | Horas ventilador ON |
| Eficiencia energética | Temperatura conseguida vs setpoint |
| Disponibilidad (%) | Tiempo ON / tiempo total × 100 |
| Eventos de mantenimiento | Fault codes + drenajes por salinidad |

---

## 8. Modelos de servicio al cliente

### Plan Básico — incluido en el hardware

```
✅ SmartGreen Box instalado
✅ Control local via pantalla táctil
✅ Monitorización interna por Australair (siempre, sin coste para cliente)
✅ SIM IoT incluida (gestionada por Australair)
❌ Sin portal web para el cliente
❌ Sin notificaciones al cliente
❌ Sin informes automáticos
```

### Plan Monitorizado — cuota mensual

```
Todo el Plan Básico +
✅ Portal web cliente (web + móvil)
✅ Alertas email en alarmas rojas
✅ Resumen semanal por email
✅ Histórico 12 meses
✅ Informe mensual PDF
✅ Soporte técnico remoto prioritario
```

### Plan Premium — cuota mensual mayor

```
Todo el Plan Monitorizado +
✅ Alertas SMS/WhatsApp en alarmas rojas
✅ Histórico ilimitado
✅ Mantenimiento preventivo programado (visita anual)
✅ SLA garantizado: respuesta < 4h en alarmas rojas
✅ API para integración con sistemas del cliente (ERP, BMS)
✅ Informes personalizados
✅ Dashboard personalizado con logo del cliente
```

---

## 9. Hoja de ruta del producto

### Fase 1 — MVP (meses 1-3)
```
□ SmartGreen Box funcionando en C/C++
□ Comunicación Modbus con coolers Coolair CPMD
□ Pantalla táctil local básica
□ SIM IoT integrada y conectando al servidor
□ Servidor central básico (API + BD)
□ Dashboard Australair v1 (lista de instalaciones + estado)
□ Sistema de alarmas básico (email interno)
□ Instalación Calders como piloto
```

### Fase 2 — Portal cliente (meses 3-5)
```
□ Portal web cliente responsive
□ Gráficas históricas temperatura/humedad
□ Notificaciones email al cliente
□ Informes PDF mensuales automáticos
□ Mapa España en dashboard Australair
□ Sistema de alarmas completo (🔴🟡🟢)
```

### Fase 3 — Producto completo (meses 5-8)
```
□ OTA updates remotos
□ App móvil cliente (iOS + Android)
□ API pública para clientes Premium
□ Dashboard personalizable por cliente
□ KPIs y métricas avanzadas
□ Integración con sistemas BMS/ERP del cliente
□ Multi-instalación por cliente
```

### Fase 4 — Escala (meses 8+)
```
□ Soporte para otros fabricantes de coolers (no solo Coolair)
□ Soporte para otros protocolos (BACnet, Modbus TCP, MQTT nativo)
□ Marketplace de integraciones
□ IA predictiva (detección de fallos antes de que ocurran)
□ Expansión internacional
```

---

## Decisiones técnicas clave

| Decisión | Elección | Motivo |
|---|---|---|
| Lenguaje dispositivo | C/C++ | Máximo rendimiento, mínimos recursos |
| Protocolo campo | Modbus RTU RS485 | Estándar industrial, ya probado |
| Conectividad | SIM IoT LTE-M (siempre) + WiFi (opcional) | Control absoluto Australair |
| Protocolo nube | MQTT TLS + HTTPS REST | Eficiente para IoT, seguro |
| BD dispositivo | SQLite | Embebido, sin servidor |
| BD servidor | PostgreSQL + TimescaleDB | Optimizado para series temporales |
| Frontend | React + WebSocket | Tiempo real, moderno |
| Servidor | Node.js o Go | Ligero, alta concurrencia |
| Hosting | Cloud (AWS/Azure) con réplica | Alta disponibilidad |

---

*Documento de producto SmartGreen by Australair — Junio 2025*
*Confidencial — Uso interno*