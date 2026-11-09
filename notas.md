1. SETUP (2 coolers 1 zona idioma:cat ): Error de deteccion de agua, solo tiene que vaciar el cooler que no detecta el agua. Ahora vacia todos anque los demás hayan detectado agua. Salvo por eso todo el SETUP OK:

pi@raspberrypi:~$ sudo journalctl -u smartgreen-app -f | grep -E "DRAIN|SETUP|PREWET"
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP] Zona 1 nombre: ALMACEN
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP COOLERS] Evaporativo 1 (direccion 2) -> zona 1
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP COOLERS] Evaporativo 2 (direccion 3) -> zona 1
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP SENSORS] Recibidos datos: {"sensors":[{"unit_id":175,"role":"INT"},{"unit_id":177,"role":"EXT"}]}
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP SENSORS] Sensor 175: INT zona 1
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP SENSORS] Sensor 177: EXT zona 1
Nov 05 12:10:23 raspberrypi smartgreen[654]: [SETUP] Purga lanzada en la zona 1
Nov 05 12:10:23 raspberrypi smartgreen[654]: PREWET TEST THREAD ARRANCADO zone_id=1
Nov 05 12:10:25 raspberrypi smartgreen[654]: ESTADO Cooler (unit=2) comenzando: [PREWET]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:10:25 raspberrypi smartgreen[654]: ESTADO Cooler (unit=3) comenzando: [PREWET]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:10:25 raspberrypi smartgreen[654]: PREWET paso 1: cerrar solenoide + drain + fan 0 (addr=50 val=16)
Nov 05 12:10:25 raspberrypi smartgreen[654]: PREWET esperando 9s antes de abrir solenoide...
Nov 05 12:10:34 raspberrypi smartgreen[654]: PREWET paso 2: abrir solenoide (addr=50 val=24)
Nov 05 12:11:04 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=0 salinity_us=0.0 (limite 90s)
Nov 05 12:11:04 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=0 salinity_us=0.0 (limite 90s)
Nov 05 12:11:04 raspberrypi smartgreen[654]: PREWET agua: elapsed=30 all_water=0
Nov 05 12:11:35 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=1 salinity_us=13.2 (limite 90s)
Nov 05 12:11:35 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=0 salinity_us=0.0 (limite 90s)
Nov 05 12:11:35 raspberrypi smartgreen[654]: PREWET agua: elapsed=60 all_water=0
Nov 05 12:12:05 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=1 salinity_us=122.4 (limite 90s)
Nov 05 12:12:05 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=0 salinity_us=0.0 (limite 90s)
Nov 05 12:12:05 raspberrypi smartgreen[654]: PREWET agua: elapsed=90 all_water=0
Nov 05 12:12:05 raspberrypi smartgreen[654]: [SETUP] Prueba de agua FALLIDA cooler unit_id=3: no llega agua en 90s
Nov 05 12:12:05 raspberrypi smartgreen[654]: PREWET abortado: no llega agua en 90s
Nov 05 12:12:05 raspberrypi smartgreen[654]: PREWET TEST completado — apagando cooler
Nov 05 12:12:05 raspberrypi smartgreen[654]: PREWET SETUP — drenando agua sucia
Nov 05 12:13:35 raspberrypi smartgreen[654]: PREWET SETUP — agua sucia drenada
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP] Zona 1 nombre: ALMACEN
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP COOLERS] Evaporativo 1 (direccion 2) -> zona 1
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP COOLERS] Evaporativo 2 (direccion 3) -> zona 1
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP SENSORS] Recibidos datos: {"sensors":[{"unit_id":175,"role":"INT"},{"unit_id":177,"role":"EXT"}]}
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP SENSORS] Sensor 175: INT zona 1
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP SENSORS] Sensor 177: EXT zona 1
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP] Esperas de agua cooler unit_id=3: prewet=120 run=0 (0 = global)
Nov 05 12:14:07 raspberrypi smartgreen[654]: [SETUP] Purga lanzada en la zona 1
Nov 05 12:14:07 raspberrypi smartgreen[654]: PREWET TEST THREAD ARRANCADO zone_id=1
Nov 05 12:14:09 raspberrypi smartgreen[654]: ESTADO Cooler (unit=2) comenzando: [PREWET]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:14:09 raspberrypi smartgreen[654]: ESTADO Cooler (unit=3) comenzando: [PREWET]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:14:09 raspberrypi smartgreen[654]: PREWET paso 1: cerrar solenoide + drain + fan 0 (addr=50 val=16)
Nov 05 12:14:09 raspberrypi smartgreen[654]: PREWET esperando 9s antes de abrir solenoide...
Nov 05 12:14:18 raspberrypi smartgreen[654]: PREWET paso 2: abrir solenoide (addr=50 val=24)
Nov 05 12:14:48 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=0 salinity_us=0.0 (limite 90s)
Nov 05 12:14:48 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=0 salinity_us=0.0 (limite 120s)
Nov 05 12:14:48 raspberrypi smartgreen[654]: PREWET agua: elapsed=30 all_water=0
Nov 05 12:15:19 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=1 salinity_us=53.4 (limite 90s)
Nov 05 12:15:19 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=0 salinity_us=0.0 (limite 120s)
Nov 05 12:15:19 raspberrypi smartgreen[654]: PREWET agua: elapsed=60 all_water=0
Nov 05 12:15:49 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=1 salinity_us=122.4 (limite 90s)
Nov 05 12:15:49 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=1 salinity_us=13.2 (limite 120s)
Nov 05 12:15:49 raspberrypi smartgreen[654]: PREWET agua: elapsed=90 all_water=1
Nov 05 12:15:49 raspberrypi smartgreen[654]: PREWET paso 4: agua detectada, esperando 30s...
Nov 05 12:16:19 raspberrypi smartgreen[654]: PREWET paso 5: encender bomba
Nov 05 12:16:19 raspberrypi smartgreen[654]: PREWET esperando 120s con bomba encendida...
Nov 05 12:18:19 raspberrypi smartgreen[654]: PREWET completado
Nov 05 12:18:19 raspberrypi smartgreen[654]: PREWET GUARDADO last_prewet=1793877499
Nov 05 12:18:19 raspberrypi smartgreen[654]: ESTADO Cooler (unit=2) después de [PREWET completado]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:18:19 raspberrypi smartgreen[654]: ESTADO Cooler (unit=3) después de [PREWET completado]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:18:19 raspberrypi smartgreen[654]: PREWET TEST completado — apagando cooler
Nov 05 12:18:19 raspberrypi smartgreen[654]: PREWET SETUP — drenando agua sucia
Nov 05 12:19:49 raspberrypi smartgreen[654]: PREWET SETUP — agua sucia drenada
Nov 05 12:19:55 raspberrypi smartgreen[654]: [SETUP] Zona 1 nombre: ALMACEN
Nov 05 12:19:55 raspberrypi smartgreen[654]: [SETUP COOLERS] Evaporativo 1 (direccion 2) -> zona 1
Nov 05 12:19:55 raspberrypi smartgreen[654]: [SETUP COOLERS] Evaporativo 2 (direccion 3) -> zona 1
Nov 05 12:19:55 raspberrypi smartgreen[654]: [SETUP SENSORS] Recibidos datos: {"sensors":[{"unit_id":175,"role":"INT"},{"unit_id":177,"role":"EXT"}]}
Nov 05 12:19:55 raspberrypi smartgreen[654]: [SETUP SENSORS] Sensor 175: INT zona 1
Nov 05 12:19:55 raspberrypi smartgreen[654]: [SETUP SENSORS] Sensor 177: EXT zona 1


pi@raspberrypi:~$ sqlite3 /var/lib/smartgreen/smartgreen.db "SELECT value FROM config WHERE key='language';"
3
pi@raspberrypi:~$ 



2. PREWET (2 coolers 1 zona idioma:cat cambio a idioma:es ) con uno de ellos con la alarma compensada desde la instalación:

pi@raspberrypi:~$ sqlite3 /var/lib/smartgreen/smartgreen.db "SELECT value FROM config WHERE key='language';"
0
pi@raspberrypi:~$ 

pi@raspberrypi:~$ sudo journalctl -u smartgreen-app -f | grep -E "DRAIN|PREWET|ALARM"
Nov 05 12:24:34 raspberrypi smartgreen[654]: PREWET THREAD ARRANCADO zone_id=1 zone_idx=0
Nov 05 12:24:34 raspberrypi smartgreen[654]: PREWET iniciando cooler_prewet...
Nov 05 12:24:36 raspberrypi smartgreen[654]: ESTADO Cooler (unit=2) comenzando: [PREWET]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:24:36 raspberrypi smartgreen[654]: ESTADO Cooler (unit=3) comenzando: [PREWET]: pump=0 fan=0 cool=0 speed=0
Nov 05 12:24:36 raspberrypi smartgreen[654]: PREWET paso 1: cerrar solenoide + drain + fan 0 (addr=50 val=16)
Nov 05 12:24:36 raspberrypi smartgreen[654]: PREWET esperando 9s antes de abrir solenoide...
Nov 05 12:24:45 raspberrypi smartgreen[654]: PREWET paso 2: abrir solenoide (addr=50 val=24)
Nov 05 12:25:15 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=4 salinity_us=0.0 (limite 90s)
Nov 05 12:25:15 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=7 salinity_us=0.0 (limite 120s)
Nov 05 12:25:15 raspberrypi smartgreen[654]: PREWET agua: elapsed=30 all_water=0
Nov 05 12:25:45 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=4 salinity_us=108.4 (limite 90s)
Nov 05 12:25:45 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=7 salinity_us=0.0 (limite 120s)
Nov 05 12:25:45 raspberrypi smartgreen[654]: PREWET agua: elapsed=60 all_water=0
Nov 05 12:26:15 raspberrypi smartgreen[654]: PREWET agua cooler unit=2 water_present=4 salinity_us=122.4 (limite 90s)
Nov 05 12:26:15 raspberrypi smartgreen[654]: PREWET agua cooler unit=3 water_present=7 salinity_us=26.5 (limite 120s)
Nov 05 12:26:15 raspberrypi smartgreen[654]: PREWET agua: elapsed=90 all_water=1
Nov 05 12:26:15 raspberrypi smartgreen[654]: PREWET paso 4: agua detectada, esperando 30s...
Nov 05 12:26:45 raspberrypi smartgreen[654]: PREWET paso 5: encender bomba
Nov 05 12:26:45 raspberrypi smartgreen[654]: PREWET esperando 120s con bomba encendida...
Nov 05 12:28:45 raspberrypi smartgreen[654]: PREWET completado
Nov 05 12:28:45 raspberrypi smartgreen[654]: PREWET GUARDADO last_prewet=1793878125
Nov 05 12:28:45 raspberrypi smartgreen[654]: ESTADO Cooler (unit=2) después de [PREWET completado]: pump=1 fan=0 cool=1 speed=0
Nov 05 12:28:45 raspberrypi smartgreen[654]: ESTADO Cooler (unit=3) después de [PREWET completado]: pump=1 fan=0 cool=1 speed=0
Nov 05 12:28:45 raspberrypi smartgreen[654]: PREWET finalizado
^C

3. IMD (test) TBS580: 
    - las pruebas de solenoide y bomba. no mantienen la orden. hacen On y off (dura un instante, pero lo hace).
    - Cuando pulso una velocida del ventilador abre y cierra solenoide (dura un instante, pero lo hace) y pone en marcha el fan.
    - Cuando salgo de IMB abre y cierra el solenoide. (dura un instante, pero lo hace)
    - dreaje: OK
    IMD (test) ICON 220:
    - las pruebas de solenoide y bomba. SI mantienen la orden. ON las enciende y OFF las apaga.
    - Ventilador OK. (hace una cosa que tienen que hacer siempre: da un golpe de aire para abrir trampillas - cosa que no hacen en funcionamiento normal. esto es porue si arranca al 1, no tienen fuerza para abrirlas).
    - Cuando salgo de IMB no hace nada. OK
    - drenaje OK

4. PARAR COOLERS INDEPENDIENTEMENTE:
    - OK

5. SCHEDULER:
    - OK

6. DRAIN SALINITI:
    - OK

pi@raspberrypi:~$ sudo journalctl -u smartgreen-app -f | grep -E "DRAIN|SALINITY|PREWET|ALARM|ERROR|SENSOR"
Nov 05 13:03:15 raspberrypi smartgreen[605]: PREWET THREAD NO ARRANCA [Ya está humedo] zone_id=1 zone_idx=0
Nov 05 13:03:52 raspberrypi smartgreen[605]: DRAIN THREAD ARRANCADO unit_id=3 reason=0
Nov 05 13:03:52 raspberrypi smartgreen[605]: DRAIN SALINITY: abrir drain speed=2
Nov 05 13:03:57 raspberrypi smartgreen[605]: DRAIN SALINITY: 5s sal=6619.0 objetivo<=4075.0
Nov 05 13:04:02 raspberrypi smartgreen[605]: DRAIN SALINITY: 10s sal=6619.0 objetivo<=4075.0
Nov 05 13:04:07 raspberrypi smartgreen[605]: DRAIN SALINITY: 15s sal=6619.0 objetivo<=4075.0
Nov 05 13:04:12 raspberrypi smartgreen[605]: DRAIN SALINITY: 20s sal=6619.0 objetivo<=4075.0
Nov 05 13:04:17 raspberrypi smartgreen[605]: DRAIN SALINITY: 25s sal=6619.0 objetivo<=4075.0
Nov 05 13:04:22 raspberrypi smartgreen[605]: DRAIN SALINITY: 30s sal=0.0 objetivo<=4075.0
Nov 05 13:04:22 raspberrypi smartgreen[605]: DRAIN SALINITY completado

7. DRAIN POR TIEMPO:
    - OK    de las demás veces

8. ERROR COMUNICACIÓN:
    - Apago un cooler estando en marcha: OK

9. OPCIÓN DE DRENAR TODOS LOS EQIUPOS A LA VEZ (nueva funcioanlidad para incluir):
    - Para los cierres de campaña. boton de vaciado de todos los eqiupos a la vez. lo vemos desde el panel de mantenimiento y desde IMD lo vemos juntos como hacerlo.

10. NUEVA FUNCIONALIDAD POCA PRESIÓN DE AGUA:
    - opciones de arrancado por zonas o por equipos. 
    - Ejemplo. cada vez que se enciende un equipo que el siguiente espere X tiempo antes de arrancar la bomba para esperar a que no se queden sin presión.
    - Creo que esto ya lo estamos soucionando con la instalacion, Ya memorizamos ek tiempo de prewet de detecccion de agua en cada cooler. por lo tanto no deberia de dar ese error nucan mas. 

11. NUEVA FUNCIONALIDAD:
    - Instalar electrovalvula para drenar las tuberias de agua de la instalación. 
    - Cuando se realiza el cierre de la campañ ade invierno, los coolers se pasan a modo "hibernación". Se vacian todas las cubetas, se cambian pieza o no, se cuvbren los eqiupos (sin el cliente lo ha contratado) y se vacina las tuberías del suministro de agua para qye no se congelen en invierno.
    - Mi jefe quiere instañlar una electrovalvula que abra, vacie y cierre. La tenemos que conectar al modulink y de ahi al connect como un periferico mas.
    - No creo que la instalación nos suponga muicho trabajo porque no tenemos que interpretar nmada. ¿no crres? solo abir y cerrar. si lleva un detector de agua la electrovalvula mejor. ¿que se te ocurre?



