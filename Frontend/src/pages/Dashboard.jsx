import { useState } from 'react'
import { API_URL } from '../config.js'
import { useLang, translate } from '../i18n.js'

const T = {
  es: {
    st_active: 'ACTIVO', st_idle: 'OFF', st_warning: 'SIN AGUA', st_fault: 'FALLO', st_offline: 'OFFLINE', st_warranty: 'GARANTÍA',
    st_broken: 'AVERÍA', st_nocomms: 'SIN COMUNICACIÓN', st_useroff: 'APAGADO', st_filling: 'SIN AGUA: LLENANDO', st_wetting: 'MOJANDO PANELES',
    evap: 'Evaporativo', zone: 'Zona', main_cooler: 'Cooler principal',
    turn_on_zone: '▶ Encender la zona', turn_on_this: '▶ Encender este', turn_off_this: '■ Apagar este',
    no_cooling: '⚠️ No enfría', vent_warning: '⚠️ VENTILACIÓN — No enfría',
    water: 'Agua', dry: 'Seco', mode: 'Modo', target: 'Objetivo',
    no_water: 'Sin agua', with_water: 'Con agua', salinity: 'Salinidad', ppm: 'PPM', hours: 'Horas',
    speed_zone: 'Velocidad de la zona', speed_hint: 'La velocidad se elige con la zona encendida en MANUAL o FAN (en AUTO la decide el sistema)',
    pump: 'Bomba', solenoid: 'Solenoide',
    reading: 'Leyendo equipos...', no_conn: 'Sin conexión con el sistema', waiting_bus: 'Esperando respuesta del bus Modbus RS485',
    checking_conn: 'Verificando conexión con SmartGreen', reconnecting: 'Reconectando automáticamente...',
    prewet_title: 'Prewet en progreso', prewet_sub: 'Mojando los paneles evaporativos...', prewet_wait: 'Espere hasta que el sistema esté listo',
    device_one: 'equipo', device_many: 'equipos',
    on_all: '▶ Encender todo', off_all: '■ Apagar todo', test_mode: '◈ Modo test',
    ambient: 'Ambiente', no_sensor_data: 'Sin datos de sensores', exterior: 'EXTERIOR', interior: 'INTERIOR',
    temperature: 'temperatura', humidity: 'humedad', no_signal: 'Sin señal',
  },
  en: {
    st_active: 'ACTIVE', st_idle: 'OFF', st_warning: 'NO WATER', st_fault: 'FAULT', st_offline: 'OFFLINE', st_warranty: 'WARRANTY',
    st_broken: 'FAILURE', st_nocomms: 'NO COMMUNICATION', st_useroff: 'SWITCHED OFF', st_filling: 'NO WATER: FILLING', st_wetting: 'WETTING PADS',
    evap: 'Cooler', zone: 'Zone', main_cooler: 'Main cooler',
    turn_on_zone: '▶ Turn the zone on', turn_on_this: '▶ Turn this one on', turn_off_this: '■ Turn this one off',
    no_cooling: '⚠️ Not cooling', vent_warning: '⚠️ FAN ONLY — Not cooling',
    water: 'Water', dry: 'Dry', mode: 'Mode', target: 'Target',
    no_water: 'No water', with_water: 'With water', salinity: 'Salinity', ppm: 'PPM', hours: 'Hours',
    speed_zone: 'Zone speed', speed_hint: 'Speed can be set with the zone on in MANUAL or FAN (in AUTO the system decides)',
    pump: 'Pump', solenoid: 'Solenoid',
    reading: 'Reading devices...', no_conn: 'No connection to the system', waiting_bus: 'Waiting for a response from the Modbus RS485 bus',
    checking_conn: 'Checking connection to SmartGreen', reconnecting: 'Reconnecting automatically...',
    prewet_title: 'Pre-wetting in progress', prewet_sub: 'Wetting the evaporative pads...', prewet_wait: 'Please wait until the system is ready',
    device_one: 'device', device_many: 'devices',
    on_all: '▶ Turn all on', off_all: '■ Turn all off', test_mode: '◈ Test mode',
    ambient: 'Environment', no_sensor_data: 'No sensor data', exterior: 'OUTDOOR', interior: 'INDOOR',
    temperature: 'temperature', humidity: 'humidity', no_signal: 'No signal',
  },
  pt: {
    st_active: 'ATIVO', st_idle: 'OFF', st_warning: 'SEM ÁGUA', st_fault: 'FALHA', st_offline: 'OFFLINE', st_warranty: 'GARANTIA',
    st_broken: 'AVARIA', st_nocomms: 'SEM COMUNICAÇÃO', st_useroff: 'DESLIGADO', st_filling: 'SEM ÁGUA: A ENCHER', st_wetting: 'A MOLHAR PAINÉIS',
    evap: 'Evaporativo', zone: 'Zona', main_cooler: 'Evaporativo principal',
    turn_on_zone: '▶ Ligar a zona', turn_on_this: '▶ Ligar este', turn_off_this: '■ Desligar este',
    no_cooling: '⚠️ Não arrefece', vent_warning: '⚠️ VENTILAÇÃO — Não arrefece',
    water: 'Água', dry: 'Seco', mode: 'Modo', target: 'Objetivo',
    no_water: 'Sem água', with_water: 'Com água', salinity: 'Salinidade', ppm: 'PPM', hours: 'Horas',
    speed_zone: 'Velocidade da zona', speed_hint: 'A velocidade escolhe-se com a zona ligada em MANUAL ou FAN (em AUTO é o sistema que decide)',
    pump: 'Bomba', solenoid: 'Solenoide',
    reading: 'A ler os equipamentos...', no_conn: 'Sem ligação ao sistema', waiting_bus: 'A aguardar resposta do barramento Modbus RS485',
    checking_conn: 'A verificar a ligação ao SmartGreen', reconnecting: 'A religar automaticamente...',
    prewet_title: 'Pré-molhagem em curso', prewet_sub: 'A molhar os painéis evaporativos...', prewet_wait: 'Aguarde até o sistema estar pronto',
    device_one: 'equipamento', device_many: 'equipamentos',
    on_all: '▶ Ligar tudo', off_all: '■ Desligar tudo', test_mode: '◈ Modo de teste',
    ambient: 'Ambiente', no_sensor_data: 'Sem dados dos sensores', exterior: 'EXTERIOR', interior: 'INTERIOR',
    temperature: 'temperatura', humidity: 'humidade', no_signal: 'Sem sinal',
  },
  ca: {
    st_active: 'ACTIU', st_idle: 'OFF', st_warning: 'SENSE AIGUA', st_fault: 'FALLADA', st_offline: 'OFFLINE', st_warranty: 'GARANTIA',
    st_broken: 'AVARIA', st_nocomms: 'SENSE COMUNICACIÓ', st_useroff: 'APAGAT', st_filling: 'SENSE AIGUA: OMPLINT', st_wetting: 'MOLLANT PANELLS',
    evap: 'Evaporatiu', zone: 'Zona', main_cooler: 'Evaporatiu principal',
    turn_on_zone: '▶ Encendre la zona', turn_on_this: '▶ Encendre aquest', turn_off_this: '■ Apagar aquest',
    no_cooling: '⚠️ No refreda', vent_warning: '⚠️ VENTILACIÓ — No refreda',
    water: 'Aigua', dry: 'Sec', mode: 'Mode', target: 'Objectiu',
    no_water: 'Sense aigua', with_water: 'Amb aigua', salinity: 'Salinitat', ppm: 'PPM', hours: 'Hores',
    speed_zone: 'Velocitat de la zona', speed_hint: 'La velocitat s\'escull amb la zona encesa en MANUAL o FAN (en AUTO la decideix el sistema)',
    pump: 'Bomba', solenoid: 'Solenoide',
    reading: 'Llegint equips...', no_conn: 'Sense connexió amb el sistema', waiting_bus: 'Esperant resposta del bus Modbus RS485',
    checking_conn: 'Verificant la connexió amb SmartGreen', reconnecting: 'Reconnectant automàticament...',
    prewet_title: 'Pre-mullat en curs', prewet_sub: 'Mullant els panells evaporatius...', prewet_wait: 'Espereu fins que el sistema estigui a punt',
    device_one: 'equip', device_many: 'equips',
    on_all: '▶ Encendre-ho tot', off_all: '■ Apagar-ho tot', test_mode: '◈ Mode de prova',
    ambient: 'Ambient', no_sensor_data: 'Sense dades dels sensors', exterior: 'EXTERIOR', interior: 'INTERIOR',
    temperature: 'temperatura', humidity: 'humitat', no_signal: 'Sense senyal',
  },
  fr: {
    st_active: 'ACTIF', st_idle: 'OFF', st_warning: 'SANS EAU', st_fault: 'DÉFAUT', st_offline: 'HORS LIGNE', st_warranty: 'GARANTIE',
    st_broken: 'PANNE', st_nocomms: 'SANS COMMUNICATION', st_useroff: 'ÉTEINT', st_filling: 'SANS EAU : REMPLISSAGE', st_wetting: 'MOUILLAGE DES PANNEAUX',
    evap: 'Évaporatif', zone: 'Zone', main_cooler: 'Évaporatif principal',
    turn_on_zone: '▶ Allumer la zone', turn_on_this: '▶ Allumer celui-ci', turn_off_this: '■ Éteindre celui-ci',
    no_cooling: '⚠️ Ne refroidit pas', vent_warning: '⚠️ VENTILATION — Ne refroidit pas',
    water: 'Eau', dry: 'Sec', mode: 'Mode', target: 'Consigne',
    no_water: 'Sans eau', with_water: 'Avec eau', salinity: 'Salinité', ppm: 'PPM', hours: 'Heures',
    speed_zone: 'Vitesse de la zone', speed_hint: 'La vitesse se règle avec la zone allumée en MANUAL ou FAN (en AUTO, c\'est le système qui décide)',
    pump: 'Pompe', solenoid: 'Électrovanne',
    reading: 'Lecture des équipements...', no_conn: 'Pas de connexion avec le système', waiting_bus: 'En attente de réponse du bus Modbus RS485',
    checking_conn: 'Vérification de la connexion avec SmartGreen', reconnecting: 'Reconnexion automatique...',
    prewet_title: 'Pré-mouillage en cours', prewet_sub: 'Mouillage des panneaux évaporatifs...', prewet_wait: 'Veuillez patienter jusqu\'à ce que le système soit prêt',
    device_one: 'appareil', device_many: 'appareils',
    on_all: '▶ Tout allumer', off_all: '■ Tout éteindre', test_mode: '◈ Mode test',
    ambient: 'Ambiance', no_sensor_data: 'Aucune donnée des capteurs', exterior: 'EXTÉRIEUR', interior: 'INTÉRIEUR',
    temperature: 'température', humidity: 'humidité', no_signal: 'Pas de signal',
  },
  it: {
    st_active: 'ATTIVO', st_idle: 'OFF', st_warning: 'SENZA ACQUA', st_fault: 'ANOMALIA', st_offline: 'OFFLINE', st_warranty: 'GARANZIA',
    st_broken: 'GUASTO', st_nocomms: 'SENZA COMUNICAZIONE', st_useroff: 'SPENTO', st_filling: 'SENZA ACQUA: RIEMPIMENTO', st_wetting: 'BAGNATURA PANNELLI',
    evap: 'Evaporativo', zone: 'Zona', main_cooler: 'Evaporativo principale',
    turn_on_zone: '▶ Accendi la zona', turn_on_this: '▶ Accendi questo', turn_off_this: '■ Spegni questo',
    no_cooling: '⚠️ Non raffredda', vent_warning: '⚠️ VENTILAZIONE — Non raffredda',
    water: 'Acqua', dry: 'Secco', mode: 'Modalità', target: 'Obiettivo',
    no_water: 'Senza acqua', with_water: 'Con acqua', salinity: 'Salinità', ppm: 'PPM', hours: 'Ore',
    speed_zone: 'Velocità della zona', speed_hint: 'La velocità si sceglie con la zona accesa in MANUAL o FAN (in AUTO decide il sistema)',
    pump: 'Pompa', solenoid: 'Solenoide',
    reading: 'Lettura delle apparecchiature...', no_conn: 'Nessuna connessione con il sistema', waiting_bus: 'In attesa di risposta dal bus Modbus RS485',
    checking_conn: 'Verifica della connessione con SmartGreen', reconnecting: 'Riconnessione automatica...',
    prewet_title: 'Pre-bagnatura in corso', prewet_sub: 'Bagnatura dei pannelli evaporativi...', prewet_wait: 'Attendere che il sistema sia pronto',
    device_one: 'apparecchio', device_many: 'apparecchi',
    on_all: '▶ Accendi tutto', off_all: '■ Spegni tutto', test_mode: '◈ Modalità test',
    ambient: 'Ambiente', no_sensor_data: 'Nessun dato dei sensori', exterior: 'ESTERNO', interior: 'INTERNO',
    temperature: 'temperatura', humidity: 'umidità', no_signal: 'Nessun segnale',
  },
}

// Texto de esta pantalla en el idioma activo (si falta, en español)
function useT() {
  const lang = useLang()
  return key => translate(T, lang, key)
}

function coolerStatus(c, zone) {
  if (Number(c.broken_cooler) === 1) return 'broken'
  if (Number(c.comms_lost) === 1) return 'nocomms'
  if (Number(c.water_stop) === 1) return 'filling'
  if (Number(c.water_stop) === 2) return 'wetting'
  if (zone?.on_off === 'ON' && Number(c.user_off) === 1) return 'useroff'
  if (c.alarm_fault || c.fault_present) return 'fault'
  if (c.alarm_comms || c.disabled) return 'offline'
  if (c.alarm_water && c.salinity_us <= 10) return 'warning'
  if (c.alarm_warranty) return 'warranty'
  if (zone?.on_off === 'ON') return 'active'
  return 'idle'
}

// Estado de un evaporativo dentro de su zona
const isCoolerOn = (cooler, zone) => zone?.on_off === 'ON' && !Number(cooler.user_off)

const fanSpeed = (cooler, zone) =>
  isCoolerOn(cooler, zone) && !Number(cooler.broken_cooler) && !Number(cooler.comms_lost) ? cooler.actual_fan_speed : 0

// Colores de cada estado. El texto (st_<estado>) está en el diccionario de arriba
const STATUS = {
  active:  { gradient: 'from-[#004d89]/40 to-[#088fc3]/10',  border: 'border-[#088fc3]/35',  dot: 'bg-[#088fc3] shadow-[0_0_10px_#088fc3]',   lc: 'text-[#088fc3]' },
  idle:    { gradient: 'from-white/4 to-transparent',        border: 'border-white/8',       dot: 'bg-white/25',                              lc: 'text-white/30' },
  warning: { gradient: 'from-yellow-900/30 to-transparent',  border: 'border-yellow-500/35', dot: 'bg-yellow-400 shadow-[0_0_10px_#eab308]',  lc: 'text-yellow-400' },
  fault:   { gradient: 'from-red-900/30 to-transparent',     border: 'border-red-500/40',    dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',     lc: 'text-red-400' },
  offline: { gradient: 'from-red-900/15 to-transparent',     border: 'border-red-500/20',    dot: 'bg-red-500/50',                            lc: 'text-red-400/60' },
  warranty:{ gradient: 'from-orange-900/25 to-transparent',  border: 'border-orange-500/35', dot: 'bg-orange-400 shadow-[0_0_10px_#f97316]',  lc: 'text-orange-400' },
  broken:  { gradient: 'from-red-900/40 to-transparent',     border: 'border-red-500/60',    dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',     lc: 'text-red-400' },
  nocomms: { gradient: 'from-red-900/25 to-transparent',     border: 'border-red-500/40',    dot: 'bg-red-500/60',                            lc: 'text-red-400' },
  useroff: { gradient: 'from-white/4 to-transparent',        border: 'border-white/15',      dot: 'bg-white/40',                              lc: 'text-white/40' },
  filling: { gradient: 'from-yellow-900/30 to-transparent',  border: 'border-yellow-500/40', dot: 'bg-yellow-400 shadow-[0_0_10px_#eab308]',  lc: 'text-yellow-400' },
  wetting: { gradient: 'from-[#004d89]/30 to-transparent',   border: 'border-[#088fc3]/30',  dot: 'bg-[#088fc3]',                             lc: 'text-[#088fc3]' },
}

const formatHours = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Botón ■/▶ de un evaporativo (en la ficha): con la zona apagada, enciende la ZONA (el encendido es siempre de zona);
// con la zona encendida, apaga o reincorpora SOLO ese evaporativo
const coolerToggle = async (cooler, zone) => {
  if (zone?.on_off !== 'ON')
    return fetch(`${API_URL}/zones/${cooler.zone_id}/onoff`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ON' })
    })
  return fetch(`${API_URL}/coolers/${cooler.unit_id}/onoff`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: Number(cooler.user_off) ? 'ON' : 'OFF' })
  })
}

const toggleLabel = (t, cooler, zone) =>
  zone?.on_off !== 'ON' ? t('turn_on_zone') : Number(cooler.user_off) ? t('turn_on_this') : t('turn_off_this')

function MiniChart({ value, status }) {
  const bars = [3,5,4,6,5,7,value]
  const color = status === 'active' ? '#088fc3' : status === 'fault' || status === 'broken' ? '#ef4444' : status === 'warning' ? '#eab308' : '#ffffff30'
  return (
    <div className="flex items-end gap-0.5 h-8 flex-1 min-w-0">
      {bars.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm"
          style={{ height: `${Math.max(15,(v/10)*100)}%`, backgroundColor: i===bars.length-1 ? color : color+'50' }} />
      ))}
    </div>
  )
}

function CoolerCard({ cooler, onClick, zone }) {
  const t = useT()
  const s = coolerStatus(cooler, zone)
  const st = STATUS[s]

  return (
    <div onClick={() => onClick(cooler)}
      className={`relative min-w-0 rounded-2xl border cursor-pointer transition-all duration-200 hover:brightness-110 overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-4`}>
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
          <span className="text-white text-lg font-black truncate">{cooler.model || t('evap')}</span>
          <span className="text-white/25 text-xs shrink-0">#{cooler.unit_id}</span>
        </div>
        <span className={`text-xs font-bold tracking-wider shrink-0 text-right ${st.lc}`}>{t('st_' + s)}</span>
      </div>
      <div className="flex items-end justify-between gap-3 mb-3">
        <MiniChart value={fanSpeed(cooler, zone)} status={s} />
        <div className="text-right shrink-0">
          <p className={`text-2xl font-black font-mono leading-none ${st.lc}`}>{fanSpeed(cooler, zone)}</p>
          <p className="text-white/20 text-xs">/10</p>
        </div>
      </div>
      {zone?.cool_fan_mode === 'FAN' && isCoolerOn(cooler, zone) && (
        <div className="w-full text-center py-1 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-bold mb-2">
          {t('no_cooling')}
        </div>
      )}
      <div className="flex gap-2 text-xs">
        <div className="flex-1 min-w-0 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5 truncate">{t('water')}</p>
          <p className={cooler.alarm_water ? 'text-yellow-400 font-bold' : 'text-[#088fc3] font-bold'}>{cooler.alarm_water ? '○' : '●'}</p>
        </div>
        <div className="flex-1 min-w-0 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5">μS</p>
          <p className="text-white font-mono font-bold">{cooler.salinity_us.toFixed(0)}</p>
        </div>
        <div className="flex-1 min-w-0 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5 truncate">{t('zone')}</p>
          <p className="text-white/60 font-bold truncate">{zone?.name || cooler.zone_id}</p>
        </div>
      </div>
    </div>
  )
}

function CoolerMini({ cooler, onClick, zone }) {
  const t = useT()
  const s = coolerStatus(cooler, zone)
  const st = STATUS[s]

  return (
    <div onClick={() => onClick(cooler)}
      className={`min-w-0 rounded-xl border cursor-pointer transition-all duration-150 hover:brightness-110 overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-3`}>
      <div className="flex justify-between items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
          <span className="text-white font-bold text-sm truncate">#{cooler.unit_id}</span>
        </div>
        <span className={`text-xs font-bold shrink-0 ${st.lc}`}>{t('st_' + s)}</span>
      </div>
      <MiniChart value={fanSpeed(cooler, zone)} status={s} />
      <div className="flex justify-between gap-1 mt-2 text-xs text-white/30">
        <span>{fanSpeed(cooler, zone)}/10</span>
        <span className={cooler.alarm_water ? 'text-yellow-400' : 'text-[#088fc3]'}>{cooler.alarm_water ? `○ ${t('dry')}` : `● ${t('water')}`}</span>
        <span>{cooler.salinity_us.toFixed(0)}μS</span>
      </div>
    </div>
  )
}

function CoolerNano({ cooler, onClick, zone }) {
  const st = STATUS[coolerStatus(cooler, zone)]
  const sp = fanSpeed(cooler, zone)
  return (
    <div onClick={() => onClick(cooler)}
      className={`min-w-0 rounded-lg px-3 py-2 border cursor-pointer hover:brightness-110 flex items-center gap-2 bg-gradient-to-r ${st.gradient} ${st.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
      <span className="text-white text-xs font-mono font-bold shrink-0">#{cooler.unit_id}</span>
      <div className="flex-1 min-w-0 flex gap-0.5 h-1">
        {Array.from({length:10}).map((_,i) => (
          <div key={i} className={`flex-1 rounded-full ${i < sp ? 'bg-[#088fc3]' : 'bg-white/10'}`} />
        ))}
      </div>
      <span className={`text-xs font-bold shrink-0 ${st.lc}`}>{sp}</span>
    </div>
  )
}

function SingleHero({ cooler, onClick, zone }) {
  const t = useT()
  const s = coolerStatus(cooler, zone)
  const st = STATUS[s]
  const isOn = isCoolerOn(cooler, zone)
  const mode = zone?.cool_fan_mode || 'AUTO'

  return (
    <div onClick={() => onClick(cooler)}
      className={`flex-1 min-w-0 rounded-3xl border cursor-pointer overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-6 flex flex-col`}>

      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-1">{t('main_cooler')}</p>
          <div className="flex items-center gap-3 min-w-0">
            <span className={`w-3 h-3 rounded-full shrink-0 ${st.dot}`} />
            <p className="text-white text-3xl font-black leading-none truncate">{cooler.model || t('evap')}</p>
          </div>
          <p className="text-white/20 text-sm mt-1 truncate">#{cooler.unit_id} · {zone?.name || `${t('zone')} ${cooler.zone_id}`}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-bold tracking-wider ${st.lc}`}>{t('st_' + s)}</span>
          <p className={`text-6xl font-black font-mono leading-none ${st.lc}`}>
            {fanSpeed(cooler, zone)}<span className="text-2xl text-white/20">/10</span>
          </p>
        </div>
      </div>

      {/* Aviso FAN */}
      {mode === 'FAN' && isOn && (
        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 text-sm font-black tracking-wide mb-4">
          {t('vent_warning')}
        </div>
      )}

      {/* Modo + temp objetivo */}
      <div className="flex gap-3 mb-4">
        <div className={`flex-1 rounded-xl p-3 text-center border
          ${mode === 'AUTO' ? 'bg-[#088fc3]/15 border-[#088fc3]/30' :
            mode === 'MANUAL' ? 'bg-white/8 border-white/15' :
            'bg-yellow-500/10 border-yellow-500/20'}`}>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{t('mode')}</p>
          <p className={`font-black text-lg
            ${mode === 'AUTO' ? 'text-[#088fc3]' :
              mode === 'MANUAL' ? 'text-white' :
              'text-yellow-400'}`}>{mode}</p>
        </div>
        {mode === 'AUTO' && (
          <div className="flex-1 rounded-xl p-3 text-center border bg-white/5 border-white/10">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{t('target')}</p>
            <p className="text-white font-black text-lg">{zone?.target_temp}°C</p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Info grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: t('water'), v: cooler.alarm_water ? t('no_water') : t('with_water'), c: cooler.alarm_water ? 'text-yellow-400' : 'text-[#088fc3]' },
          { l: t('salinity'), v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white' },
          { l: t('ppm'), v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white' },
          { l: t('hours'), v: formatHours(cooler.hours_running), c:'text-white/50' },
        ].map(({l,v,c}) => (
          <div key={l} className="min-w-0 bg-black/25 rounded-xl p-3 text-center">
            <p className="text-white/25 text-xs uppercase tracking-wider mb-1 truncate">{l}</p>
            <p className={`font-bold text-sm truncate ${c}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Ficha del evaporativo: aquí está el encendido/apagado individual, el IMD y la velocidad de la zona
function CoolerDetail({ cooler, onClose, zone, onImd }) {
  const t = useT()
  const s = coolerStatus(cooler, zone)
  const st = STATUS[s]
  const speed = fanSpeed(cooler, zone)
  const canSpeed = zone?.on_off === 'ON' && (zone?.cool_fan_mode === 'MANUAL' || zone?.cool_fan_mode === 'FAN')

  const sendSpeed = async sp => {
    await fetch(`${API_URL}/zones/${cooler.zone_id}/fanspeed`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({speed:sp})
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        className={`w-[420px] rounded-3xl border p-6 bg-[#060c12] shadow-2xl ${st.border}`}>
        <div className="flex justify-between items-start gap-3 mb-5">
          <div className="min-w-0">
            <p className="text-white/25 text-xs tracking-widest uppercase mb-1 truncate">{t('evap')} #{cooler.unit_id} · {zone?.name || `${t('zone')} ${cooler.zone_id}`}</p>
            <p className="text-white text-3xl font-black truncate">{cooler.model || t('evap')}</p>
            <p className={`text-sm font-bold mt-1 ${st.lc}`}>{t('st_' + s)}</p>
            <button onClick={() => coolerToggle(cooler, zone)}
              className={`mt-2 px-4 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all
                ${isCoolerOn(cooler, zone)
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-[#004d89]/40 border border-[#088fc3]/40 text-[#088fc3] hover:bg-[#004d89]/60'}`}>
              {toggleLabel(t, cooler, zone)}
            </button>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onImd}
              className="px-3 h-9 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/25">
              IMD
            </button>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
          </div>
        </div>

        <div className="bg-white/3 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/40 text-xs uppercase tracking-wider">{t('speed_zone')}</span>
            <span className={`font-black font-mono text-2xl ${st.lc}`}>{speed}<span className="text-white/25 text-sm">/10</span></span>
          </div>
          <div className="flex gap-1">
            {Array.from({length:11}).map((_,i) => (
              <button key={i} onClick={() => canSpeed && sendSpeed(i)} disabled={!canSpeed}
                className={`flex-1 h-9 rounded-lg transition-all text-xs font-bold
                  ${!canSpeed ? 'bg-white/3 text-white/15 cursor-not-allowed'
                    : i===speed ? 'bg-[#088fc3] text-white cursor-pointer'
                    : i<speed ? 'bg-[#004d89]/50 text-[#088fc3] cursor-pointer'
                    : 'bg-white/5 text-white/20 hover:bg-white/8 cursor-pointer'}`}>
                {i}
              </button>
            ))}
          </div>
          {!canSpeed && (
            <p className="text-white/25 text-xs mt-2 text-center">{t('speed_hint')}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            {l: t('water'), v: cooler.alarm_water ? `○ ${t('no_water')}` : `● ${t('with_water')}`, c: cooler.alarm_water ? 'text-yellow-400' : 'text-[#088fc3]'},
            {l: t('salinity'), v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white'},
            {l: t('ppm'), v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white'},
            {l: t('pump'), v:cooler.pump_on?'ON':'OFF', c:cooler.pump_on?'text-[#088fc3]':'text-white/30'},
            {l: t('solenoid'), v:cooler.solenoid_on?'ON':'OFF', c:cooler.solenoid_on?'text-[#088fc3]':'text-white/30'},
            {l: t('hours'), v: formatHours(cooler.hours_running), c:'text-white/60'},
          ].map(({l,v,c}) => (
            <div key={l} className="min-w-0 bg-white/4 rounded-xl p-3 text-center">
              <p className="text-white/25 text-xs uppercase tracking-wider mb-1 truncate">{l}</p>
              <p className={`font-bold text-sm truncate ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pantalla de espera DENTRO del dashboard
function DashboardLoading({ connected }) {
  const t = useT()
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl" />
        </div>
        <svg viewBox="0 0 100 90" className="w-40 h-36 relative z-10">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polygon points="50,4 96,86 4,86" fill="#eab308" opacity="0.08" />
          <polygon points="50,4 96,86 4,86" fill="none" stroke="#eab308" strokeWidth="3" strokeLinejoin="round" filter="url(#glow)" opacity="0.9" />
          <text x="50" y="64" textAnchor="middle" fontSize="44" fontWeight="bold" fontFamily="system-ui" fill="#eab308" opacity="0.9" filter="url(#glow)">!</text>
        </svg>
      </div>
      <div className="text-center px-8">
        <p className="text-yellow-400/90 font-bold text-lg">
          {connected ? t('reading') : t('no_conn')}
        </p>
        <p className="text-white/30 text-sm mt-2">
          {connected ? t('waiting_bus') : t('checking_conn')}
        </p>
        {!connected && (
          <p className="text-white/15 text-xs mt-3">{t('reconnecting')}</p>
        )}
      </div>
    </div>
  )
}

// Pantalla de espera PRELOADING del dashboard
function PrewetLoading() {
  const t = useT()
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <svg viewBox="0 0 24 24" className="w-16 h-16 animate-bounce text-[#088fc3]" fill="currentColor">
          <path d="M12 2C6 2 2 8 2 13a10 10 0 0 0 20 0C22 8 18 2 12 2z"/>
        </svg>
        <div className="absolute -inset-4 rounded-full border-2 border-[#088fc3]/30 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-[#088fc3] font-black text-xl mb-2">{t('prewet_title')}</p>
        <p className="text-white/40 text-sm">{t('prewet_sub')}</p>
        <p className="text-white/20 text-xs mt-1">{t('prewet_wait')}</p>
      </div>
    </div>
  )
}

export default function Dashboard({ data, connected, onImdActivate }) {
  const t = useT()
  const [selectedId, setSelectedId] = useState(null)       // evaporativo abierto en la ficha (sus datos se leen en directo)
  const getZone = (cooler) => data.zones.find(z => z.zone_id === cooler.zone_id)
  const hasData = connected && data.coolers.length > 0 && data.coolers.some(c => c.last_read > 0)
  const n = hasData ? data.coolers.length : 0
  const selected = selectedId !== null ? data.coolers.find(c => c.unit_id === selectedId) : null
  const openCooler = (c) => setSelectedId(c.unit_id)

  const Card = n <= 4 ? CoolerCard : n <= 20 ? CoolerMini : CoolerNano
  const gridClass = n <= 4 ? 'grid-cols-2' : n <= 9 ? 'grid-cols-3' : n <= 16 ? 'grid-cols-4' : n <= 25 ? 'grid-cols-5' : 'grid-cols-6'

  const isPrewet = hasData && data.zones.some(z => z.prewet_in_progress === 'yes')

  const toggleAll = async (action) => {
    for (const z of data.zones) {
      await fetch(`${API_URL}/zones/${z.zone_id}/onoff`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action})
      })
    }
  }

  return (
    <div className="h-full flex gap-0">
      {/* Main */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden min-w-0">

        {/* Zone pills — solo si hay datos */}
        {hasData && (
          <div className="flex gap-2 flex-wrap items-center shrink-0">
            {data.zones.map(z => (
              <div key={z.zone_id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium max-w-full
                  ${z.on_off==='ON'?'bg-[#004d89]/25 border-[#088fc3]/35 text-[#088fc3]':'bg-white/3 border-white/8 text-white/25'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${z.on_off==='ON'?'bg-[#088fc3]':'bg-white/15'}`} />
                <span className="truncate">
                  {z.name || `${t('zone')} ${z.zone_id}`} · {z.on_off} · {z.cool_fan_mode} · {
                    (() => {
                      const c = data.coolers.find(c => c.zone_id === z.zone_id && isCoolerOn(c, z))
                      return c ? c.actual_fan_speed : 0
                    })()
                  }/10 · {z.target_temp}°C
                </span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-white/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#088fc3]" />
              Modbus · {n} {n===1 ? t('device_one') : t('device_many')}
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {!hasData ? (
          <DashboardLoading connected={connected} />
        ) : isPrewet ? (
          <PrewetLoading />
        ) : n === 1 ? (
          <div className="flex-1 flex min-w-0">
            <SingleHero cooler={data.coolers[0]} onClick={openCooler} zone={getZone(data.coolers[0])} />
          </div>
        ) : (
          <div className={`flex-1 overflow-y-auto overflow-x-hidden grid ${gridClass} gap-3 content-start`}>
            {data.coolers.map(c => <Card key={c.unit_id} cooler={c} onClick={openCooler} zone={getZone(c)} />)}
          </div>
        )}

        {hasData && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => !isPrewet && toggleAll('ON')}
              disabled={isPrewet}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all
                ${isPrewet
                  ? 'bg-white/2 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-[#004d89]/40 border-[#088fc3]/30 text-[#088fc3] cursor-pointer hover:bg-[#004d89]/60'}`}>
              {t('on_all')}
            </button>
            <button onClick={() => !isPrewet && toggleAll('OFF')}
              disabled={isPrewet}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all
                ${isPrewet
                  ? 'bg-white/2 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/4 border-white/10 text-white/40 cursor-pointer hover:bg-white/8'}`}>
              {t('off_all')}
            </button>
            <button disabled={isPrewet}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all
                ${isPrewet
                  ? 'bg-white/2 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400 cursor-pointer hover:bg-yellow-500/15'}`}>
              {t('test_mode')}
            </button>
          </div>
        )}
      </div>

      {/* Right panel — solo AMBIENTE */}
      <div className="w-48 shrink-0 border-l border-white/5 p-4 flex flex-col gap-4 bg-[#070d14]/50">
        <p className="text-white/20 text-xs font-bold tracking-widest uppercase">{t('ambient')}</p>
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/15 text-xs text-center">{t('no_sensor_data')}</p>
          </div>
        ) : (
          data.sensors.map(s => (
            <div key={s.sensor_id} className="bg-white/3 rounded-2xl p-4 border border-white/6 flex-1">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#088fc3] text-xs font-bold tracking-wider">{s.type==='EXT' ? t('exterior') : t('interior')}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${s.valid?'bg-[#088fc3] shadow-[0_0_6px_#088fc3]':'bg-red-500'}`} />
              </div>
              {s.valid ? (
                <>
                  <p className="text-[#088fc3] text-4xl font-black font-mono leading-none">{s.temperature}<span className="text-2xl">°</span></p>
                  <p className="text-white/20 text-xs mb-4">{t('temperature')}</p>
                  <p className="text-white text-3xl font-black font-mono leading-none">{s.humidity}<span className="text-lg text-white/25">%</span></p>
                  <p className="text-white/20 text-xs mb-2">{t('humidity')}</p>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-[#088fc3]/60 rounded-full" style={{width:`${s.humidity}%`}} />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-4">
                  <p className="text-red-400/60 text-xs font-bold">{t('no_signal')}</p>
                  <p className="text-white/15 text-xs mt-1">#{s.sensor_id}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selected && <CoolerDetail cooler={selected} onClose={() => setSelectedId(null)} zone={getZone(selected)}
        onImd={() => { const u = selected.unit_id; setSelectedId(null); onImdActivate(u) }} />}
    </div>
  )
}
