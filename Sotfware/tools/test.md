# SmartGreen TEST

## Guía Técnica de Desarrollo

### Versión 1.0

**Proyecto:** SmartGreen Controller
**Módulo:** SmartGreen TEST
**Autor:** David Gallego
**Empresa:** Australair S.L.

---

# 1. Objetivo

SmartGreen TEST es la herramienta oficial de diagnóstico, mantenimiento y puesta en marcha del sistema SmartGreen.

Su finalidad es permitir al Servicio de Asistencia Técnica (SAT) realizar operaciones de verificación, configuración y diagnóstico sobre cualquier instalación SmartGreen sin interferir con el funcionamiento del controlador principal.

La aplicación está diseñada para trabajar directamente sobre el bus Modbus RTU (RS485), permitiendo acceder a todos los dispositivos de la instalación de forma independiente.

---

# 2. Alcance

SmartGreen TEST permitirá:

* Detectar automáticamente todos los dispositivos RS485.
* Leer cualquier registro Modbus.
* Escribir cualquier registro Modbus.
* Ejecutar pruebas sobre actuadores.
* Monitorizar el estado de la instalación en tiempo real.
* Generar informes técnicos.
* Facilitar la puesta en marcha.
* Ayudar en la localización de averías.
* Servir como herramienta de soporte remoto.

---

# 3. Arquitectura General

```
                     Frontend Web
                           │
                    REST / WebSocket
                           │
                 SmartGreen TEST Service
                           │
                     Modbus RTU RS485
                           │
     ┌───────────────┬───────────────┐
     │               │               │
  Cooler 1       Cooler 2       Sensores
```

SmartGreen TEST constituye un servicio independiente del controlador SmartGreen.

Ambas aplicaciones pueden ejecutarse simultáneamente.

---

# 4. Arquitectura Software

```
Software/

tools/

    test_main.c
    test_menu.c
    test_scan.c
    test_read.c
    test_write.c
    test_monitor.c
    test_actuators.c
    test_report.c
    test_utils.c

incl/

    test.h
```

Cada módulo implementa una única responsabilidad funcional.

---

# 5. Principios de Diseño

El desarrollo deberá respetar los siguientes principios:

* Arquitectura modular.
* Funciones reutilizables.
* Separación entre lógica y presentación.
* Acceso centralizado al bus Modbus.
* Independencia respecto a la base de datos SmartGreen.
* Independencia respecto al Scheduler.
* Compatibilidad con ejecución local y remota.
* Registro completo de operaciones realizadas.

---

# 6. Fases de Desarrollo

## Fase 1

### Infraestructura

Objetivos:

* Crear la estructura del proyecto.
* Crear los ficheros fuente.
* Crear el menú principal.
* Definir estructuras comunes.
* Definir cabeceras.

Resultado esperado:

Aplicación compilando correctamente.

---

## Fase 2

### Exploración del Bus RS485

Funciones:

```
test_scan_rs485()
```

Capacidades:

* Buscar Coolers.
* Buscar Sensores.
* Identificar Unit ID.
* Identificar tipo de dispositivo.
* Mostrar resumen de dispositivos encontrados.

Resultado esperado:

Mapa completo del bus RS485.

---

## Fase 3

### Lectura de Dispositivos

Funciones:

```
test_read_cooler()

test_read_sensor()
```

Capacidades:

* Lectura de registros.
* Decodificación de registros.
* Presentación de estados.
* Validación de comunicación.

Resultado esperado:

Visualización completa del estado de cualquier dispositivo.

---

## Fase 4

### Volcado de Registros

Funciones:

```
test_dump_registers()
```

Capacidades:

* Lectura masiva.
* Visualización hexadecimal.
* Visualización decimal.
* Exportación de resultados.

Resultado esperado:

Estado completo del dispositivo.

---

## Fase 5

### Escritura Manual

Funciones:

```
test_write_register()
```

Capacidades:

* Escritura individual.
* Confirmación de escritura.
* Verificación mediante lectura posterior.

Resultado esperado:

Control manual completo del protocolo Modbus.

---

## Fase 6

### Monitorización

Funciones:

```
test_monitor()
```

Actualización continua de:

* Temperatura.
* Humedad.
* Salinidad.
* Nivel de agua.
* Estado de bomba.
* Estado del ventilador.
* Estado del drenaje.
* Estado de electroválvula.
* Alarmas.
* Errores.

Resultado esperado:

Visualización en tiempo real.

---

## Fase 7

### Banco de Pruebas

Funciones:

```
test_pump()

test_fan()

test_solenoid()

test_drain()

test_speed()

test_prewet()
```

Cada prueba actuará exclusivamente sobre un componente.

Objetivo:

Verificar el correcto funcionamiento de cada elemento sin afectar al resto del sistema.

---

## Fase 8

### Diagnóstico Automático

Funciones:

```
test_diagnostic()
```

Comprobaciones:

* Comunicación RS485.
* Alimentación.
* Sensores.
* Cooler.
* Alarmas.
* Fallos.
* Registros inconsistentes.
* Configuración.

Resultado esperado:

Diagnóstico automático de la instalación.

---

## Fase 9

### Generación de Informes

Funciones:

```
test_report()
```

Contenido:

* Fecha.
* Hora.
* Instalación.
* Dispositivos detectados.
* Parámetros.
* Alarmas.
* Resultado de pruebas.
* Observaciones.

Formatos previstos:

* TXT
* PDF (futuro)

---

## Fase 10

### API REST

Exponer todas las funcionalidades mediante API.

Ejemplos:

```
GET /scan

GET /coolers

GET /sensors

GET /monitor

POST /write

POST /pump

POST /fan

POST /diagnostic

GET /report
```

---

## Fase 11

### Frontend Web

El Frontend actuará exclusivamente como interfaz gráfica.

Toda la lógica permanecerá implementada en SmartGreen TEST.

---

# 7. Flujo Operativo

### Instalación

```
systemctl start smartgreen
systemctl start test
```

↓

### SmartGreen

* Control automático.
* Scheduler.
* API.
* Históricos.
* Alarmas.

↓

### SmartGreen TEST

* Diagnóstico.
* Mantenimiento.
* Configuración.
* Pruebas.
* Informes.

↓

### Frontend

Acceso unificado a ambos servicios mediante una única interfaz.

---

# 8. Reglas de Desarrollo

Todo el desarrollo deberá cumplir las siguientes normas:

* Una función implementará una única responsabilidad.
* Todo acceso Modbus se realizará mediante funciones centralizadas.
* Las operaciones críticas deberán verificarse mediante lectura posterior.
* Toda escritura Modbus quedará registrada en un sistema de trazas.
* Las operaciones de diagnóstico no modificarán el estado permanente del controlador salvo autorización explícita del técnico.
* La interfaz de consola y el Frontend utilizarán las mismas funciones internas.
* La documentación técnica deberá mantenerse sincronizada con cada versión del software.

---

# 9. Evolución Prevista

La arquitectura permitirá incorporar nuevos módulos sin modificar el núcleo de la aplicación.

Versiones futuras previstas:

* Asistente de puesta en marcha.
* Actualización remota de firmware.
* Exportación automática de diagnósticos.
* Captura de trazas Modbus.
* Comparación entre configuraciones.
* Simulación de dispositivos Modbus.
* Diagnóstico remoto mediante VPN.
* Integración con el portal de soporte técnico de Australair.

---

Este documento establece la base arquitectónica de **SmartGreen TEST** como una herramienta profesional de diagnóstico industrial, concebida para acompañar al controlador **SmartGreen** durante todo el ciclo de vida de la instalación: puesta en marcha, mantenimiento preventivo, soporte técnico y resolución de incidencias. Su diseño modular garantiza escalabilidad, reutilización del código e integración futura con el Frontend y los servicios remotos de Australair.
