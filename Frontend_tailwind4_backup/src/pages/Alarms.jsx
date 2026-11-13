import { useState, useEffect, useMemo } from 'react'
import { API_URL } from '../config.js'
import Keyboard from '../components/Keyboard'
import PinModal from '../components/PinModal'
import { useLang, translate, LOCALES } from '../i18n.js'
import { getActiveAlarms } from '../alarmLogic.js'

const T = {
  es: {
    crit_title: 'Críticos', crit_sub: 'Acción inmediata', warn_title: 'Avisos', warn_sub: 'Revisar pronto', info_title: 'Informativos', info_sub: 'Sin urgencia',
    history: 'Histórico', no_alarms: 'Sin alarmas activas', all_ok: 'Todos los sistemas funcionan correctamente',
    badge_critical: 'CRÍTICO', badge_warning: 'AVISO', badge_info: 'INFO', badge_ok: 'RECUPERADO',
    since: 'Desde', last_reading: 'Última lectura', s_never: 'Sin ninguna lectura',
    ago_now: 'Hace un momento', ago_min: 'Hace {n} min', ago_h: 'Hace {n} h', ago_d: 'Hace {n} días', today: 'Hoy', yesterday: 'Ayer',
    a_no_modbus: 'Sin comunicación Modbus', a_bus_lost: 'Ningún equipo responde',
    a_broken: 'Evaporativo #{n} parado por avería', a_fault: 'Avería en el evaporativo #{n}', a_comms: 'Evaporativo #{n} sin comunicación',
    a_sensor_lost_int: 'Sensor interior sin señal (#{n})', a_sensor_lost_ext: 'Sensor exterior sin señal (#{n})',
    a_water_stop: 'Evaporativo #{n} sin agua: parado, llenando', a_water_back: 'Evaporativo #{n}: vuelve el agua, mojando paneles',
    a_no_water: 'Sin agua en el evaporativo #{n}', a_salinity: 'Salinidad alta en el evaporativo #{n} ({v} μS)',
    a_temp_int: 'Temperatura fuera de rango en el sensor interior (#{n})', a_temp_ext: 'Temperatura fuera de rango en el sensor exterior (#{n})',
    a_warranty: 'Garantía próxima a vencer (evaporativo #{n})', a_maint_closing: 'Mantenimiento de cierre pendiente (evaporativo #{n})',
    a_maint_opening: 'Mantenimiento de apertura pendiente (evaporativo #{n})',
    h_no_modbus: 'Reinicie el controlador. Si persiste, llame al servicio técnico', h_bus_lost: 'Llame al servicio técnico: puede ser el cable de comunicaciones',
    h_broken: 'Llame al servicio técnico', h_comms: 'Compruebe que el equipo tiene corriente. Si persiste, llame al servicio técnico',
    h_sensor_int: 'El modo AUTO no está disponible hasta que vuelva la señal', h_sensor_ext: 'Si persiste, llame al servicio técnico',
    h_water_stop: 'Compruebe el suministro de agua. Se reanudará solo si el agua vuelve', h_no_water: 'Compruebe el suministro de agua',
    h_salinity: 'Si persiste, avise al servicio técnico', h_temp: 'Compruebe el sensor', h_warranty: 'Consulte con su instalador',
    h_maint: 'Programe la revisión con su instalador',
    hist_kicker: 'Alarmas', f_unit: 'Equipo', f_period: 'Periodo', f_search: 'Buscar...', f_all: 'Todos',
    lv_critical: 'Críticos', lv_warning: 'Avisos', lv_ok: 'Recuperaciones', lv_info: 'Informativos',
    per_24h: 'Últimas 24 h', per_7d: '7 días', per_30d: '30 días', per_all: 'Todo',
    unit_system: 'Sistema', unit_cooler: 'Evaporativo #{n}', unit_sensor: 'Sensor #{n}',
    loading: 'Cargando...', empty: 'Sin alarmas en el historial', empty_filter: 'Ningún registro con estos filtros', clear_filters: 'Quitar filtros',
    show_more: 'Mostrar más ({n} restantes)', entries: 'registros', hist_note: 'Los textos del historial se guardan en español',
  },
  en: {
    crit_title: 'Critical', crit_sub: 'Immediate action', warn_title: 'Warnings', warn_sub: 'Check soon', info_title: 'Information', info_sub: 'No urgency',
    history: 'History', no_alarms: 'No active alarms', all_ok: 'All systems are working correctly',
    badge_critical: 'CRITICAL', badge_warning: 'WARNING', badge_info: 'INFO', badge_ok: 'RECOVERED',
    since: 'Since', last_reading: 'Last reading', s_never: 'No reading yet',
    ago_now: 'Just now', ago_min: '{n} min ago', ago_h: '{n} h ago', ago_d: '{n} days ago', today: 'Today', yesterday: 'Yesterday',
    a_no_modbus: 'No Modbus communication', a_bus_lost: 'No device is responding',
    a_broken: 'Cooler #{n} stopped by a fault', a_fault: 'Fault on cooler #{n}', a_comms: 'Cooler #{n} not communicating',
    a_sensor_lost_int: 'Indoor sensor has no signal (#{n})', a_sensor_lost_ext: 'Outdoor sensor has no signal (#{n})',
    a_water_stop: 'Cooler #{n} has no water: stopped, filling', a_water_back: 'Cooler #{n}: water is back, wetting the pads',
    a_no_water: 'No water in cooler #{n}', a_salinity: 'High salinity in cooler #{n} ({v} μS)',
    a_temp_int: 'Temperature out of range on the indoor sensor (#{n})', a_temp_ext: 'Temperature out of range on the outdoor sensor (#{n})',
    a_warranty: 'Warranty about to expire (cooler #{n})', a_maint_closing: 'Closing maintenance pending (cooler #{n})',
    a_maint_opening: 'Opening maintenance pending (cooler #{n})',
    h_no_modbus: 'Restart the controller. If it persists, call technical service', h_bus_lost: 'Call technical service: it may be the communication cable',
    h_broken: 'Call technical service', h_comms: 'Check that the unit has power. If it persists, call technical service',
    h_sensor_int: 'AUTO mode is not available until the signal returns', h_sensor_ext: 'If it persists, call technical service',
    h_water_stop: 'Check the water supply. It will resume by itself if the water returns', h_no_water: 'Check the water supply',
    h_salinity: 'If it persists, notify technical service', h_temp: 'Check the sensor', h_warranty: 'Contact your installer',
    h_maint: 'Schedule the check with your installer',
    hist_kicker: 'Alarms', f_unit: 'Device', f_period: 'Period', f_search: 'Search...', f_all: 'All',
    lv_critical: 'Critical', lv_warning: 'Warnings', lv_ok: 'Recoveries', lv_info: 'Information',
    per_24h: 'Last 24 h', per_7d: '7 days', per_30d: '30 days', per_all: 'All',
    unit_system: 'System', unit_cooler: 'Cooler #{n}', unit_sensor: 'Sensor #{n}',
    loading: 'Loading...', empty: 'No alarms in the history', empty_filter: 'No entries match these filters', clear_filters: 'Clear filters',
    show_more: 'Show more ({n} remaining)', entries: 'entries', hist_note: 'History messages are stored in Spanish',
  },
  pt: {
    crit_title: 'Críticos', crit_sub: 'Ação imediata', warn_title: 'Avisos', warn_sub: 'Verificar em breve', info_title: 'Informativos', info_sub: 'Sem urgência',
    history: 'Histórico', no_alarms: 'Sem alarmes ativos', all_ok: 'Todos os sistemas funcionam corretamente',
    badge_critical: 'CRÍTICO', badge_warning: 'AVISO', badge_info: 'INFO', badge_ok: 'RECUPERADO',
    since: 'Desde', last_reading: 'Última leitura', s_never: 'Sem nenhuma leitura',
    ago_now: 'Agora mesmo', ago_min: 'Há {n} min', ago_h: 'Há {n} h', ago_d: 'Há {n} dias', today: 'Hoje', yesterday: 'Ontem',
    a_no_modbus: 'Sem comunicação Modbus', a_bus_lost: 'Nenhum equipamento responde',
    a_broken: 'Evaporativo #{n} parado por avaria', a_fault: 'Avaria no evaporativo #{n}', a_comms: 'Evaporativo #{n} sem comunicação',
    a_sensor_lost_int: 'Sensor interior sem sinal (#{n})', a_sensor_lost_ext: 'Sensor exterior sem sinal (#{n})',
    a_water_stop: 'Evaporativo #{n} sem água: parado, a encher', a_water_back: 'Evaporativo #{n}: a água voltou, a molhar os painéis',
    a_no_water: 'Sem água no evaporativo #{n}', a_salinity: 'Salinidade alta no evaporativo #{n} ({v} μS)',
    a_temp_int: 'Temperatura fora do intervalo no sensor interior (#{n})', a_temp_ext: 'Temperatura fora do intervalo no sensor exterior (#{n})',
    a_warranty: 'Garantia perto de expirar (evaporativo #{n})', a_maint_closing: 'Manutenção de fecho pendente (evaporativo #{n})',
    a_maint_opening: 'Manutenção de abertura pendente (evaporativo #{n})',
    h_no_modbus: 'Reinicie o controlador. Se persistir, contacte o serviço técnico', h_bus_lost: 'Contacte o serviço técnico: pode ser o cabo de comunicações',
    h_broken: 'Contacte o serviço técnico', h_comms: 'Verifique se o equipamento tem corrente. Se persistir, contacte o serviço técnico',
    h_sensor_int: 'O modo AUTO não está disponível até o sinal voltar', h_sensor_ext: 'Se persistir, contacte o serviço técnico',
    h_water_stop: 'Verifique o abastecimento de água. Retomará sozinho se a água voltar', h_no_water: 'Verifique o abastecimento de água',
    h_salinity: 'Se persistir, avise o serviço técnico', h_temp: 'Verifique o sensor', h_warranty: 'Consulte o seu instalador',
    h_maint: 'Agende a revisão com o seu instalador',
    hist_kicker: 'Alarmes', f_unit: 'Equipamento', f_period: 'Período', f_search: 'Pesquisar...', f_all: 'Todos',
    lv_critical: 'Críticos', lv_warning: 'Avisos', lv_ok: 'Recuperações', lv_info: 'Informativos',
    per_24h: 'Últimas 24 h', per_7d: '7 dias', per_30d: '30 dias', per_all: 'Tudo',
    unit_system: 'Sistema', unit_cooler: 'Evaporativo #{n}', unit_sensor: 'Sensor #{n}',
    loading: 'A carregar...', empty: 'Sem alarmes no histórico', empty_filter: 'Nenhum registo com estes filtros', clear_filters: 'Limpar filtros',
    show_more: 'Mostrar mais ({n} restantes)', entries: 'registos', hist_note: 'Os textos do histórico são guardados em espanhol',
  },
  ca: {
    crit_title: 'Crítics', crit_sub: 'Acció immediata', warn_title: 'Avisos', warn_sub: 'Revisar aviat', info_title: 'Informatius', info_sub: 'Sense urgència',
    history: 'Històric', no_alarms: 'Sense alarmes actives', all_ok: 'Tots els sistemes funcionen correctament',
    badge_critical: 'CRÍTIC', badge_warning: 'AVÍS', badge_info: 'INFO', badge_ok: 'RECUPERAT',
    since: 'Des de', last_reading: 'Última lectura', s_never: 'Cap lectura',
    ago_now: 'Fa un moment', ago_min: 'Fa {n} min', ago_h: 'Fa {n} h', ago_d: 'Fa {n} dies', today: 'Avui', yesterday: 'Ahir',
    a_no_modbus: 'Sense comunicació Modbus', a_bus_lost: 'Cap equip respon',
    a_broken: 'Evaporatiu #{n} aturat per avaria', a_fault: 'Avaria a l\'evaporatiu #{n}', a_comms: 'Evaporatiu #{n} sense comunicació',
    a_sensor_lost_int: 'Sensor interior sense senyal (#{n})', a_sensor_lost_ext: 'Sensor exterior sense senyal (#{n})',
    a_water_stop: 'Evaporatiu #{n} sense aigua: aturat, omplint', a_water_back: 'Evaporatiu #{n}: torna l\'aigua, mullant panells',
    a_no_water: 'Sense aigua a l\'evaporatiu #{n}', a_salinity: 'Salinitat alta a l\'evaporatiu #{n} ({v} μS)',
    a_temp_int: 'Temperatura fora de rang al sensor interior (#{n})', a_temp_ext: 'Temperatura fora de rang al sensor exterior (#{n})',
    a_warranty: 'Garantia a punt de vèncer (evaporatiu #{n})', a_maint_closing: 'Manteniment de tancament pendent (evaporatiu #{n})',
    a_maint_opening: 'Manteniment d\'obertura pendent (evaporatiu #{n})',
    h_no_modbus: 'Reinicieu el controlador. Si persisteix, truqueu al servei tècnic', h_bus_lost: 'Truqueu al servei tècnic: pot ser el cable de comunicacions',
    h_broken: 'Truqueu al servei tècnic', h_comms: 'Comproveu que l\'equip té corrent. Si persisteix, truqueu al servei tècnic',
    h_sensor_int: 'El mode AUTO no està disponible fins que torni el senyal', h_sensor_ext: 'Si persisteix, truqueu al servei tècnic',
    h_water_stop: 'Comproveu el subministrament d\'aigua. Es reprendrà sol si torna l\'aigua', h_no_water: 'Comproveu el subministrament d\'aigua',
    h_salinity: 'Si persisteix, aviseu el servei tècnic', h_temp: 'Comproveu el sensor', h_warranty: 'Consulteu amb el vostre instal·lador',
    h_maint: 'Programeu la revisió amb el vostre instal·lador',
    hist_kicker: 'Alarmes', f_unit: 'Equip', f_period: 'Període', f_search: 'Cerca...', f_all: 'Tots',
    lv_critical: 'Crítics', lv_warning: 'Avisos', lv_ok: 'Recuperacions', lv_info: 'Informatius',
    per_24h: 'Últimes 24 h', per_7d: '7 dies', per_30d: '30 dies', per_all: 'Tot',
    unit_system: 'Sistema', unit_cooler: 'Evaporatiu #{n}', unit_sensor: 'Sensor #{n}',
    loading: 'Carregant...', empty: 'Sense alarmes a l\'historial', empty_filter: 'Cap registre amb aquests filtres', clear_filters: 'Treure filtres',
    show_more: 'Mostrar-ne més ({n} restants)', entries: 'registres', hist_note: 'Els textos de l\'historial es desen en castellà',
  },
  fr: {
    crit_title: 'Critiques', crit_sub: 'Action immédiate', warn_title: 'Avertissements', warn_sub: 'À vérifier bientôt', info_title: 'Informatifs', info_sub: 'Sans urgence',
    history: 'Historique', no_alarms: 'Aucune alarme active', all_ok: 'Tous les systèmes fonctionnent correctement',
    badge_critical: 'CRITIQUE', badge_warning: 'AVERTISSEMENT', badge_info: 'INFO', badge_ok: 'RÉTABLI',
    since: 'Depuis', last_reading: 'Dernière lecture', s_never: 'Aucune lecture',
    ago_now: 'À l\'instant', ago_min: 'Il y a {n} min', ago_h: 'Il y a {n} h', ago_d: 'Il y a {n} jours', today: 'Aujourd\'hui', yesterday: 'Hier',
    a_no_modbus: 'Pas de communication Modbus', a_bus_lost: 'Aucun équipement ne répond',
    a_broken: 'Évaporatif #{n} arrêté par une panne', a_fault: 'Panne sur l\'évaporatif #{n}', a_comms: 'Évaporatif #{n} sans communication',
    a_sensor_lost_int: 'Capteur intérieur sans signal (#{n})', a_sensor_lost_ext: 'Capteur extérieur sans signal (#{n})',
    a_water_stop: 'Évaporatif #{n} sans eau : arrêté, remplissage', a_water_back: 'Évaporatif #{n} : l\'eau est de retour, mouillage des panneaux',
    a_no_water: 'Pas d\'eau dans l\'évaporatif #{n}', a_salinity: 'Salinité élevée dans l\'évaporatif #{n} ({v} μS)',
    a_temp_int: 'Température hors plage sur le capteur intérieur (#{n})', a_temp_ext: 'Température hors plage sur le capteur extérieur (#{n})',
    a_warranty: 'Garantie bientôt expirée (évaporatif #{n})', a_maint_closing: 'Maintenance de fermeture en attente (évaporatif #{n})',
    a_maint_opening: 'Maintenance d\'ouverture en attente (évaporatif #{n})',
    h_no_modbus: 'Redémarrez le contrôleur. Si le problème persiste, appelez le service technique', h_bus_lost: 'Appelez le service technique : il peut s\'agir du câble de communication',
    h_broken: 'Appelez le service technique', h_comms: 'Vérifiez que l\'équipement est alimenté. Si le problème persiste, appelez le service technique',
    h_sensor_int: 'Le mode AUTO n\'est pas disponible tant que le signal n\'est pas rétabli', h_sensor_ext: 'Si le problème persiste, appelez le service technique',
    h_water_stop: 'Vérifiez l\'alimentation en eau. Il redémarrera tout seul si l\'eau revient', h_no_water: 'Vérifiez l\'alimentation en eau',
    h_salinity: 'Si le problème persiste, prévenez le service technique', h_temp: 'Vérifiez le capteur', h_warranty: 'Consultez votre installateur',
    h_maint: 'Planifiez la révision avec votre installateur',
    hist_kicker: 'Alarmes', f_unit: 'Équipement', f_period: 'Période', f_search: 'Rechercher...', f_all: 'Tous',
    lv_critical: 'Critiques', lv_warning: 'Avertissements', lv_ok: 'Rétablissements', lv_info: 'Informatifs',
    per_24h: 'Dernières 24 h', per_7d: '7 jours', per_30d: '30 jours', per_all: 'Tout',
    unit_system: 'Système', unit_cooler: 'Évaporatif #{n}', unit_sensor: 'Capteur #{n}',
    loading: 'Chargement...', empty: 'Aucune alarme dans l\'historique', empty_filter: 'Aucune entrée avec ces filtres', clear_filters: 'Effacer les filtres',
    show_more: 'Afficher plus ({n} restants)', entries: 'entrées', hist_note: 'Les textes de l\'historique sont enregistrés en espagnol',
  },
  it: {
    crit_title: 'Critici', crit_sub: 'Azione immediata', warn_title: 'Avvisi', warn_sub: 'Da controllare presto', info_title: 'Informativi', info_sub: 'Senza urgenza',
    history: 'Storico', no_alarms: 'Nessun allarme attivo', all_ok: 'Tutti i sistemi funzionano correttamente',
    badge_critical: 'CRITICO', badge_warning: 'AVVISO', badge_info: 'INFO', badge_ok: 'RIPRISTINATO',
    since: 'Da', last_reading: 'Ultima lettura', s_never: 'Nessuna lettura',
    ago_now: 'Poco fa', ago_min: '{n} min fa', ago_h: '{n} h fa', ago_d: '{n} giorni fa', today: 'Oggi', yesterday: 'Ieri',
    a_no_modbus: 'Nessuna comunicazione Modbus', a_bus_lost: 'Nessuna apparecchiatura risponde',
    a_broken: 'Evaporativo #{n} fermo per guasto', a_fault: 'Guasto sull\'evaporativo #{n}', a_comms: 'Evaporativo #{n} senza comunicazione',
    a_sensor_lost_int: 'Sensore interno senza segnale (#{n})', a_sensor_lost_ext: 'Sensore esterno senza segnale (#{n})',
    a_water_stop: 'Evaporativo #{n} senz\'acqua: fermo, riempimento', a_water_back: 'Evaporativo #{n}: l\'acqua è tornata, bagnatura dei pannelli',
    a_no_water: 'Senz\'acqua nell\'evaporativo #{n}', a_salinity: 'Salinità alta nell\'evaporativo #{n} ({v} μS)',
    a_temp_int: 'Temperatura fuori range sul sensore interno (#{n})', a_temp_ext: 'Temperatura fuori range sul sensore esterno (#{n})',
    a_warranty: 'Garanzia in scadenza (evaporativo #{n})', a_maint_closing: 'Manutenzione di chiusura in sospeso (evaporativo #{n})',
    a_maint_opening: 'Manutenzione di apertura in sospeso (evaporativo #{n})',
    h_no_modbus: 'Riavviare il controller. Se persiste, chiamare l\'assistenza tecnica', h_bus_lost: 'Chiamare l\'assistenza tecnica: potrebbe essere il cavo di comunicazione',
    h_broken: 'Chiamare l\'assistenza tecnica', h_comms: 'Verificare che l\'apparecchiatura sia alimentata. Se persiste, chiamare l\'assistenza tecnica',
    h_sensor_int: 'La modalità AUTO non è disponibile finché non torna il segnale', h_sensor_ext: 'Se persiste, chiamare l\'assistenza tecnica',
    h_water_stop: 'Verificare l\'alimentazione idrica. Riprenderà da solo se l\'acqua torna', h_no_water: 'Verificare l\'alimentazione idrica',
    h_salinity: 'Se persiste, avvisare l\'assistenza tecnica', h_temp: 'Verificare il sensore', h_warranty: 'Consultare l\'installatore',
    h_maint: 'Programmare la revisione con l\'installatore',
    hist_kicker: 'Allarmi', f_unit: 'Apparecchiatura', f_period: 'Periodo', f_search: 'Cerca...', f_all: 'Tutti',
    lv_critical: 'Critici', lv_warning: 'Avvisi', lv_ok: 'Ripristini', lv_info: 'Informativi',
    per_24h: 'Ultime 24 h', per_7d: '7 giorni', per_30d: '30 giorni', per_all: 'Tutto',
    unit_system: 'Sistema', unit_cooler: 'Evaporativo #{n}', unit_sensor: 'Sensore #{n}',
    loading: 'Caricamento...', empty: 'Nessun allarme nello storico', empty_filter: 'Nessuna voce con questi filtri', clear_filters: 'Rimuovi filtri',
    show_more: 'Mostra altri ({n} rimanenti)', entries: 'voci', hist_note: 'I testi dello storico sono salvati in spagnolo',
  },
}

// Texto de esta pantalla en el idioma activo. t(clave, { n: 2 }) rellena los huecos {n}, {v}...
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

const LEVEL_STYLES = {
  critical: { bar: 'bg-red-500',    bg: 'bg-red-500/8',    border: 'border-red-500/30',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  warning:  { bar: 'bg-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ok:       { bar: 'bg-green-400',  bg: 'bg-green-500/5',  border: 'border-green-500/25',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  info:     { bar: 'bg-[#088fc3]',  bg: 'bg-[#004d89]/10', border: 'border-[#088fc3]/30',  text: 'text-[#088fc3]',  badge: 'bg-[#088fc3]/20 text-[#088fc3] border-[#088fc3]/30' },
}

// Qué hacer, para el usuario (clave del texto según el código de la alarma)
const HINT = {
  no_modbus: 'h_no_modbus', bus_lost: 'h_bus_lost', broken: 'h_broken', fault: 'h_broken', comms: 'h_comms',
  sensor_lost_int: 'h_sensor_int', sensor_lost_ext: 'h_sensor_ext', water_stop: 'h_water_stop', no_water: 'h_no_water',
  salinity: 'h_salinity', temp_int: 'h_temp', temp_ext: 'h_temp', warranty: 'h_warranty', maint_closing: 'h_maint', maint_opening: 'h_maint',
}

// ── Horas y fechas ──
function ago(t, diff) {
  if (diff < 60) return t('ago_now')
  if (diff < 3600) return t('ago_min', { n: Math.floor(diff / 60) })
  if (diff < 86400) return t('ago_h', { n: Math.floor(diff / 3600) })
  return t('ago_d', { n: Math.floor(diff / 86400) })
}

// Hora si es de hoy; fecha y hora si es de otro día
function fmtWhen(ts, lang, now) {
  const d = new Date(ts * 1000)
  const loc = LOCALES[lang] || 'es-ES'
  if (d.toDateString() === new Date(now * 1000).toDateString())
    return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString(loc, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// "Desde 14:35 · Hace 12 min". Si no se sabe la hora, no se inventa
function whenText(t, alarm, now) {
  if (alarm.since === null || alarm.since === undefined) return null
  const sensor = alarm.code.startsWith('sensor_lost')
  if (sensor && alarm.since === 0) return t('s_never')
  return `${sensor ? t('last_reading') : t('since')} ${fmtWhen(alarm.since, t.lang, now)} · ${ago(t, now - alarm.since)}`
}

// ── Alarmas activas ──
function AlarmRow({ alarm, t, now }) {
  const st = LEVEL_STYLES[alarm.level]
  const hint = HINT[alarm.code]
  const when = whenText(t, alarm, now)
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${st.bg} ${st.border}`}>
      <div className={`w-1 self-stretch rounded-full shrink-0 ${st.bar}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${st.text}`}>{t('a_' + alarm.code, { n: alarm.unit, v: alarm.value })}</p>
        {hint && alarm.level !== 'info' && <p className="text-white/50 text-xs mt-0.5">{t(hint)}</p>}
        {when && <p className="text-white/30 text-xs mt-0.5">{when}</p>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${st.badge}`}>
        {t('badge_' + alarm.level)}
      </span>
    </div>
  )
}

// ── Histórico (solo técnico) ──
// El nivel de cada entrada sale del emoji con el que el backend empieza el texto
function histLevel(msg) {
  if (msg.includes('🔴')) return 'critical'
  if (msg.includes('🟡')) return 'warning'
  if (msg.includes('🟢')) return 'ok'
  return 'info'
}

const cleanMsg = msg => msg.replace(/🔴|🟡|🟢|🔄|🔧/g, '').trim()

// Equipo de la entrada: unit_id si viene, y si no, el que aparezca en el texto (unit_id=2, sensor_id=175)
function unitOf(a) {
  if (a.unit_id !== undefined && a.unit_id !== null) return Number(a.unit_id)
  const m = /(?:unit_id|sensor_id)=(\d+)/.exec(a.message || '')
  return m ? Number(m[1]) : 0
}

const PERIODS = { '24h': 86400, '7d': 7 * 86400, '30d': 30 * 86400, 'all': 0 }
const LEVELS = ['all', 'critical', 'warning', 'ok', 'info']
const PAGE = 100

function HistoryModal({ onClose, t, now, coolerIds }) {
  const [history, setHistory] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [level, setLevel] = useState('all')
  const [unit, setUnit] = useState('all')
  const [period, setPeriod] = useState('all')
  const [query, setQuery] = useState('')
  const [showKb, setShowKb] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const loc = LOCALES[t.lang] || 'es-ES'

  useEffect(() => {
    fetch(`${API_URL}/alarms`)
      .then(r => r.json())
      .then(d => { setHistory(Array.isArray(d) ? d : []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  // Cada vez que cambia un filtro, se vuelve a empezar por las primeras entradas
  useEffect(() => { setLimit(PAGE) }, [level, unit, period, query])

  const entries = useMemo(() => history.map(a => ({
    id: a.id, ts: a.timestamp, level: histLevel(a.message || ''), unit: unitOf(a), text: cleanMsg(a.message || ''),
  })).sort((x, y) => y.ts - x.ts || y.id - x.id), [history])

  const unitLabel = id =>
    id === 0 ? t('unit_system') : coolerIds.includes(id) || id < 100 ? t('unit_cooler', { n: id }) : t('unit_sensor', { n: id })

  const units = useMemo(() => [...new Set(entries.map(e => e.unit))].sort((a, b) => a - b), [entries])

  // Filtros de periodo, equipo y texto; el nivel se aplica después para poder contar cada nivel
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    const since = PERIODS[period] ? now - PERIODS[period] : 0
    return entries.filter(e =>
      (!since || e.ts >= since) &&
      (unit === 'all' || e.unit === Number(unit)) &&
      (!q || e.text.toLowerCase().includes(q)))
  }, [entries, period, unit, query, now])

  const counts = useMemo(() => {
    const c = { all: base.length, critical: 0, warning: 0, ok: 0, info: 0 }
    base.forEach(e => { c[e.level]++ })
    return c
  }, [base])

  const filtered = level === 'all' ? base : base.filter(e => e.level === level)
  const visible = filtered.slice(0, limit)
  const filtersOn = level !== 'all' || unit !== 'all' || period !== 'all' || query !== ''

  // Agrupado por día
  const groups = []
  let cur = null
  for (const e of visible) {
    const key = new Date(e.ts * 1000).toDateString()
    if (!cur || cur.key !== key) { cur = { key, ts: e.ts, items: [] }; groups.push(cur) }
    cur.items.push(e)
  }
  const dayLabel = g =>
    g.key === new Date(now * 1000).toDateString() ? t('today')
      : g.key === new Date((now - 86400) * 1000).toDateString() ? t('yesterday')
        : new Date(g.ts * 1000).toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const selectCls = 'bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#088fc3]/60'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-[700px] max-w-[96vw] max-h-[92vh] rounded-3xl border border-white/10 p-5 bg-[#060c12] shadow-2xl flex flex-col">

        <div className="flex justify-between items-center mb-3 shrink-0">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-0.5">{t('hist_kicker')}</p>
            <p className="text-white text-xl font-black">{t('history')}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        {/* Filtros */}
        <div className="shrink-0 space-y-2 mb-3">
          <div className="flex gap-1.5 overflow-x-auto">
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all
                  ${level === l ? 'bg-[#088fc3] text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                {l === 'all' ? t('f_all') : t('lv_' + l)} <span className="opacity-60">{counts[l]}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <select value={unit} onChange={e => setUnit(e.target.value)} className={selectCls} style={{ backgroundColor: '#0d1a26' }} aria-label={t('f_unit')}>
              <option value="all" style={{ backgroundColor: '#0d1a26' }}>{t('f_unit')}: {t('f_all')}</option>
              {units.map(u => <option key={u} value={u} style={{ backgroundColor: '#0d1a26' }}>{unitLabel(u)}</option>)}
            </select>
            <select value={period} onChange={e => setPeriod(e.target.value)} className={selectCls} style={{ backgroundColor: '#0d1a26' }} aria-label={t('f_period')}>
              {Object.keys(PERIODS).map(p => <option key={p} value={p} style={{ backgroundColor: '#0d1a26' }}>{t('per_' + p)}</option>)}
            </select>
            <input value={query} readOnly placeholder={t('f_search')}
              onClick={e => { e.stopPropagation(); setShowKb(true) }}
              onTouchStart={e => e.stopPropagation()}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-white/25 focus:outline-none cursor-pointer" />
            {filtersOn && (
              <button onClick={() => { setLevel('all'); setUnit('all'); setPeriod('all'); setQuery('') }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-xs font-bold cursor-pointer hover:bg-white/10">
                {t('clear_filters')}
              </button>
            )}
          </div>
          {showKb && <Keyboard value={query} onChange={setQuery} onClose={() => setShowKb(false)} />}
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 min-h-[120px] space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {!loaded && <p className="text-white/30 text-center py-8">{t('loading')}</p>}
          {loaded && history.length === 0 && <p className="text-white/30 text-center py-8">{t('empty')}</p>}
          {loaded && history.length > 0 && filtered.length === 0 && <p className="text-white/30 text-center py-8">{t('empty_filter')}</p>}
          {groups.map(g => (
            <div key={g.key}>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1.5 sticky top-0 bg-[#060c12] py-1">{dayLabel(g)}</p>
              <div className="space-y-1.5">
                {g.items.map(e => {
                  const st = LEVEL_STYLES[e.level]
                  return (
                    <div key={e.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${st.bg} ${st.border}`}>
                      <div className={`w-1 self-stretch rounded-full shrink-0 ${st.bar}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${st.text}`}>{e.text}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {new Date(e.ts * 1000).toLocaleTimeString(loc)} · {unitLabel(e.unit)}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${st.badge}`}>{t('badge_' + e.level)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {filtered.length > visible.length && (
            <button onClick={() => setLimit(l => l + PAGE)}
              className="w-full py-2 rounded-xl bg-white/5 text-white/50 text-sm font-bold cursor-pointer hover:bg-white/10">
              {t('show_more', { n: filtered.length - visible.length })}
            </button>
          )}
        </div>

        <p className="text-white/20 text-xs text-center mt-3 shrink-0">{filtered.length} {t('entries')} · {t('hist_note')}</p>
      </div>
    </div>
  )
}

export default function Alarms({ data }) {
  const t = useT()
  const [pinOpen, setPinOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const now = data.status?.now || Math.floor(Date.now() / 1000)       // hora del servidor (si no llega, la del navegador)
  const activeAlarms = getActiveAlarms(data)
  const count = lvl => activeAlarms.filter(a => a.level === lvl).length
  const critCount = count('critical')
  const warnCount = count('warning')
  const infoCount = count('info')

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">
      {/* Contadores y acceso al histórico */}
      <div className="flex gap-2 shrink-0">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1 min-w-0
          ${critCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/3 border-white/8'}`}>
          <span className={`text-3xl font-black font-mono ${critCount > 0 ? 'text-red-400' : 'text-white/20'}`}>{critCount}</span>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider truncate ${critCount > 0 ? 'text-red-400' : 'text-white/20'}`}>{t('crit_title')}</p>
            <p className="text-white/20 text-xs truncate">{t('crit_sub')}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1 min-w-0
          ${warnCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/3 border-white/8'}`}>
          <span className={`text-3xl font-black font-mono ${warnCount > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{warnCount}</span>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider truncate ${warnCount > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{t('warn_title')}</p>
            <p className="text-white/20 text-xs truncate">{t('warn_sub')}</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1 min-w-0
          ${infoCount > 0 ? 'bg-[#004d89]/15 border-[#088fc3]/30' : 'bg-white/3 border-white/8'}`}>
          <span className={`text-3xl font-black font-mono ${infoCount > 0 ? 'text-[#088fc3]' : 'text-white/20'}`}>{infoCount}</span>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider truncate ${infoCount > 0 ? 'text-[#088fc3]' : 'text-white/20'}`}>{t('info_title')}</p>
            <p className="text-white/20 text-xs truncate">{t('info_sub')}</p>
          </div>
        </div>

        <button onClick={() => setPinOpen(true)}
          className="px-4 py-3 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/8 cursor-pointer transition-all flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-white/40">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
          </svg>
          <span className="text-white/40 text-sm font-bold">{t('history')}</span>
        </button>
      </div>

      {/* Lista de alarmas activas */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeAlarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-4xl mb-3">🟢</p>
            <p className="text-white/30 font-bold">{t('no_alarms')}</p>
            <p className="text-white/15 text-sm mt-1">{t('all_ok')}</p>
          </div>
        ) : (
          activeAlarms.map(alarm => <AlarmRow key={alarm.id} alarm={alarm} t={t} now={now} />)
        )}
      </div>

      {/* El histórico es del técnico: pide el PIN */}
      {pinOpen && (
        <PinModal title={t('history')}
          onSuccess={() => { setPinOpen(false); setShowHistory(true) }}
          onCancel={() => setPinOpen(false)} />
      )}
      {showHistory && (
        <HistoryModal t={t} now={now} coolerIds={(data.coolers || []).map(c => c.unit_id)} onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}
