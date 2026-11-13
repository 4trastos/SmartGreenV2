import { useLang, saveLang, translate, LANGS, LANG_NAMES } from '../i18n.js'
import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import Keyboard from '../components/Keyboard'

// ─── TEXTOS (seis idiomas). Los huecos {n}, {z}, {m}, {t}, {s}, {a}, {f} se rellenan al usarlos ───
const T = {
  es: {
    imd_title: 'Modo IMD · Evaporativo #{n}', cooler_default: 'Evaporativo', zone_fallback: 'Zona {n}',
    others_one: 'El otro evaporativo de la zona sigue funcionando con normalidad',
    others_many: 'Los otros {n} evaporativos de la zona siguen funcionando con normalidad',
    exit_btn: '✕ Salir IMD',
    exit_on: 'Al salir, el evaporativo volverá a funcionar: {z} está encendida en {m}',
    exit_off: 'Al salir, el evaporativo seguirá parado: {z} está apagada',
    loading_cooler: 'Cargando evaporativo #{n}...',
    broken_title: 'Avería grave activa', broken_hint: 'Revisa el historial de alarmas antes de rearmar.', rearm: 'Rearmar avería',
    comms_title: '⚠ Sin comunicación',
    comms_body: 'La placa no responde. Revise la alimentación y el cable del bus. Si se ha cambiado la placa, configúrela en Config → Placas de control.',
    water_sensor: 'Sensor de agua (salinidad)',
    water_sensor_hint: 'Si hay agua en la cubeta y marca menos de 10 µS, el sensor está averiado',
    fan_speed: 'Velocidad fan', pump: 'Bomba', solenoid: 'Solenoide (entrada de agua)', drain: 'Drenaje',
    open_up: 'ABIERTO', closed_up: 'CERRADO', stop_all: 'Parar todo', stop_btn: '■ Parar',
    global_note: 'Estos parámetros se aplican a TODOS los evaporativos de la instalación.',
    sensors: 'Sensores', interior: 'Interior', exterior: 'Exterior', no_signal: '✘ SIN SEÑAL',
    last_read: 'Última lectura: {t} · errores seguidos: {n}', never: 'nunca', ago_s: 'hace {s} s',
    sensor_notice: 'Revise el sensor y su cable. Desconecte el cable del evaporativo al Modulink durante 4 minutos y vuelva a conectarlo para que el sensor vuelva a funcionar. Si después de esto no funciona, sustituya el sensor.',
    calib_hint: 'Calibración: se aplica al instante. Compare con un termómetro de referencia.',
    offset_t: 'Offset Tª', offset_h: 'Offset Hr',
    offset_err: 'Valor fuera de rango (Tª ±20 °C, Hr ±50 %)', offset_fail: 'No se pudo guardar el offset',
    speed_min: 'Velocidad mín', speed_max: 'Velocidad máx',
    prewet: 'Prewet', pw_solenoid: 'Delay solenoide', pw_water: 'Delay agua', pw_pump: 'Delay bomba', pw_maxwait: 'Máx espera agua',
    safety_drain: 'Drenaje de seguridad (equipo apagado)', water_renew: 'Renovación de agua (equipo encendido)',
    by_time: 'Por tiempo', by_salinity: 'Por salinidad', renew_every: 'Renovar cada', renew_duration: 'Duración renovación',
    sal_trigger: 'Trigger salinidad (µS)', sal_max: 'Máx. drenaje salinidad', safety_empty: 'Vaciado de seguridad',
    dry_title: 'Drenaje y Secado', dry_duration: 'Duración',
    faults: 'Averías', f_comms: 'Sin comunicación → aviso', f_water_detect: 'Sin agua: parará a los:',
    f_water_wait: 'Sin agua parado: espera llenado:', f_sensor: 'Sin señal del sensor → aviso',
    reset_title: 'Reset del sistema', reset_btn: 'Resetear instalación', reset_warn: '⚠ Atención',
    reset_body: 'Se borrará toda la configuración y el sistema volverá al estado inicial. Esta acción no se puede deshacer.',
    cancel: 'Cancelar', reset_do: 'Resetear', resetting: 'Reseteando sistema', wait_please: 'Por favor espere...',
    restart_title: '⚠ Reinicio necesario', saved: 'Cambio guardado',
    restart_body: 'Se aplicará al reiniciar el controlador. Hazlo con el equipo parado.', later: 'Más tarde', restart: 'Reiniciar',
    i_model: 'Modelo', i_fw: 'Firmware', i_board: 'Identificador de placa', i_addr: 'Dirección Modbus', i_comm: 'Comunicación',
    i_no_resp: '⚠ Sin respuesta', i_ok: '✔ Correcta', i_cuts: 'Cortes (últimas 24 h)', i_cuts_val: '{n} de 3',
    i_hb: 'Heartbeat', i_hb_off: 'No admitido por la placa', i_hb_on: 'Activo', i_cold: 'Arranques de la placa',
    i_fan_starts: 'Arranques fan', i_hours: 'Horas funcionamiento', i_drains: 'Drenajes', i_fill: 'Llenado medio',
    i_water: 'Sensor de agua', i_state: 'Estado', i_broken: '🔴 Avería grave', i_normal: '✔ Normal',
    b_title: 'Placas de control', b_search: 'Buscar placas', b_searching: 'Buscando placas... (unos 10 s)',
    b_hint: 'Para sustituir una placa: conecte solo la placa nueva, búsquela y asígnele el cooler que no responde.',
    b_none: 'No se ha encontrado ninguna placa.', b_addr: 'Dirección {a} · fw {f}', b_model: 'modelo',
    b_configured: '✔ Cooler configurado', b_new_assign: '● NUEVA · asignar a', b_assign: 'Asignar', b_assigning: 'Asignando...',
    b_new: '● NUEVA', b_no_missing: 'ningún cooler sin respuesta', b_ok: 'Placa configurada como cooler {n}',
    b_checking: 'Comprobando la placa...',
    b_not_yet: 'Dirección escrita, pero la placa aún no contesta. Quite y vuelva a dar tensión a la placa, y pulse "Buscar placas".',
    b_err_scan: 'Error al buscar placas', b_err_assign: 'Error al asignar la dirección', b_no_ctrl: 'El controlador no responde',
    evap_n: 'Evaporativo #{n}',
  },
  en: {
    imd_title: 'IMD mode · Cooler #{n}', cooler_default: 'Cooler', zone_fallback: 'Zone {n}',
    others_one: 'The other cooler in the zone keeps working normally',
    others_many: 'The other {n} coolers in the zone keep working normally',
    exit_btn: '✕ Exit IMD',
    exit_on: 'On exit, the cooler will run again: {z} is on in {m}',
    exit_off: 'On exit, the cooler will stay stopped: {z} is off',
    loading_cooler: 'Loading cooler #{n}...',
    broken_title: 'Severe fault active', broken_hint: 'Check the alarm history before re-arming.', rearm: 'Re-arm fault',
    comms_title: '⚠ No communication',
    comms_body: 'The board is not responding. Check the power supply and the bus cable. If the board has been replaced, set it up in Config → Control boards.',
    water_sensor: 'Water sensor (salinity)',
    water_sensor_hint: 'If there is water in the tank and it reads below 10 µS, the sensor is faulty',
    fan_speed: 'Fan speed', pump: 'Pump', solenoid: 'Solenoid (water inlet)', drain: 'Drain',
    open_up: 'OPEN', closed_up: 'CLOSED', stop_all: 'Stop all', stop_btn: '■ Stop',
    global_note: 'These parameters apply to ALL coolers in the installation.',
    sensors: 'Sensors', interior: 'Indoor', exterior: 'Outdoor', no_signal: '✘ NO SIGNAL',
    last_read: 'Last reading: {t} · consecutive errors: {n}', never: 'never', ago_s: '{s} s ago',
    sensor_notice: 'Check the sensor and its cable. Disconnect the cable between the cooler and the Modulink for 4 minutes and reconnect it so the sensor works again. If it still does not work after this, replace the sensor.',
    calib_hint: 'Calibration: applied instantly. Compare with a reference thermometer.',
    offset_t: 'Temp. offset', offset_h: 'Hum. offset',
    offset_err: 'Value out of range (temp ±20 °C, hum ±50 %)', offset_fail: 'The offset could not be saved',
    speed_min: 'Min speed', speed_max: 'Max speed',
    prewet: 'Prewet', pw_solenoid: 'Solenoid delay', pw_water: 'Water delay', pw_pump: 'Pump delay', pw_maxwait: 'Max water wait',
    safety_drain: 'Safety drain (unit off)', water_renew: 'Water renewal (unit on)',
    by_time: 'By time', by_salinity: 'By salinity', renew_every: 'Renew every', renew_duration: 'Renewal duration',
    sal_trigger: 'Salinity trigger (µS)', sal_max: 'Max. salinity drain', safety_empty: 'Safety emptying',
    dry_title: 'Drain and drying', dry_duration: 'Duration',
    faults: 'Faults', f_comms: 'No communication → warning', f_water_detect: 'No water: will stop after:',
    f_water_wait: 'Stopped without water: filling wait:', f_sensor: 'No sensor signal → warning',
    reset_title: 'System reset', reset_btn: 'Reset installation', reset_warn: '⚠ Warning',
    reset_body: 'All settings will be erased and the system will return to its initial state. This cannot be undone.',
    cancel: 'Cancel', reset_do: 'Reset', resetting: 'Resetting system', wait_please: 'Please wait...',
    restart_title: '⚠ Restart needed', saved: 'Change saved',
    restart_body: 'It will be applied when the controller restarts. Do it with the unit stopped.', later: 'Later', restart: 'Restart',
    i_model: 'Model', i_fw: 'Firmware', i_board: 'Board identifier', i_addr: 'Modbus address', i_comm: 'Communication',
    i_no_resp: '⚠ No response', i_ok: '✔ OK', i_cuts: 'Cuts (last 24 h)', i_cuts_val: '{n} of 3',
    i_hb: 'Heartbeat', i_hb_off: 'Not supported by the board', i_hb_on: 'Active', i_cold: 'Board starts',
    i_fan_starts: 'Fan starts', i_hours: 'Running hours', i_drains: 'Drains', i_fill: 'Average fill',
    i_water: 'Water sensor', i_state: 'Status', i_broken: '🔴 Severe fault', i_normal: '✔ Normal',
    b_title: 'Control boards', b_search: 'Search boards', b_searching: 'Searching boards... (about 10 s)',
    b_hint: 'To replace a board: connect only the new board, search for it and assign it the cooler that is not responding.',
    b_none: 'No board found.', b_addr: 'Address {a} · fw {f}', b_model: 'model',
    b_configured: '✔ Cooler configured', b_new_assign: '● NEW · assign to', b_assign: 'Assign', b_assigning: 'Assigning...',
    b_new: '● NEW', b_no_missing: 'no cooler without response', b_ok: 'Board set up as cooler {n}',
    b_checking: 'Checking the board...',
    b_not_yet: 'Address written, but the board is not responding yet. Remove and restore power to the board, then press "Search boards".',
    b_err_scan: 'Error searching for boards', b_err_assign: 'Error assigning the address', b_no_ctrl: 'The controller is not responding',
    evap_n: 'Cooler #{n}',
  },
  pt: {
    imd_title: 'Modo IMD · Evaporativo #{n}', cooler_default: 'Evaporativo', zone_fallback: 'Zona {n}',
    others_one: 'O outro evaporativo da zona continua a funcionar com normalidade',
    others_many: 'Os outros {n} evaporativos da zona continuam a funcionar com normalidade',
    exit_btn: '✕ Sair do IMD',
    exit_on: 'Ao sair, o evaporativo voltará a funcionar: {z} está ligada em {m}',
    exit_off: 'Ao sair, o evaporativo continuará parado: {z} está desligada',
    loading_cooler: 'A carregar o evaporativo #{n}...',
    broken_title: 'Avaria grave ativa', broken_hint: 'Consulte o histórico de alarmes antes de rearmar.', rearm: 'Rearmar avaria',
    comms_title: '⚠ Sem comunicação',
    comms_body: 'A placa não responde. Verifique a alimentação e o cabo do barramento. Se a placa foi substituída, configure-a em Config → Placas de controlo.',
    water_sensor: 'Sensor de água (salinidade)',
    water_sensor_hint: 'Se houver água na cuba e indicar menos de 10 µS, o sensor está avariado',
    fan_speed: 'Velocidade do ventilador', pump: 'Bomba', solenoid: 'Solenoide (entrada de água)', drain: 'Drenagem',
    open_up: 'ABERTO', closed_up: 'FECHADO', stop_all: 'Parar tudo', stop_btn: '■ Parar',
    global_note: 'Estes parâmetros aplicam-se a TODOS os evaporativos da instalação.',
    sensors: 'Sensores', interior: 'Interior', exterior: 'Exterior', no_signal: '✘ SEM SINAL',
    last_read: 'Última leitura: {t} · erros seguidos: {n}', never: 'nunca', ago_s: 'há {s} s',
    sensor_notice: 'Verifique o sensor e o seu cabo. Desligue o cabo do evaporativo ao Modulink durante 4 minutos e volte a ligá-lo para que o sensor volte a funcionar. Se depois disto continuar sem funcionar, substitua o sensor.',
    calib_hint: 'Calibração: aplica-se de imediato. Compare com um termómetro de referência.',
    offset_t: 'Offset Tª', offset_h: 'Offset Hr',
    offset_err: 'Valor fora do intervalo (Tª ±20 °C, Hr ±50 %)', offset_fail: 'Não foi possível guardar o offset',
    speed_min: 'Velocidade mín', speed_max: 'Velocidade máx',
    prewet: 'Prewet', pw_solenoid: 'Atraso do solenoide', pw_water: 'Atraso da água', pw_pump: 'Atraso da bomba', pw_maxwait: 'Espera máx. de água',
    safety_drain: 'Drenagem de segurança (equipamento desligado)', water_renew: 'Renovação da água (equipamento ligado)',
    by_time: 'Por tempo', by_salinity: 'Por salinidade', renew_every: 'Renovar a cada', renew_duration: 'Duração da renovação',
    sal_trigger: 'Limiar de salinidade (µS)', sal_max: 'Drenagem máx. por salinidade', safety_empty: 'Esvaziamento de segurança',
    dry_title: 'Drenagem e secagem', dry_duration: 'Duração',
    faults: 'Avarias', f_comms: 'Sem comunicação → aviso', f_water_detect: 'Sem água: parará aos:',
    f_water_wait: 'Parado sem água: espera de enchimento:', f_sensor: 'Sem sinal do sensor → aviso',
    reset_title: 'Reset do sistema', reset_btn: 'Repor a instalação', reset_warn: '⚠ Atenção',
    reset_body: 'Toda a configuração será apagada e o sistema voltará ao estado inicial. Esta ação não pode ser desfeita.',
    cancel: 'Cancelar', reset_do: 'Repor', resetting: 'A repor o sistema', wait_please: 'Aguarde, por favor...',
    restart_title: '⚠ Reinício necessário', saved: 'Alteração guardada',
    restart_body: 'Será aplicada ao reiniciar o controlador. Faça-o com o equipamento parado.', later: 'Mais tarde', restart: 'Reiniciar',
    i_model: 'Modelo', i_fw: 'Firmware', i_board: 'Identificador da placa', i_addr: 'Endereço Modbus', i_comm: 'Comunicação',
    i_no_resp: '⚠ Sem resposta', i_ok: '✔ Correta', i_cuts: 'Cortes (últimas 24 h)', i_cuts_val: '{n} de 3',
    i_hb: 'Heartbeat', i_hb_off: 'Não suportado pela placa', i_hb_on: 'Ativo', i_cold: 'Arranques da placa',
    i_fan_starts: 'Arranques do ventilador', i_hours: 'Horas de funcionamento', i_drains: 'Drenagens', i_fill: 'Enchimento médio',
    i_water: 'Sensor de água', i_state: 'Estado', i_broken: '🔴 Avaria grave', i_normal: '✔ Normal',
    b_title: 'Placas de controlo', b_search: 'Procurar placas', b_searching: 'A procurar placas... (cerca de 10 s)',
    b_hint: 'Para substituir uma placa: ligue apenas a placa nova, procure-a e atribua-lhe o evaporativo que não responde.',
    b_none: 'Não foi encontrada nenhuma placa.', b_addr: 'Endereço {a} · fw {f}', b_model: 'modelo',
    b_configured: '✔ Evaporativo configurado', b_new_assign: '● NOVA · atribuir a', b_assign: 'Atribuir', b_assigning: 'A atribuir...',
    b_new: '● NOVA', b_no_missing: 'nenhum evaporativo sem resposta', b_ok: 'Placa configurada como evaporativo {n}',
    b_checking: 'A verificar a placa...',
    b_not_yet: 'Endereço escrito, mas a placa ainda não responde. Retire e volte a dar tensão à placa e prima "Procurar placas".',
    b_err_scan: 'Erro ao procurar placas', b_err_assign: 'Erro ao atribuir o endereço', b_no_ctrl: 'O controlador não responde',
    evap_n: 'Evaporativo #{n}',
  },
  ca: {
    imd_title: 'Mode IMD · Evaporatiu #{n}', cooler_default: 'Evaporatiu', zone_fallback: 'Zona {n}',
    others_one: 'L\'altre evaporatiu de la zona continua funcionant amb normalitat',
    others_many: 'Els altres {n} evaporatius de la zona continuen funcionant amb normalitat',
    exit_btn: '✕ Sortir de l\'IMD',
    exit_on: 'En sortir, l\'evaporatiu tornarà a funcionar: {z} està encesa en {m}',
    exit_off: 'En sortir, l\'evaporatiu continuarà aturat: {z} està apagada',
    loading_cooler: 'Carregant l\'evaporatiu #{n}...',
    broken_title: 'Avaria greu activa', broken_hint: 'Reviseu l\'historial d\'alarmes abans de rearmar.', rearm: 'Rearmar avaria',
    comms_title: '⚠ Sense comunicació',
    comms_body: 'La placa no respon. Reviseu l\'alimentació i el cable del bus. Si s\'ha canviat la placa, configureu-la a Config → Plaques de control.',
    water_sensor: 'Sensor d\'aigua (salinitat)',
    water_sensor_hint: 'Si hi ha aigua a la cubeta i marca menys de 10 µS, el sensor està avariat',
    fan_speed: 'Velocitat del ventilador', pump: 'Bomba', solenoid: 'Solenoide (entrada d\'aigua)', drain: 'Drenatge',
    open_up: 'OBERT', closed_up: 'TANCAT', stop_all: 'Aturar tot', stop_btn: '■ Aturar',
    global_note: 'Aquests paràmetres s\'apliquen a TOTS els evaporatius de la instal·lació.',
    sensors: 'Sensors', interior: 'Interior', exterior: 'Exterior', no_signal: '✘ SENSE SENYAL',
    last_read: 'Última lectura: {t} · errors seguits: {n}', never: 'mai', ago_s: 'fa {s} s',
    sensor_notice: 'Reviseu el sensor i el seu cable. Desconnecteu el cable de l\'evaporatiu al Modulink durant 4 minuts i torneu-lo a connectar perquè el sensor torni a funcionar. Si després d\'això no funciona, substituïu el sensor.',
    calib_hint: 'Calibratge: s\'aplica a l\'instant. Compareu amb un termòmetre de referència.',
    offset_t: 'Offset Tª', offset_h: 'Offset Hr',
    offset_err: 'Valor fora de rang (Tª ±20 °C, Hr ±50 %)', offset_fail: 'No s\'ha pogut desar l\'offset',
    speed_min: 'Velocitat mín', speed_max: 'Velocitat màx',
    prewet: 'Prewet', pw_solenoid: 'Retard del solenoide', pw_water: 'Retard de l\'aigua', pw_pump: 'Retard de la bomba', pw_maxwait: 'Espera màx. d\'aigua',
    safety_drain: 'Drenatge de seguretat (equip apagat)', water_renew: 'Renovació de l\'aigua (equip encès)',
    by_time: 'Per temps', by_salinity: 'Per salinitat', renew_every: 'Renovar cada', renew_duration: 'Durada de la renovació',
    sal_trigger: 'Llindar de salinitat (µS)', sal_max: 'Drenatge màx. per salinitat', safety_empty: 'Buidat de seguretat',
    dry_title: 'Drenatge i assecat', dry_duration: 'Durada',
    faults: 'Avaries', f_comms: 'Sense comunicació → avís', f_water_detect: 'Sense aigua: s\'aturarà als:',
    f_water_wait: 'Aturat sense aigua: espera d\'ompliment:', f_sensor: 'Sense senyal del sensor → avís',
    reset_title: 'Reset del sistema', reset_btn: 'Restablir la instal·lació', reset_warn: '⚠ Atenció',
    reset_body: 'S\'esborrarà tota la configuració i el sistema tornarà a l\'estat inicial. Aquesta acció no es pot desfer.',
    cancel: 'Cancel·lar', reset_do: 'Restablir', resetting: 'Restablint el sistema', wait_please: 'Espereu, si us plau...',
    restart_title: '⚠ Cal reiniciar', saved: 'Canvi desat',
    restart_body: 'S\'aplicarà en reiniciar el controlador. Feu-ho amb l\'equip aturat.', later: 'Més tard', restart: 'Reiniciar',
    i_model: 'Model', i_fw: 'Firmware', i_board: 'Identificador de placa', i_addr: 'Adreça Modbus', i_comm: 'Comunicació',
    i_no_resp: '⚠ Sense resposta', i_ok: '✔ Correcta', i_cuts: 'Talls (últimes 24 h)', i_cuts_val: '{n} de 3',
    i_hb: 'Heartbeat', i_hb_off: 'No admès per la placa', i_hb_on: 'Actiu', i_cold: 'Arrencades de la placa',
    i_fan_starts: 'Arrencades del ventilador', i_hours: 'Hores de funcionament', i_drains: 'Drenatges', i_fill: 'Ompliment mitjà',
    i_water: 'Sensor d\'aigua', i_state: 'Estat', i_broken: '🔴 Avaria greu', i_normal: '✔ Normal',
    b_title: 'Plaques de control', b_search: 'Cercar plaques', b_searching: 'Cercant plaques... (uns 10 s)',
    b_hint: 'Per substituir una placa: connecteu només la placa nova, cerqueu-la i assigneu-li l\'evaporatiu que no respon.',
    b_none: 'No s\'ha trobat cap placa.', b_addr: 'Adreça {a} · fw {f}', b_model: 'model',
    b_configured: '✔ Evaporatiu configurat', b_new_assign: '● NOVA · assignar a', b_assign: 'Assignar', b_assigning: 'Assignant...',
    b_new: '● NOVA', b_no_missing: 'cap evaporatiu sense resposta', b_ok: 'Placa configurada com a evaporatiu {n}',
    b_checking: 'Comprovant la placa...',
    b_not_yet: 'Adreça escrita, però la placa encara no respon. Traieu i torneu a donar tensió a la placa, i premeu "Cercar plaques".',
    b_err_scan: 'Error en cercar plaques', b_err_assign: 'Error en assignar l\'adreça', b_no_ctrl: 'El controlador no respon',
    evap_n: 'Evaporatiu #{n}',
  },
  fr: {
    imd_title: 'Mode IMD · Évaporatif #{n}', cooler_default: 'Évaporatif', zone_fallback: 'Zone {n}',
    others_one: 'L\'autre évaporatif de la zone continue de fonctionner normalement',
    others_many: 'Les {n} autres évaporatifs de la zone continuent de fonctionner normalement',
    exit_btn: '✕ Quitter l\'IMD',
    exit_on: 'En quittant, l\'évaporatif refonctionnera : {z} est allumée en {m}',
    exit_off: 'En quittant, l\'évaporatif restera à l\'arrêt : {z} est éteinte',
    loading_cooler: 'Chargement de l\'évaporatif #{n}...',
    broken_title: 'Panne grave active', broken_hint: 'Consultez l\'historique des alarmes avant de réarmer.', rearm: 'Réarmer la panne',
    comms_title: '⚠ Pas de communication',
    comms_body: 'La carte ne répond pas. Vérifiez l\'alimentation et le câble du bus. Si la carte a été remplacée, configurez-la dans Config → Cartes de contrôle.',
    water_sensor: 'Capteur d\'eau (salinité)',
    water_sensor_hint: 'S\'il y a de l\'eau dans le bac et qu\'il indique moins de 10 µS, le capteur est défectueux',
    fan_speed: 'Vitesse du ventilateur', pump: 'Pompe', solenoid: 'Électrovanne (arrivée d\'eau)', drain: 'Vidange',
    open_up: 'OUVERT', closed_up: 'FERMÉ', stop_all: 'Tout arrêter', stop_btn: '■ Arrêter',
    global_note: 'Ces paramètres s\'appliquent à TOUS les évaporatifs de l\'installation.',
    sensors: 'Capteurs', interior: 'Intérieur', exterior: 'Extérieur', no_signal: '✘ PAS DE SIGNAL',
    last_read: 'Dernière lecture : {t} · erreurs consécutives : {n}', never: 'jamais', ago_s: 'il y a {s} s',
    sensor_notice: 'Vérifiez le capteur et son câble. Débranchez le câble de l\'évaporatif au Modulink pendant 4 minutes et rebranchez-le pour que le capteur refonctionne. Si après cela il ne fonctionne toujours pas, remplacez le capteur.',
    calib_hint: 'Étalonnage : appliqué immédiatement. Comparez avec un thermomètre de référence.',
    offset_t: 'Décalage Tª', offset_h: 'Décalage Hr',
    offset_err: 'Valeur hors plage (Tª ±20 °C, Hr ±50 %)', offset_fail: 'Impossible d\'enregistrer le décalage',
    speed_min: 'Vitesse min', speed_max: 'Vitesse max',
    prewet: 'Prewet', pw_solenoid: 'Délai électrovanne', pw_water: 'Délai eau', pw_pump: 'Délai pompe', pw_maxwait: 'Attente max. eau',
    safety_drain: 'Vidange de sécurité (appareil éteint)', water_renew: 'Renouvellement de l\'eau (appareil allumé)',
    by_time: 'Par durée', by_salinity: 'Par salinité', renew_every: 'Renouveler toutes les', renew_duration: 'Durée du renouvellement',
    sal_trigger: 'Seuil de salinité (µS)', sal_max: 'Vidange max. par salinité', safety_empty: 'Durée de la vidange de sécurité',
    dry_title: 'Vidange et séchage', dry_duration: 'Durée',
    faults: 'Pannes', f_comms: 'Pas de communication → avertissement', f_water_detect: 'Sans eau : arrêt au bout de :',
    f_water_wait: 'Arrêté sans eau : attente de remplissage :', f_sensor: 'Pas de signal du capteur → avertissement',
    reset_title: 'Réinitialisation du système', reset_btn: 'Réinitialiser l\'installation', reset_warn: '⚠ Attention',
    reset_body: 'Toute la configuration sera effacée et le système reviendra à son état initial. Cette action est irréversible.',
    cancel: 'Annuler', reset_do: 'Réinitialiser', resetting: 'Réinitialisation du système', wait_please: 'Veuillez patienter...',
    restart_title: '⚠ Redémarrage nécessaire', saved: 'Modification enregistrée',
    restart_body: 'Elle sera appliquée au redémarrage du contrôleur. Faites-le avec l\'appareil à l\'arrêt.', later: 'Plus tard', restart: 'Redémarrer',
    i_model: 'Modèle', i_fw: 'Firmware', i_board: 'Identifiant de la carte', i_addr: 'Adresse Modbus', i_comm: 'Communication',
    i_no_resp: '⚠ Sans réponse', i_ok: '✔ Correcte', i_cuts: 'Coupures (dernières 24 h)', i_cuts_val: '{n} sur 3',
    i_hb: 'Heartbeat', i_hb_off: 'Non pris en charge par la carte', i_hb_on: 'Actif', i_cold: 'Démarrages de la carte',
    i_fan_starts: 'Démarrages du ventilateur', i_hours: 'Heures de fonctionnement', i_drains: 'Vidanges', i_fill: 'Remplissage moyen',
    i_water: 'Capteur d\'eau', i_state: 'État', i_broken: '🔴 Panne grave', i_normal: '✔ Normal',
    b_title: 'Cartes de contrôle', b_search: 'Rechercher les cartes', b_searching: 'Recherche des cartes... (environ 10 s)',
    b_hint: 'Pour remplacer une carte : connectez uniquement la nouvelle carte, recherchez-la et attribuez-lui l\'évaporatif qui ne répond pas.',
    b_none: 'Aucune carte trouvée.', b_addr: 'Adresse {a} · fw {f}', b_model: 'modèle',
    b_configured: '✔ Évaporatif configuré', b_new_assign: '● NOUVELLE · attribuer à', b_assign: 'Attribuer', b_assigning: 'Attribution...',
    b_new: '● NOUVELLE', b_no_missing: 'aucun évaporatif sans réponse', b_ok: 'Carte configurée comme évaporatif {n}',
    b_checking: 'Vérification de la carte...',
    b_not_yet: 'Adresse écrite, mais la carte ne répond pas encore. Coupez puis rétablissez l\'alimentation de la carte, puis appuyez sur « Rechercher les cartes ».',
    b_err_scan: 'Erreur lors de la recherche des cartes', b_err_assign: 'Erreur lors de l\'attribution de l\'adresse', b_no_ctrl: 'Le contrôleur ne répond pas',
    evap_n: 'Évaporatif #{n}',
  },
  it: {
    imd_title: 'Modalità IMD · Evaporativo #{n}', cooler_default: 'Evaporativo', zone_fallback: 'Zona {n}',
    others_one: 'L\'altro evaporativo della zona continua a funzionare normalmente',
    others_many: 'Gli altri {n} evaporativi della zona continuano a funzionare normalmente',
    exit_btn: '✕ Esci da IMD',
    exit_on: 'All\'uscita, l\'evaporativo tornerà a funzionare: {z} è accesa in {m}',
    exit_off: 'All\'uscita, l\'evaporativo resterà fermo: {z} è spenta',
    loading_cooler: 'Caricamento dell\'evaporativo #{n}...',
    broken_title: 'Guasto grave attivo', broken_hint: 'Controlla lo storico degli allarmi prima di riarmare.', rearm: 'Riarma guasto',
    comms_title: '⚠ Nessuna comunicazione',
    comms_body: 'La scheda non risponde. Controllare l\'alimentazione e il cavo del bus. Se la scheda è stata sostituita, configurarla in Config → Schede di controllo.',
    water_sensor: 'Sensore dell\'acqua (salinità)',
    water_sensor_hint: 'Se c\'è acqua nella vasca e indica meno di 10 µS, il sensore è guasto',
    fan_speed: 'Velocità ventilatore', pump: 'Pompa', solenoid: 'Solenoide (ingresso acqua)', drain: 'Scarico',
    open_up: 'APERTO', closed_up: 'CHIUSO', stop_all: 'Ferma tutto', stop_btn: '■ Ferma',
    global_note: 'Questi parametri si applicano a TUTTI gli evaporativi dell\'impianto.',
    sensors: 'Sensori', interior: 'Interno', exterior: 'Esterno', no_signal: '✘ NESSUN SEGNALE',
    last_read: 'Ultima lettura: {t} · errori consecutivi: {n}', never: 'mai', ago_s: '{s} s fa',
    sensor_notice: 'Controllare il sensore e il suo cavo. Scollegare il cavo dell\'evaporativo dal Modulink per 4 minuti e ricollegarlo affinché il sensore torni a funzionare. Se dopo questo non funziona, sostituire il sensore.',
    calib_hint: 'Calibrazione: applicata subito. Confrontare con un termometro di riferimento.',
    offset_t: 'Offset Tª', offset_h: 'Offset Um',
    offset_err: 'Valore fuori range (Tª ±20 °C, Um ±50 %)', offset_fail: 'Impossibile salvare l\'offset',
    speed_min: 'Velocità min', speed_max: 'Velocità max',
    prewet: 'Prewet', pw_solenoid: 'Ritardo solenoide', pw_water: 'Ritardo acqua', pw_pump: 'Ritardo pompa', pw_maxwait: 'Attesa max. acqua',
    safety_drain: 'Scarico di sicurezza (apparecchio spento)', water_renew: 'Ricambio dell\'acqua (apparecchio acceso)',
    by_time: 'A tempo', by_salinity: 'Per salinità', renew_every: 'Ricambiare ogni', renew_duration: 'Durata del ricambio',
    sal_trigger: 'Soglia di salinità (µS)', sal_max: 'Scarico max. per salinità', safety_empty: 'Svuotamento di sicurezza',
    dry_title: 'Scarico ed essiccazione', dry_duration: 'Durata',
    faults: 'Guasti', f_comms: 'Nessuna comunicazione → avviso', f_water_detect: 'Senz\'acqua: si fermerà dopo:',
    f_water_wait: 'Fermo senz\'acqua: attesa riempimento:', f_sensor: 'Nessun segnale dal sensore → avviso',
    reset_title: 'Reset del sistema', reset_btn: 'Ripristina l\'impianto', reset_warn: '⚠ Attenzione',
    reset_body: 'Verrà cancellata tutta la configurazione e il sistema tornerà allo stato iniziale. Questa azione non può essere annullata.',
    cancel: 'Annulla', reset_do: 'Ripristina', resetting: 'Ripristino del sistema', wait_please: 'Attendere, prego...',
    restart_title: '⚠ Riavvio necessario', saved: 'Modifica salvata',
    restart_body: 'Verrà applicata al riavvio del controller. Farlo con l\'apparecchio fermo.', later: 'Più tardi', restart: 'Riavvia',
    i_model: 'Modello', i_fw: 'Firmware', i_board: 'Identificativo della scheda', i_addr: 'Indirizzo Modbus', i_comm: 'Comunicazione',
    i_no_resp: '⚠ Nessuna risposta', i_ok: '✔ Corretta', i_cuts: 'Interruzioni (ultime 24 h)', i_cuts_val: '{n} su 3',
    i_hb: 'Heartbeat', i_hb_off: 'Non supportato dalla scheda', i_hb_on: 'Attivo', i_cold: 'Avvii della scheda',
    i_fan_starts: 'Avvii del ventilatore', i_hours: 'Ore di funzionamento', i_drains: 'Scarichi', i_fill: 'Riempimento medio',
    i_water: 'Sensore dell\'acqua', i_state: 'Stato', i_broken: '🔴 Guasto grave', i_normal: '✔ Normale',
    b_title: 'Schede di controllo', b_search: 'Cerca schede', b_searching: 'Ricerca schede... (circa 10 s)',
    b_hint: 'Per sostituire una scheda: collegare solo la scheda nuova, cercarla e assegnarle l\'evaporativo che non risponde.',
    b_none: 'Nessuna scheda trovata.', b_addr: 'Indirizzo {a} · fw {f}', b_model: 'modello',
    b_configured: '✔ Evaporativo configurato', b_new_assign: '● NUOVA · assegna a', b_assign: 'Assegna', b_assigning: 'Assegnazione...',
    b_new: '● NUOVA', b_no_missing: 'nessun evaporativo senza risposta', b_ok: 'Scheda configurata come evaporativo {n}',
    b_checking: 'Verifica della scheda...',
    b_not_yet: 'Indirizzo scritto, ma la scheda non risponde ancora. Togliere e ridare tensione alla scheda, poi premere "Cerca schede".',
    b_err_scan: 'Errore nella ricerca delle schede', b_err_assign: 'Errore nell\'assegnazione dell\'indirizzo', b_no_ctrl: 'Il controller non risponde',
    evap_n: 'Evaporativo #{n}',
  },
}

// Texto de esta pantalla en el idioma activo. t(clave, { n: 2 }) rellena los huecos {n}, {z}...
function useT() {
  const lang = useLang()
  const t = (key, vars) => {
    let s = translate(T, lang, key)
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]))
    return s
  }
  t.lang = lang
  return t
}

// signed: permite números negativos (offsets de calibración). onChange puede devolver false si el valor se rechaza
function ConfigParam({ label, unit, value, onChange, signed = false }) {
  const [showKb, setShowKb] = useState(false)
  const [local, setLocal] = useState(String(value ?? ''))

  useEffect(() => { setLocal(String(value ?? '')) }, [value])

  return (
    <div className="bg-white/4 rounded-xl p-3">
      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <input value={local} readOnly
          onClick={() => setShowKb(true)}
          onTouchStart={e => e.stopPropagation()}
          className="w-full bg-transparent text-white font-bold text-lg cursor-pointer focus:outline-none" />
        {unit && <span className="text-white/30 text-xs">{unit}</span>}
      </div>
      {showKb && (
        <Keyboard value={local} numeric={true} signed={signed}
          onChange={val => setLocal(val)}
          onClose={async () => {
            setShowKb(false)
            if (local !== String(value)) {
              const ok = await onChange(local)
              if (ok === false) setLocal(String(value ?? ''))      // valor rechazado: se vuelve al anterior
            }
          }} />
      )}
    </div>
  )
}

function OptionParam({ label, value, options, onChange }) {
  return (
    <div className="bg-white/4 rounded-xl p-3 col-span-2">
      <p className="text-white/30 text-xs uppercase tracking-wider mb-2">{label}</p>
      <div className="flex gap-1.5">
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all
              ${Number(value) === o.value ? 'bg-[#088fc3] text-white' : 'bg-white/8 text-white/60 hover:bg-white/15'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SelectParam({ label, unit, value, options, onChange }) {
  return (
    <div className="bg-white/4 rounded-xl p-3">
      <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-1">
        <select value={String(value)} onChange={e => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-white font-bold text-lg cursor-pointer focus:outline-none">
          {options.map(o => (
            <option key={o} value={o} className="bg-[#060c12] text-white">{o}</option>
          ))}
        </select>
        {unit && <span className="text-white/30 text-xs">{unit}</span>}
      </div>
    </div>
  )
}

function BoardTool() {
  const t = useT()
  const [scanning, setScanning] = useState(false)
  const [boards, setBoards] = useState(null)
  const [missing, setMissing] = useState([])
  const [target, setTarget] = useState({})          // dirección de la placa → cooler destino
  const [assigning, setAssigning] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState(null)              // { kind: 'ok' | 'info' | 'warn', text }

  const scan = async (keepMsg = false, expectAddr = null) => {
    setScanning(true); setError('')
    if (!keepMsg) setMsg(null)
    try {
      const r = await fetch(`${API_URL}/imd/boards`)
      const d = await r.json()
      if (!r.ok) { setError(d.error || t('b_err_scan')); setBoards(null) }
      else {
        setBoards(d.boards); setMissing(d.missing)
        // Confirmación tras asignar: ¿está ya la placa en su dirección nueva?
        if (expectAddr) {
          if (d.boards.some(b => b.addr === expectAddr && b.configured))
            setMsg({ kind: 'ok', text: `✔ ${t('b_ok', { n: expectAddr })}` })
          else
            setMsg({ kind: 'warn', text: t('b_not_yet') })
        }
      }
    } catch { setError(t('b_no_ctrl')) }
    setScanning(false)
  }

  const assign = async (from) => {
    const to = Number(target[from] ?? missing[0])
    if (!to) return
    setAssigning(from); setError(''); setMsg(null)
    try {
      const r = await fetch(`${API_URL}/imd/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      })
      const d = await r.json()
      if (!r.ok) setError(d.error || t('b_err_assign'))
      else {
        if (d.answering) {
          setBoards(prev => prev.map(b => b.addr === from ? { ...b, addr: to, configured: 1 } : b))
          setMissing(prev => prev.filter(m => m !== to))
          setMsg({ kind: 'ok', text: `✔ ${t('b_ok', { n: to })}` })
        }
        else
          setMsg({ kind: 'info', text: t('b_checking') })
        setTimeout(() => scan(true, to), 3000)      // confirmar con un escaneo real
      }
    } catch { setError(t('b_no_ctrl')) }
    setAssigning(null)
  }

  return (
    <div className="bg-white/4 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/40 text-xs uppercase tracking-wider">{t('b_title')}</p>
        <button onClick={() => scan()} disabled={scanning || assigning !== null}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${scanning ? 'bg-white/5 text-white/30 cursor-wait' : 'bg-[#088fc3]/20 text-[#088fc3] cursor-pointer hover:bg-[#088fc3]/30'}`}>
          {scanning ? t('b_searching') : t('b_search')}
        </button>
      </div>
      <p className="text-white/30 text-xs mb-3">{t('b_hint')}</p>

      {error && <p className="text-red-400 text-sm mb-2">⚠ {error}</p>}
      {msg && <p className={`text-sm mb-2 font-bold ${msg.kind === 'ok' ? 'text-green-400' : msg.kind === 'info' ? 'text-[#088fc3]' : 'text-yellow-400'}`}>{msg.text}</p>}

      {boards && boards.length === 0 && <p className="text-white/40 text-sm">{t('b_none')}</p>}

      <div className="space-y-2">
        {boards?.map(b => (
          <div key={b.addr} className={`rounded-xl p-3 border ${b.configured ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/40'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-bold text-sm">{t('b_addr', { a: b.addr, f: b.fw })}</p>
                <p className="text-white/40 text-xs font-mono">{b.id} · {t('b_model')} {b.model}</p>
              </div>
              {b.configured ? (
                <span className="text-green-400 text-xs font-bold">{t('b_configured')}</span>
              ) : missing.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs font-bold">{t('b_new_assign')}</span>
                  <select value={target[b.addr] ?? missing[0]}
                    onChange={e => setTarget(prev => ({ ...prev, [b.addr]: e.target.value }))}
                    className="bg-[#060c12] text-white text-sm rounded-lg px-2 py-1 border border-white/20">
                    {missing.map(m => <option key={m} value={m}>{t('evap_n', { n: m })}</option>)}
                  </select>
                  <button onClick={() => assign(b.addr)} disabled={assigning !== null}
                    className="px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-sm font-bold cursor-pointer hover:bg-yellow-500/30">
                    {assigning === b.addr ? t('b_assigning') : t('b_assign')}
                  </button>
                </div>
              ) : (
                <span className="text-yellow-400 text-xs font-bold text-right">{t('b_new')}<br/><span className="text-white/40 font-normal">{t('b_no_missing')}</span></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Botón ON/OFF de una salida del evaporativo
function OutButtons({ label, on, onOn, onOff, onLabel = 'ON', offLabel = 'OFF', warn = false }) {
  return (
    <div className="bg-white/4 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/40 text-xs uppercase tracking-wider">{label}</p>
        <span className={`text-xs font-bold ${on ? (warn ? 'text-yellow-400' : 'text-[#088fc3]') : 'text-white/30'}`}>{on ? onLabel : offLabel}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={onOn}
          className={`flex-1 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
            ${on ? (warn ? 'bg-yellow-500/30 text-yellow-300' : 'bg-[#088fc3] text-white') : (warn ? 'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25' : 'bg-[#088fc3]/20 text-[#088fc3] hover:bg-[#088fc3]/30')}`}>
          {onLabel}
        </button>
        <button onClick={onOff}
          className={`flex-1 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
            ${!on ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
          {offLabel}
        </button>
      </div>
    </div>
  )
}

export default function IMD({ data, unitId, onExit }) {
  const t = useT()
  const [section, setSection] = useState('test')
  const [config, setConfig] = useState({})
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetProgress, setResetProgress] = useState(0)
  const [showRestart, setShowRestart] = useState(false)
  const [offsetMsg, setOffsetMsg] = useState('')
  // Salidas del evaporativo en prueba (al entrar en el IMD, todo parado)
  const [out, setOut] = useState({ pump: 0, solenoid: 0, drain: 0, speed: 0 })
  const lang = useLang()

  const cooler = data.coolers.find(c => c.unit_id === unitId)
  const zone = data.zones.find(z => z.zone_id === cooler?.zone_id)
  const zoneOn = zone?.on_off === 'ON'
  const zoneName = zone?.name || t('zone_fallback', { n: cooler?.zone_id ?? '' })
  const others = data.coolers.filter(c => c.zone_id === cooler?.zone_id && c.unit_id !== unitId).length

  // Envía las cuatro salidas juntas: el estado del evaporativo es siempre coherente
  const sendOut = async (changes) => {
    const next = { ...out, ...changes }
    setOut(next)
    await fetch(`${API_URL}/coolers/${unitId}/out`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pump: next.pump, solenoid: next.solenoid, drain: next.drain, speed: next.speed })
    }).catch(() => {})
  }

  const sendCmd = async (endpoint, body) => {
    await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(() => {})
  }

  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then(r => r.json())
      .then(arr => {
        const obj = {}
        arr.forEach(item => { obj[item.key] = item.value })
        setConfig(obj)
      })
      .catch(() => {})
  }, [])

  const saveConfig = async (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setShowRestart(true)
    await fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: parseInt(value) })
    })
  }

  // Calibración de UN sensor: se aplica al instante (sin reiniciar) y se guarda. Devuelve false si se rechaza
  const saveOffset = async (sensorId, field, raw) => {
    const n = parseInt(raw, 10)
    if (Number.isNaN(n)) return false
    setOffsetMsg('')
    try {
      const r = await fetch(`${API_URL}/sensors/${sensorId}/offsets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: n })
      })
      if (!r.ok) { setOffsetMsg(r.status === 400 ? t('offset_err') : t('offset_fail')); return false }
    } catch { setOffsetMsg(t('offset_fail')); return false }
    return true
  }

  const doReset = async () => {
    setShowResetConfirm(false)
    setResetting(true)
    setResetProgress(0)
    await fetch(`${API_URL}/reset`, { method: 'POST' }).catch(() => {})
    for (let i = 1; i <= 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setResetProgress(Math.round((i / 15) * 100))
    }
    setResetting(false)
  }

  const broken  = cooler && Number(cooler.broken_cooler) === 1
  const multiZone = data.zones.length > 1

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-start justify-between shrink-0 gap-4">
        <div className="min-w-0">
          <p className="text-red-400 text-xs font-bold tracking-widest uppercase">{t('imd_title', { n: unitId })}</p>
          <p className="text-white text-2xl font-black">
            {cooler?.model || t('cooler_default')} <span className="text-white/40 text-base font-bold">· {zoneName}</span>
          </p>
          {others > 0 && (
            <p className="text-white/40 text-xs mt-0.5">{others > 1 ? t('others_many', { n: others }) : t('others_one')}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button onClick={onExit}
            className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
            {t('exit_btn')}
          </button>
          <p className={`text-xs text-right max-w-[260px] ${zoneOn ? 'text-yellow-400' : 'text-white/40'}`}>
            {zoneOn
              ? t('exit_on', { z: zoneName, m: zone?.cool_fan_mode })
              : t('exit_off', { z: zoneName })}
          </p>
        </div>
      </div>

      {!cooler ? (
        <div className="flex-1 flex items-center justify-center text-white/40">{t('loading_cooler', { n: unitId })}</div>
      ) : (<>

        {/* AVERÍA — rearme */}
        {broken && (
          <div className="shrink-0 bg-red-500/15 rounded-2xl p-4 border border-red-500/40 flex items-center justify-between gap-3">
            <div>
              <p className="text-red-400 text-xs uppercase tracking-wider font-bold">
                {t('broken_title')}
              </p>
              <p className="text-white/60 text-sm">{t('broken_hint')}</p>
            </div>
            <button onClick={() => sendCmd(`/coolers/${unitId}/rearm`, {})}
              className="shrink-0 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
              {t('rearm')}
            </button>
          </div>
        )}

        {/* SIN COMUNICACIÓN */}
        {Number(cooler.comms_lost) === 1 && !broken && (
          <div className="shrink-0 bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
            <p className="text-red-400 text-xs uppercase tracking-wider font-bold">{t('comms_title')}</p>
            <p className="text-white/60 text-sm">{t('comms_body')}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 shrink-0">
          {[{id:'test',label:'Test'},{id:'config',label:'Config'},{id:'info',label:'Info'}].map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
                ${section === s.id ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* TEST — solo este evaporativo */}
        {section === 'test' && (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">

            {/* Sensor de agua — lectura en directo */}
            <div className="bg-white/4 rounded-2xl p-4 col-span-2 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{t('water_sensor')}</p>
                <p className="text-white/30 text-xs">{t('water_sensor_hint')}</p>
              </div>
              <p className={`font-mono font-black text-2xl ${cooler.salinity_us < 10 ? 'text-red-400' : 'text-[#088fc3]'}`}>
                {Number(cooler.salinity_us).toFixed(0)} <span className="text-sm text-white/40">µS</span>
              </p>
            </div>

            {/* Fan */}
            <div className="bg-white/4 rounded-2xl p-4 col-span-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/40 text-xs uppercase tracking-wider">{t('fan_speed')}</p>
                <span className="text-[#088fc3] font-mono font-black">{out.speed}<span className="text-white/30 text-xs">/10</span></span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 11 }).map((_, i) => (
                  <button key={i} onClick={() => sendOut({ speed: i })}
                    className={`flex-1 h-10 rounded-lg text-xs font-bold cursor-pointer transition-all
                      ${out.speed === i ? 'bg-[#088fc3] text-white' : 'bg-white/8 text-white/60 hover:bg-white/15'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <OutButtons label={t('pump')} on={out.pump === 1}
              onOn={() => sendOut({ pump: 1 })} onOff={() => sendOut({ pump: 0 })} />

            <OutButtons label={t('solenoid')} on={out.solenoid === 1}
              onOn={() => sendOut({ solenoid: 1 })} onOff={() => sendOut({ solenoid: 0 })} />

            <OutButtons label={t('drain')} on={out.drain === 1} warn
              onLabel={t('open_up')} offLabel={t('closed_up')}
              onOn={() => sendOut({ drain: 1 })} onOff={() => sendOut({ drain: 0 })} />

            {/* Parar todo */}
            <div className="bg-white/4 rounded-2xl p-4 flex flex-col justify-between">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{t('stop_all')}</p>
              <button onClick={() => sendOut({ pump: 0, solenoid: 0, drain: 0, speed: 0 })}
                className="w-full py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
                {t('stop_btn')}
              </button>
            </div>
          </div>
        )}

        {/* CONFIG — parámetros técnicos (comunes a toda la instalación) */}
        {section === 'config' && (
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            <p className="text-yellow-400/80 text-xs">{t('global_note')}</p>

            {/* SENSORES */}
            <div className="bg-white/4 rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{t('sensors')}</p>

              {/* Estado y calibración de cada sensor */}
              <div className="space-y-2 mb-3">
                {data.sensors.map(s => {
                  const ago = s.last_read ? Math.round(Date.now() / 1000 - s.last_read) : null
                  const sz = data.zones.find(z => z.zone_id === s.zone_id)
                  return (
                    <div key={s.sensor_id} className={`rounded-xl p-3 border ${s.valid ? 'bg-white/4 border-white/10' : 'bg-red-500/10 border-red-500/40'}`}>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-white font-bold text-sm">
                          {s.type === 'EXT' ? t('exterior') : t('interior')}
                          {s.type !== 'EXT' && multiZone && sz ? ` · ${sz.name}` : ''} · #{s.sensor_id}
                        </span>
                        <span className={`text-xs font-bold ${s.valid ? 'text-green-400' : 'text-red-400'}`}>
                          {s.valid ? `✔ ${s.temperature}°C · ${s.humidity}%` : t('no_signal')}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-1">
                        {t('last_read', { t: ago === null ? t('never') : t('ago_s', { s: ago }), n: s.error_count })}
                      </p>
                      {!s.valid && (
                        <p className="text-red-300 text-xs mt-2">{t('sensor_notice')}</p>
                      )}
                      {/* Offsets de ESTE sensor (calibración) */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <ConfigParam signed label={t('offset_t')} unit="°C" value={s.offset_val}
                          onChange={v => saveOffset(s.sensor_id, 'offset', v)} />
                        <ConfigParam signed label={t('offset_h')} unit="%" value={s.humidity_offset_val}
                          onChange={v => saveOffset(s.sensor_id, 'humidity_offset', v)} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-white/30 text-xs">{t('calib_hint')}</p>
              {offsetMsg && <p className="text-red-400 text-xs mt-2 font-bold">⚠ {offsetMsg}</p>}
            </div>

            {/* FAN */}
            <div className="bg-white/4 rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{t('fan_speed')}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'min_setpoint_fan', label: t('speed_min'), unit: '' },
                  { key: 'max_setpoint_fan', label: t('speed_max'), unit: '' },
                ].map(({ key, label, unit }) => (
                  <ConfigParam key={key} label={label} unit={unit}
                    value={config[key]} onChange={v => saveConfig(key, v)} />
                ))}
              </div>
            </div>

            {/* PREWET */}
            <div className="bg-white/4 rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{t('prewet')}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'prewet_delay_solenoid', label: t('pw_solenoid'), unit: 's' },
                  { key: 'prewet_delay_water',    label: t('pw_water'),    unit: 's' },
                  { key: 'prewet_delay_pump',     label: t('pw_pump'),     unit: 's' },
                  { key: 'prewet_max_wait',       label: t('pw_maxwait'),  unit: 's' },
                ].map(({ key, label, unit }) => (
                  <ConfigParam key={key} label={label} unit={unit}
                    value={config[key]} onChange={v => saveConfig(key, v)} />
                ))}
              </div>
            </div>

            {/* DRENAJE */}
            <div className="bg-white/4 rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{t('drain')}</p>
              <div className="grid grid-cols-2 gap-3">
                <OptionParam label={t('safety_drain')}
                  value={config.drain_safety_hours ?? 72}
                  options={[{label:'72h',value:72},{label:'48h',value:48},{label:'24h',value:24},{label:'4h',value:4}]}
                  onChange={v => saveConfig('drain_safety_hours', v)} />
                <OptionParam label={t('water_renew')}
                  value={config.drain_type ?? 1}
                  options={[{label:t('by_time'),value:1},{label:t('by_salinity'),value:0}]}
                  onChange={v => saveConfig('drain_type', v)} />
                {Number(config.drain_type ?? 1) === 1 ? (
                  <>
                    <OptionParam label={t('renew_every')}
                      value={config.drain_periodic ?? 65}
                      options={[{label:'10h',value:600},{label:'4h',value:240},{label:'2h',value:120},{label:'65m',value:65}]}
                      onChange={v => saveConfig('drain_periodic', v)} />
                    <ConfigParam key="drain_periodic_time" label={t('renew_duration')} unit="s"
                      value={config.drain_periodic_time ?? 30} onChange={v => saveConfig('drain_periodic_time', v)} />
                  </>
                ) : (
                  <>
                    <OptionParam label={t('sal_trigger')}
                      value={config.salinity_trigger ?? 4275}
                      options={[{label:'4275',value:4275},{label:'3620',value:3620},{label:'2960',value:2960},{label:'2305',value:2305}]}
                      onChange={v => saveConfig('salinity_trigger', v)} />
                    <SelectParam label={t('sal_max')} unit="s"
                      value={config.drain_max_time ?? 600}
                      options={[60, 180, 360, 600]}
                      onChange={v => saveConfig('drain_max_time', v)} />
                  </>
                )}
                <SelectParam label={t('safety_empty')} unit="s"
                  value={config.salinity_drain_delay ?? 120}
                  options={[30, 60, 120, 180, 240]}
                  onChange={v => saveConfig('salinity_drain_delay', v)} />
              </div>
            </div>

            {/* DRENAJE Y SECADO */}
            <div className="bg-white/4 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/40 text-xs uppercase tracking-wider">{t('dry_title')}</p>
                <button onClick={() => saveConfig('drain_dry_enabled', config.drain_dry_enabled ? 0 : 1)}
                  className={`relative w-10 h-5 rounded-full transition-all cursor-pointer
                    ${config.drain_dry_enabled ? 'bg-[#088fc3]' : 'bg-white/10'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
                    ${config.drain_dry_enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ConfigParam key="drain_dry_minutes" label={t('dry_duration')} unit="min"
                  value={config.drain_dry_minutes} onChange={v => saveConfig('drain_dry_minutes', v)} />
                <ConfigParam key="drain_dry_speed" label={t('fan_speed')} unit=""
                  value={config.drain_dry_speed} onChange={v => saveConfig('drain_dry_speed', v)} />
              </div>
            </div>

            {/* AVERÍAS */}
            <div className="bg-white/4 rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{t('faults')}</p>
              <div className="grid grid-cols-2 gap-3">
                <SelectParam label={t('f_comms')} unit="s"
                  value={config.comms_lost_seconds ?? 60}
                  options={[30, 60, 120, 300]}
                  onChange={v => saveConfig('comms_lost_seconds', v)} />
                <SelectParam label={t('f_water_detect')} unit="s"
                  value={config.water_detect_seconds ?? 20}
                  options={[10, 20, 30, 60]}
                  onChange={v => saveConfig('water_detect_seconds', v)} />
                <SelectParam label={t('f_water_wait')} unit="s"
                  value={config.no_water_fault_seconds ?? 120}
                  options={[60, 120, 180, 300]}
                  onChange={v => saveConfig('no_water_fault_seconds', v)} />
                <SelectParam label={t('f_sensor')} unit="s"
                  value={config.sensor_lost_seconds ?? 120}
                  options={[60, 90, 120, 180, 300]}
                  onChange={v => saveConfig('sensor_lost_seconds', v)} />
              </div>
            </div>

            {/* IDIOMA */}
            <div className="bg-white/4 rounded-2xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Idioma / Language</p>
              <div className="grid grid-cols-3 gap-2">
                {LANGS.map(l => (
                  <button key={l} onClick={() => saveLang(l).catch(() => {})}
                    className={`py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
                      ${lang === l ? 'bg-[#088fc3] text-white' : 'bg-white/8 text-white/60 hover:bg-white/15'}`}>
                    {LANG_NAMES[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* PLACAS DE CONTROL */}
            <BoardTool />

            {/* RESET */}
            <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
              <p className="text-red-400 text-xs uppercase tracking-wider mb-3">{t('reset_title')}</p>
              <button onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm cursor-pointer hover:bg-red-500/30">
                {t('reset_btn')}
              </button>
            </div>

            {/* Modal advertencia reset */}
            {showResetConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
                <div className="w-[320px] rounded-3xl border border-red-500/40 p-6 bg-[#060c12] shadow-2xl">
                  <p className="text-red-400 text-xs uppercase tracking-wider mb-1 text-center">{t('reset_warn')}</p>
                  <p className="text-white text-xl font-black mb-3 text-center">{t('reset_btn')}</p>
                  <p className="text-white/50 text-sm text-center mb-6">{t('reset_body')}</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold cursor-pointer">
                      {t('cancel')}
                    </button>
                    <button onClick={doReset}
                      className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold cursor-pointer hover:bg-red-500/30">
                      {t('reset_do')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pantalla reseteando */}
            {resetting && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060c12]">
                <div className="relative w-32 h-32 mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff20" strokeWidth="10" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42 * resetProgress / 100} ${2 * Math.PI * 42}`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-black text-2xl">{resetProgress}%</span>
                  </div>
                </div>
                <p className="text-white font-black text-xl mb-2">{t('resetting')}</p>
                <p className="text-white/40 text-sm">{t('wait_please')}</p>
              </div>
            )}

            {/* POP-UP REINICIO */}
            {showRestart && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
                <div className="w-[340px] rounded-3xl border border-yellow-500/40 p-6 bg-[#060c12] shadow-2xl">
                  <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1 text-center">{t('restart_title')}</p>
                  <p className="text-white text-xl font-black mb-3 text-center">{t('saved')}</p>
                  <p className="text-white/50 text-sm text-center mb-6">{t('restart_body')}</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRestart(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold cursor-pointer">
                      {t('later')}
                    </button>
                    <button onClick={async () => {
                        setShowRestart(false)
                        await fetch(`${API_URL}/reboot`, { method: 'POST' }).catch(() => {})
                      }}
                      className="flex-1 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold cursor-pointer hover:bg-yellow-500/30">
                      {t('restart')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INFO — de este evaporativo */}
        {section === 'info' && (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
            {[
              {l: t('i_model'),   v: cooler.model || 'Breezair'},
              {l: t('i_fw'),      v: cooler.firmware ? `v${(cooler.firmware >> 8)}.${cooler.firmware & 0xFF}` : '-'},
              {l: t('i_board'),   v: cooler.board_id || '-'},
              {l: t('i_addr'),    v: `#${cooler.modbus_addr}`},
              {l: t('i_comm'),    v: Number(cooler.comms_lost) ? t('i_no_resp') : t('i_ok')},
              {l: t('i_cuts'),    v: t('i_cuts_val', { n: cooler.comms_events ?? 0 })},
              {l: t('i_hb'),      v: Number(cooler.hb_disabled) ? t('i_hb_off') : t('i_hb_on')},
              {l: t('i_cold'),    v: cooler.cold_starts},
              {l: t('i_fan_starts'), v: cooler.fan_starts},
              {l: t('i_hours'),   v: `${(cooler.hours_running/3600).toFixed(1)}h`},
              {l: t('i_drains'),  v: cooler.tank_drains},
              {l: t('i_fill'),    v: `${cooler.avg_tank_fill}s`},
              {l: t('i_water'),   v: `${Number(cooler.salinity_us).toFixed(0)} µS`},
              {l: t('i_state'),   v: broken ? t('i_broken') : t('i_normal')},
            ].map(({l,v}) => (
              <div key={l} className="bg-white/4 rounded-xl p-4">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{l}</p>
                <p className="text-white font-bold">{v}</p>
              </div>
            ))}
          </div>
        )}
      </>)}
    </div>
  )
}
