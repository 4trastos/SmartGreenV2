import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import Keyboard from '../components/Keyboard'
import { useLang, translate } from '../i18n.js'

const T = {
  es: {
    reading: 'Leyendo equipos...', no_conn: 'Sin conexión con el sistema', waiting_bus: 'Esperando respuesta del bus Modbus RS485',
    checking_conn: 'Verificando conexión con SmartGreen', reconnecting: 'Reconectando automáticamente...',
    zone: 'Zona', zones_control: 'Control de zonas',
    prewet_title: 'Prewet en progreso', prewet_sub: 'Mojando los paneles evaporativos...', prewet_wait: 'Espere hasta que el sistema esté listo',
    vent_banner: '⚠️ MODO VENTILACIÓN — NO está enfriando',
    speed: 'Velocidad', target_temp: 'Temperatura objetivo', mode: 'Modo',
    sensor_fail: '⚠️ Sensor de temperatura sin señal — modo AUTO no disponible',
    humidity_max: 'Humedad máxima', humidity_off: 'Control de humedad desactivado',
    ambient: 'Ambiente', no_sensor_data: 'Sin datos de sensores', exterior: 'EXTERIOR', interior: 'INTERIOR',
    temperature: 'temperatura', humidity: 'humedad', no_signal: 'Sin señal',
    imd_title: 'Modo IMD', imd_which: '¿Qué evaporativo quiere revisar?', imd_others: 'Los demás de la zona seguirán funcionando con normalidad',
    evap: 'Evaporativo', broken: 'AVERÍA', nocomms: 'SIN COMUNICACIÓN', ok: 'OK', cancel: 'Cancelar',
  },
  en: {
    reading: 'Reading devices...', no_conn: 'No connection to the system', waiting_bus: 'Waiting for a response from the Modbus RS485 bus',
    checking_conn: 'Checking connection to SmartGreen', reconnecting: 'Reconnecting automatically...',
    zone: 'Zone', zones_control: 'Zone control',
    prewet_title: 'Pre-wetting in progress', prewet_sub: 'Wetting the evaporative pads...', prewet_wait: 'Please wait until the system is ready',
    vent_banner: '⚠️ FAN MODE — NOT cooling',
    speed: 'Speed', target_temp: 'Target temperature', mode: 'Mode',
    sensor_fail: '⚠️ Temperature sensor has no signal — AUTO mode not available',
    humidity_max: 'Maximum humidity', humidity_off: 'Humidity control off',
    ambient: 'Environment', no_sensor_data: 'No sensor data', exterior: 'OUTDOOR', interior: 'INDOOR',
    temperature: 'temperature', humidity: 'humidity', no_signal: 'No signal',
    imd_title: 'IMD mode', imd_which: 'Which cooler do you want to check?', imd_others: 'The others in the zone will keep working normally',
    evap: 'Cooler', broken: 'FAILURE', nocomms: 'NO COMMUNICATION', ok: 'OK', cancel: 'Cancel',
  },
  pt: {
    reading: 'A ler os equipamentos...', no_conn: 'Sem ligação ao sistema', waiting_bus: 'A aguardar resposta do barramento Modbus RS485',
    checking_conn: 'A verificar a ligação ao SmartGreen', reconnecting: 'A religar automaticamente...',
    zone: 'Zona', zones_control: 'Controlo de zonas',
    prewet_title: 'Pré-molhagem em curso', prewet_sub: 'A molhar os painéis evaporativos...', prewet_wait: 'Aguarde até o sistema estar pronto',
    vent_banner: '⚠️ MODO VENTILAÇÃO — NÃO está a arrefecer',
    speed: 'Velocidade', target_temp: 'Temperatura objetivo', mode: 'Modo',
    sensor_fail: '⚠️ Sensor de temperatura sem sinal — modo AUTO indisponível',
    humidity_max: 'Humidade máxima', humidity_off: 'Controlo de humidade desativado',
    ambient: 'Ambiente', no_sensor_data: 'Sem dados dos sensores', exterior: 'EXTERIOR', interior: 'INTERIOR',
    temperature: 'temperatura', humidity: 'humidade', no_signal: 'Sem sinal',
    imd_title: 'Modo IMD', imd_which: 'Que evaporativo quer verificar?', imd_others: 'Os restantes da zona continuarão a funcionar normalmente',
    evap: 'Evaporativo', broken: 'AVARIA', nocomms: 'SEM COMUNICAÇÃO', ok: 'OK', cancel: 'Cancelar',
  },
  ca: {
    reading: 'Llegint equips...', no_conn: 'Sense connexió amb el sistema', waiting_bus: 'Esperant resposta del bus Modbus RS485',
    checking_conn: 'Verificant la connexió amb SmartGreen', reconnecting: 'Reconnectant automàticament...',
    zone: 'Zona', zones_control: 'Control de zones',
    prewet_title: 'Pre-mullat en curs', prewet_sub: 'Mullant els panells evaporatius...', prewet_wait: 'Espereu fins que el sistema estigui a punt',
    vent_banner: '⚠️ MODE VENTILACIÓ — NO està refredant',
    speed: 'Velocitat', target_temp: 'Temperatura objectiu', mode: 'Mode',
    sensor_fail: '⚠️ Sensor de temperatura sense senyal — mode AUTO no disponible',
    humidity_max: 'Humitat màxima', humidity_off: 'Control d\'humitat desactivat',
    ambient: 'Ambient', no_sensor_data: 'Sense dades dels sensors', exterior: 'EXTERIOR', interior: 'INTERIOR',
    temperature: 'temperatura', humidity: 'humitat', no_signal: 'Sense senyal',
    imd_title: 'Mode IMD', imd_which: 'Quin evaporatiu voleu revisar?', imd_others: 'Els altres de la zona continuaran funcionant amb normalitat',
    evap: 'Evaporatiu', broken: 'AVARIA', nocomms: 'SENSE COMUNICACIÓ', ok: 'OK', cancel: 'Cancel·lar',
  },
  fr: {
    reading: 'Lecture des équipements...', no_conn: 'Pas de connexion avec le système', waiting_bus: 'En attente de réponse du bus Modbus RS485',
    checking_conn: 'Vérification de la connexion avec SmartGreen', reconnecting: 'Reconnexion automatique...',
    zone: 'Zone', zones_control: 'Contrôle des zones',
    prewet_title: 'Pré-mouillage en cours', prewet_sub: 'Mouillage des panneaux évaporatifs...', prewet_wait: 'Veuillez patienter jusqu\'à ce que le système soit prêt',
    vent_banner: '⚠️ MODE VENTILATION — NE refroidit PAS',
    speed: 'Vitesse', target_temp: 'Température de consigne', mode: 'Mode',
    sensor_fail: '⚠️ Capteur de température sans signal — mode AUTO indisponible',
    humidity_max: 'Humidité maximale', humidity_off: 'Contrôle de l\'humidité désactivé',
    ambient: 'Ambiance', no_sensor_data: 'Aucune donnée des capteurs', exterior: 'EXTÉRIEUR', interior: 'INTÉRIEUR',
    temperature: 'température', humidity: 'humidité', no_signal: 'Pas de signal',
    imd_title: 'Mode IMD', imd_which: 'Quel évaporatif voulez-vous contrôler ?', imd_others: 'Les autres de la zone continueront de fonctionner normalement',
    evap: 'Évaporatif', broken: 'PANNE', nocomms: 'SANS COMMUNICATION', ok: 'OK', cancel: 'Annuler',
  },
  it: {
    reading: 'Lettura delle apparecchiature...', no_conn: 'Nessuna connessione con il sistema', waiting_bus: 'In attesa di risposta dal bus Modbus RS485',
    checking_conn: 'Verifica della connessione con SmartGreen', reconnecting: 'Riconnessione automatica...',
    zone: 'Zona', zones_control: 'Controllo delle zone',
    prewet_title: 'Pre-bagnatura in corso', prewet_sub: 'Bagnatura dei pannelli evaporativi...', prewet_wait: 'Attendere che il sistema sia pronto',
    vent_banner: '⚠️ MODALITÀ VENTILAZIONE — NON sta raffreddando',
    speed: 'Velocità', target_temp: 'Temperatura obiettivo', mode: 'Modalità',
    sensor_fail: '⚠️ Sensore di temperatura senza segnale — modalità AUTO non disponibile',
    humidity_max: 'Umidità massima', humidity_off: 'Controllo dell\'umidità disattivato',
    ambient: 'Ambiente', no_sensor_data: 'Nessun dato dei sensori', exterior: 'ESTERNO', interior: 'INTERNO',
    temperature: 'temperatura', humidity: 'umidità', no_signal: 'Nessun segnale',
    imd_title: 'Modalità IMD', imd_which: 'Quale evaporativo vuole controllare?', imd_others: 'Gli altri della zona continueranno a funzionare normalmente',
    evap: 'Evaporativo', broken: 'GUASTO', nocomms: 'SENZA COMUNICAZIONE', ok: 'OK', cancel: 'Annulla',
  },
}

// Texto de esta pantalla en el idioma activo (si falta, en español)
function useT() {
  const lang = useLang()
  return key => translate(T, lang, key)
}

function ControlLoading({ connected }) {
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

export default function Control({ data, onImdActivate, connected }) {
  const t = useT()
  const hasData = connected && data.coolers.length > 0 && data.coolers.some(c => c.last_read > 0)

  const zones = data.zones.length > 0 ? data.zones : [
    { zone_id: 1, on_off: 'ON', fan_speed_cmd: 7, target_temp: 25.0, cool_fan_mode: 'AUTO', humidity_min: 60, humidity_max: 70, humidity_control: 1 },
    { zone_id: 2, on_off: 'OFF', fan_speed_cmd: 3, target_temp: 22.0, cool_fan_mode: 'AUTO', humidity_min: 60, humidity_max: 70, humidity_control: 1 }
  ]

  const [localZones, setLocalZones] = useState(zones)
  const [imdSelectZone, setImdSelectZone] = useState(null)     // zona con varios evaporativos: elegir cuál revisar

  useEffect(() => {
    if (data.zones.length > 0)
      setLocalZones([...data.zones])
  }, [JSON.stringify(data.zones)])

  const handleModeClick = async (zoneId, mode) => {
    if (mode === 'IMD') {
      // El IMD es de UN evaporativo: si la zona tiene varios, preguntar cuál (el PIN lo pide App)
      const zc = data.coolers.filter(c => c.zone_id === zoneId)
      if (zc.length === 1)
        onImdActivate(zc[0].unit_id)
      else if (zc.length > 1)
        setImdSelectZone(zoneId)
    } else {
      setMode(zoneId, mode)
    }
  }

  const toggle = async (zoneId) => {
    const zone = localZones.find(z => z.zone_id === zoneId)
    const action = zone.on_off === 'ON' ? 'OFF' : 'ON'
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, on_off: action } : z))
    await fetch(`${API_URL}/zones/${zoneId}/onoff`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    // Si enciende y es FAN o MANUAL — enviar velocidad seleccionada
    if (action === 'ON' && (zone.cool_fan_mode === 'FAN' || zone.cool_fan_mode === 'MANUAL')) {
      await fetch(`${API_URL}/zones/${zoneId}/fanspeed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed: zone.fan_speed_cmd || 5 })
      })
    }
  }

  const setFanSpeed = async (zoneId, speed) => {
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, fan_speed_cmd: speed } : z))
    // Solo enviar al backend si la zona está ON
    const zone = localZones.find(z => z.zone_id === zoneId)
    if (zone?.on_off === 'ON') {
      await fetch(`${API_URL}/zones/${zoneId}/fanspeed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      })
    }
  }

  const setTemp = async (zoneId, delta) => {
    const zone = localZones.find(z => z.zone_id === zoneId)
    const newTemp = Math.min(35, Math.max(15, zone.target_temp + delta))
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, target_temp: newTemp } : z))
    await fetch(`${API_URL}/zones/${zoneId}/targettemp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newTemp })
    })
  }

  const setMode = async (zoneId, mode) => {
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, cool_fan_mode: mode } : z))
    await fetch(`${API_URL}/zones/${zoneId}/mode`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    })
  }

  const setHumidity = async (zoneId, type, delta) => {
    const zone = localZones.find(z => z.zone_id === zoneId)
    const key = type === 'min' ? 'humidity_min' : 'humidity_max'
    const current = parseFloat(zone[key]) || (type === 'min' ? 60 : 70)
    const newVal = Math.min(100, Math.max(0, current + delta))
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, [key]: newVal } : z))
    await fetch(`${API_URL}/zones/${zoneId}/humidity`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value: newVal })
    })
  }

  const toggleHumidityControl = async (zoneId) => {
    const zone = localZones.find(z => z.zone_id === zoneId)
    const newVal = zone.humidity_control ? 0 : 1
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, humidity_control: newVal } : z))
    await fetch(`${API_URL}/zones/${zoneId}/humiditycontrol`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: newVal })
    })
  }

  const MODES = ['AUTO', 'MANUAL', 'FAN', 'IMD']

  if (!hasData) return (
    <div className="h-full flex">
      <ControlLoading connected={connected} />
    </div>
  )

  return (
    <>
      <div className="h-full flex gap-0">

        {/* Zonas */}
        <div className="flex-1 p-4 flex flex-col gap-4">
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase shrink-0">{t('zones_control')}</p>
          <div className="flex gap-4 flex-1">
            {localZones.map(zone => {
              const fSpeed = zone.on_off === 'ON' ? zone.fan_speed_cmd : 0
              const zoneCoolers = data.coolers.filter(c => c.zone_id === zone.zone_id)
              const hasFault = zoneCoolers.some(c => c.alarm_fault || c.fault_present)
              // 🟡 Avisos que limitan los modos
              const sensorFail = data.sensors.some(s => (s.zone_id ?? zone.zone_id) === zone.zone_id && s.type === 'INT' && !s.valid)
              const hasWarning = sensorFail || zoneCoolers.some(c => c.alarm_water && c.salinity_us <= 10)
              const modeDisabled = m => (sensorFail && m === 'AUTO')
              return (
                <div key={zone.zone_id}
                  className={`flex-1 rounded-3xl border p-6 flex flex-col gap-6 transition-all duration-300
                  ${hasFault
                    ? 'bg-gradient-to-br from-red-900/30 to-transparent border-red-500/40'
                    : hasWarning
                      ? 'bg-gradient-to-br from-yellow-900/30 to-transparent border-yellow-500/35'
                      : zone.on_off === 'ON'
                        ? 'bg-[#004d89]/20 border-[#088fc3]/40'
                        : 'bg-white/2 border-white/8'}`}>

                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[#088fc3] text-xs font-bold tracking-widest uppercase">{zone.name || t('zone')}</p>
                      <p className="text-white text-4xl font-black">{zone.zone_id}</p>
                    </div>
                    <button
                      onClick={() => zone.prewet_in_progress !== 'yes' && toggle(zone.zone_id)}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300
                        ${zone.prewet_in_progress === 'yes'
                          ? 'opacity-30 cursor-not-allowed bg-white/10'
                          : zone.on_off === 'ON'
                            ? 'bg-[#088fc3] shadow-[0_0_20px_#088fc340] cursor-pointer'
                            : 'bg-white/10 cursor-pointer'}`}>
                      <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300
                        ${zone.on_off === 'ON' ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>

                  {/* Prewet en progreso */}
                  {zone.prewet_in_progress === 'yes' ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
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
                  ) : (
                    <>
                      {/* Aviso modo FAN */}
                      {zone.cool_fan_mode === 'FAN' && zone.on_off === 'ON' && (
                        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-black tracking-wide text-center">
                          {t('vent_banner')}
                        </div>
                      )}

                      {/* Fan speed */}
                      {(zone.cool_fan_mode === 'MANUAL' || zone.cool_fan_mode === 'FAN') && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white/40 text-xs uppercase tracking-wider">{t('speed')}</span>
                            <span className="text-[#088fc3] font-mono font-black text-2xl">{fSpeed}<span className="text-white/30 text-sm">/10</span></span>
                          </div>
                          <div className="flex gap-1.5">
                            {Array.from({ length: 10 }).map((_, i) => {
                              const speed = i + 1  // 1-10, sin el 0
                              return (
                                <button key={speed} onClick={() => setFanSpeed(zone.zone_id, speed)}
                                  className={`flex-1 h-10 rounded-lg transition-all cursor-pointer font-bold text-sm
                                    ${speed === fSpeed
                                      ? 'bg-[#088fc3] text-white shadow-[0_0_10px_#088fc360]'
                                      : speed < fSpeed
                                        ? 'bg-[#004d89]/60 text-[#088fc3]'
                                        : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                                  {speed}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Target temp — solo en modo AUTO */}
                      {zone.cool_fan_mode === 'AUTO' && (
                        <div>
                          <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">{t('target_temp')}</span>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setTemp(zone.zone_id, -0.5)}
                              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:bg-white/10 cursor-pointer flex items-center justify-center">−</button>
                            <span className="text-white text-3xl font-black font-mono flex-1 text-center">{zone.target_temp}°C</span>
                            <button onClick={() => setTemp(zone.zone_id, 0.5)}
                              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white text-xl hover:bg-white/10 cursor-pointer flex items-center justify-center">+</button>
                          </div>
                        </div>
                      )}

                      {/* Mode */}
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">{t('mode')}</span>
                        <div className="grid grid-cols-4 gap-2">
                          {MODES.map(m => (
                            <button key={m}
                              disabled={modeDisabled(m)}
                              onClick={() => !modeDisabled(m) && handleModeClick(zone.zone_id, m)}
                              className={`py-2 rounded-xl text-xs font-bold transition-all
                                ${modeDisabled(m)
                                  ? 'bg-white/3 text-white/15 cursor-not-allowed line-through'
                                  : zone.cool_fan_mode === m && m !== 'IMD' ? 'bg-[#088fc3] text-white cursor-pointer' : 'bg-white/5 text-white/30 hover:bg-white/10 cursor-pointer'}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                        {sensorFail && (
                          <div className="mt-2 py-2 px-3 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 text-xs font-bold text-center">
                            {t('sensor_fail')}
                          </div>
                        )}
                      </div>

                      {/* Humedad máxima — solo en modo AUTO */}
                      {zone.cool_fan_mode === 'AUTO' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white/40 text-xs uppercase tracking-wider">{t('humidity_max')}</span>
                            <button onClick={() => toggleHumidityControl(zone.zone_id)}
                              className={`relative w-10 h-5 rounded-full transition-all cursor-pointer
                                ${zone.humidity_control ? 'bg-[#088fc3]' : 'bg-white/10'}`}>
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
                                ${zone.humidity_control ? 'left-5' : 'left-0.5'}`} />
                            </button>
                          </div>
                          {zone.humidity_control ? (
                            <div className="flex items-center gap-3">
                              <button onClick={() => setHumidity(zone.zone_id, 'max', -5)}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 cursor-pointer flex items-center justify-center">−</button>
                              <span className="text-white font-mono font-bold flex-1 text-center">{zone.humidity_max}%</span>
                              <button onClick={() => setHumidity(zone.zone_id, 'max', 5)}
                                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 cursor-pointer flex items-center justify-center">+</button>
                            </div>
                          ) : (
                            <p className="text-white/20 text-xs">{t('humidity_off')}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Ambiente — panel derecho */}
        <div className="w-48 shrink-0 border-l border-white/5 p-4 flex flex-col gap-4 bg-[#070d14]/50">
          <p className="text-white/20 text-xs font-bold tracking-widest uppercase">{t('ambient')}</p>
          {data.sensors.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/15 text-xs text-center">{t('no_sensor_data')}</p>
            </div>
          ) : (
            data.sensors.map(s => (
              <div key={s.sensor_id} className="bg-white/3 rounded-2xl p-4 border border-white/6 flex-1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#088fc3] text-xs font-bold tracking-wider">{s.type === 'EXT' ? t('exterior') : t('interior')}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.valid ? 'bg-[#088fc3] shadow-[0_0_6px_#088fc3]' : 'bg-red-500'}`} />
                </div>
                {s.valid ? (
                  <>
                    <p className="text-[#088fc3] text-4xl font-black font-mono leading-none">{s.temperature}<span className="text-2xl">°</span></p>
                    <p className="text-white/20 text-xs mb-4">{t('temperature')}</p>
                    <p className="text-white text-3xl font-black font-mono leading-none">{s.humidity}<span className="text-lg text-white/25">%</span></p>
                    <p className="text-white/20 text-xs mb-2">{t('humidity')}</p>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-[#088fc3]/60 rounded-full" style={{ width: `${s.humidity}%` }} />
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
      </div>

      {/* Elegir qué evaporativo revisar (zona con varios) */}
      {imdSelectZone !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg"
          onClick={() => setImdSelectZone(null)}>
          <div onClick={e => e.stopPropagation()}
            className="w-[360px] rounded-3xl border border-white/10 p-6 bg-[#060c12] shadow-2xl">
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1 text-center">{t('imd_title')}</p>
            <p className="text-white text-xl font-black mb-2 text-center">{t('imd_which')}</p>
            <p className="text-white/40 text-xs mb-5 text-center">{t('imd_others')}</p>
            <div className="flex flex-col gap-2">
              {data.coolers.filter(c => c.zone_id === imdSelectZone).map(c => {
                const broken = Number(c.broken_cooler) === 1
                const nocomm = Number(c.comms_lost) === 1
                return (
                  <button key={c.unit_id}
                    onClick={() => { setImdSelectZone(null); onImdActivate(c.unit_id) }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all
                      ${broken || nocomm ? 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <span className="text-white font-bold">{t('evap')} #{c.unit_id} <span className="text-white/40 font-normal text-sm">{c.model}</span></span>
                    <span className={`text-xs font-bold ${broken || nocomm ? 'text-red-400' : 'text-[#088fc3]'}`}>
                      {broken ? t('broken') : nocomm ? t('nocomms') : t('ok')}
                    </span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => setImdSelectZone(null)}
              className="w-full mt-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm cursor-pointer hover:bg-white/10">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
