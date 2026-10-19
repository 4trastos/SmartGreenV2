**Arranque (requisito de aceptación)**
- Logotipo del cliente visible de forma continua desde el encendido hasta la aplicación, sin pantallas negras, blancas ni texto.
- El logo lo muestra el bootloader (por ejemplo U-Boot) en el primer segundo, y el fabricante lo configura en su BSP o da la herramienta para cambiarlo.
- Demostración en vídeo o con una muestra, con vuestro logo, antes de comprar.
- Tiempo de arranque orientativo: logo en menos de 2 s y aplicación en menos de 20–25 s.

**Sistema y software**
- Linux soportado por el fabricante (Debian, Ubuntu, Yocto o Buildroot). Preguntad cuál.
- Que incluya o permita instalar libmodbus, sqlite, libmicrohttpd y libwebsockets.
- Navegador en modo kiosko soportado (Chromium sobre Wayland, WPE/Cog o Qt WebEngine), arrancando con fondo oscuro a una URL local.

**Procesador y memoria**
- Procesador ARM de cuatro núcleos o más, de gama media actual, con programa de larga disponibilidad del fabricante del chip de 10 años o más. Preguntad qué procesador es y hasta qué año se fabrica.
- 4 GB de RAM.
- eMMC de 32 GB de grado industrial (modo pSLC o con resistencia a escrituras indicada), sin microSD.

**Comunicaciones**
- RS-485 nativo (no USB), aislado galvánicamente, con control automático de dirección y terminación de 120 Ω activable.
- Conector RJ12 6P6C para el RS-485, con el patillaje del cable del Breezair.
- 4G LTE (Cat 1 basta) con zócalo nano-SIM interno para tarjetas IoT, antena interna y conector interno u.FL/IPEX para antena externa opcional.
- WiFi de 2,4 y 5 GHz, con antena interna y conector para antena externa opcional.
- Bluetooth.
- Ethernet, aunque sea interno, para puesta en marcha y mantenimiento.

**Hardware**
- Sin USB visibles, pero con un USB o USB-C interno para grabar o recuperar el sistema.
- Reloj RTC con pila sustituible.
- Watchdog por hardware.
- Sin ventilador.
- Alimentación de 12–24 V DC.
- Temperatura de funcionamiento de al menos -10 a 60 °C.
- Material de la carcasa trasera indicado, para valorar la cobertura de la antena interna.

**Pantalla**
- 10,1" con resolución 1280×800 (16:10), táctil capacitiva y buen brillo.
- Frontend: adaptar de 800×480 a 1280×800 escalando el tamaño de letra base y ajustando detalles.

**Montaje**
- Empotrado en panel o puerta de cuadro, con garras de sujeción, junta y frontal IP65.
- Superficie de pared, con soporte o caja trasera del fabricante, e índice de protección del conjunto indicado.
- Empotrado en pared, con caja de empotrar del fabricante y el fondo indicado.
- Soporte VESA (75 o 100 mm).
- Conexiones (RJ12 y alimentación) accesibles por detrás o por abajo en cualquier montaje.
- Fondo del equipo lo más plano posible, con el dato incluyendo los soportes.

**Vida útil y actualizaciones (10 años)**
- Soporte del kernel Linux oficial (mainline) para el procesador y la GPU, para poder actualizar aunque el fabricante del panel deje de sacar versiones.
- Actualizaciones de seguridad del sistema garantizadas durante un periodo definido. Preguntad cuántos años.
- Actualización remota segura por 4G o WiFi, con dos particiones (A/B) y vuelta atrás automática si falla (RAUC, SWUpdate o Mender).
- Disponibilidad del producto y de repuestos durante 10 años.

**Proveedor**
- Certificación CE.
- Soporte técnico para el BSP (logo de arranque, puerto serie, pantalla).

**Validación antes de comprar en volumen**
- Unidad de muestra en la que comprobar:
  - Que SmartGreen compila y funciona.
  - Que el ciclo de control va cada segundo y que las órdenes llegan al cooler al momento.
  - Que el Modbus funciona con el Breezair, incluida la pausa de 150 ms, sin timeouts.
  - Que el frontend se ve bien en su navegador: tamaños, colores y logo.
  - Que el arranque cumple el requisito del logo continuo.
  - Que una actualización remota funciona y que la vuelta atrás funciona.
- Fijar las versiones de librerías (libmodbus, libwebsockets, sqlite...) y probar en la muestra cada actualización del sistema antes de enviarla a los equipos instalados.