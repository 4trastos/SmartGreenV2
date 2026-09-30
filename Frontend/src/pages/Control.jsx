import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import Keyboard from '../components/Keyboard'

function ControlLoading({ connected }) {
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
          {connected ? 'Leyendo equipos...' : 'Sin conexión con el sistema'}
        </p>
        <p className="text-white/30 text-sm mt-2">
          {connected ? 'Esperando respuesta del bus Modbus RS485' : 'Verificando conexión con SmartGreen'}
        </p>
        {!connected && (
          <p className="text-white/15 text-xs mt-3">Reconectando automáticamente...</p>
        )}
      </div>
    </div>
  )
}

export default function Control({ data, onImdActivate, connected }) {
  const hasData = connected && data.coolers.length > 0 && data.coolers.some(c => c.last_read > 0)

  const zones = data.zones.length > 0 ? data.zones : [
    { zone_id: 1, on_off: 'ON', fan_speed_cmd: 7, target_temp: 25.0, cool_fan_mode: 'AUTO', humidity_min: 60, humidity_max: 70, humidity_control: 1 },
    { zone_id: 2, on_off: 'OFF', fan_speed_cmd: 3, target_temp: 22.0, cool_fan_mode: 'AUTO', humidity_min: 60, humidity_max: 70, humidity_control: 1 }
  ]

  const [localZones, setLocalZones] = useState(zones)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [pendingZoneId, setPendingZoneId] = useState(null)
  const [showImdWarning, setShowImdWarning] = useState(false)

  useEffect(() => {
    if (data.zones.length > 0)
      setLocalZones([...data.zones])
  }, [JSON.stringify(data.zones)])

  const handleModeClick = async (zoneId, mode) => {
    if (mode === 'IMD') {
      const zone = localZones.find(z => z.zone_id === zoneId)
      if (zone.on_off === 'ON') {
        setShowImdWarning(true)
        setTimeout(() => setShowImdWarning(false), 3000)
        return
      }
      setPendingZoneId(zoneId)
      setPin('')
      setPinError(false)
      setShowPinModal(true)
    } else {
      setMode(zoneId, mode)
    }
  }

  const confirmPin = async (pinValue) => {
    const res = await fetch(`${API_URL}/imd/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinValue || pin })
    })
    if (res.ok) {
      setShowPinModal(false)
      setPin('')
      setMode(pendingZoneId, 'IMD')
      onImdActivate(pendingZoneId)
    } else {
      setPinError(true)
      setPin('')
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
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase shrink-0">Control de zonas</p>
          <div className="flex gap-4 flex-1">
            {localZones.map(zone => {
              const fSpeed = zone.on_off === 'ON' ? zone.fan_speed_cmd : 0
              const zoneCoolers = data.coolers.filter(c => c.zone_id === zone.zone_id)
              const hasFault = zoneCoolers.some(c => c.alarm_fault || c.fault_present)
              const hasWarning = zoneCoolers.some(c => c.alarm_water && c.salinity_us <= 10)
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
                      <p className="text-[#088fc3] text-xs font-bold tracking-widest uppercase">{zone.name || 'Zona'}</p>
                      <p className="text-white text-4xl font-black">{zone.zone_id}</p>
                    </div>
                    <button onClick={() => toggle(zone.zone_id)}
                      className={`relative w-16 h-8 rounded-full transition-all duration-300 cursor-pointer
                        ${zone.on_off === 'ON' ? 'bg-[#088fc3] shadow-[0_0_20px_#088fc340]' : 'bg-white/10'}`}>
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
                        <p className="text-[#088fc3] font-black text-xl mb-2">Prewet en progreso</p>
                        <p className="text-white/40 text-sm">Mojando los paneles evaporativos...</p>
                        <p className="text-white/20 text-xs mt-1">Espere hasta que el sistema esté listo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Aviso modo FAN */}
                      {zone.cool_fan_mode === 'FAN' && zone.on_off === 'ON' && (
                        <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-black tracking-wide">
                          ⚠️ MODO VENTILACIÓN — NO está enfriando
                        </div>
                      )}

                      {/* Fan speed */}
                      {(zone.cool_fan_mode === 'MANUAL' || zone.cool_fan_mode === 'FAN') && (
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-white/40 text-xs uppercase tracking-wider">Velocidad</span>
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
                          <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Temperatura objetivo</span>
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
                        <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Modo</span>
                        <div className="grid grid-cols-4 gap-2">
                          {MODES.map(m => (
                            <button key={m} onClick={() => handleModeClick(zone.zone_id, m)}
                              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                                ${zone.cool_fan_mode === m ? 'bg-[#088fc3] text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                        {showImdWarning && (
                          <div className="mt-2 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold text-center">
                            ⚠️ Apaga el cooler antes de entrar en modo IMD
                          </div>
                        )}
                      </div>

                      {/* Humedad máxima — solo en modo AUTO */}
                      {zone.cool_fan_mode === 'AUTO' && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white/40 text-xs uppercase tracking-wider">Humedad máxima</span>
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
                            <p className="text-white/20 text-xs">Control de humedad desactivado</p>
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
          <p className="text-white/20 text-xs font-bold tracking-widest uppercase">Ambiente</p>
          {data.sensors.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/15 text-xs text-center">Sin datos de sensores</p>
            </div>
          ) : (
            data.sensors.map(s => (
              <div key={s.sensor_id} className="bg-white/3 rounded-2xl p-4 border border-white/6 flex-1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#088fc3] text-xs font-bold tracking-wider">{s.type === 'EXT' ? 'EXTERIOR' : 'INTERIOR'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.valid ? 'bg-[#088fc3] shadow-[0_0_6px_#088fc3]' : 'bg-red-500'}`} />
                </div>
                {s.valid ? (
                  <>
                    <p className="text-[#088fc3] text-4xl font-black font-mono leading-none">{s.temperature}<span className="text-2xl">°</span></p>
                    <p className="text-white/20 text-xs mb-4">temperatura</p>
                    <p className="text-white text-3xl font-black font-mono leading-none">{s.humidity}<span className="text-lg text-white/25">%</span></p>
                    <p className="text-white/20 text-xs mb-2">humedad</p>
                    <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-[#088fc3]/60 rounded-full" style={{ width: `${s.humidity}%` }} />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 py-4">
                    <p className="text-red-400/60 text-xs font-bold">Sin señal</p>
                    <p className="text-white/15 text-xs mt-1">#{s.sensor_id}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal PIN - IMD */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg"
          onClick={() => setShowPinModal(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-[300px] rounded-3xl border border-white/10 p-6 bg-[#060c12] shadow-2xl">
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1 text-center">Acceso restringido</p>
            <p className="text-white text-xl font-black mb-6 text-center">Modo IMD</p>
            <div className="flex justify-center gap-3 mb-6">
              {[0,1,2,3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all
                  ${pinError ? 'border-red-500 bg-red-500' :
                  pin.length > i ? 'border-[#088fc3] bg-[#088fc3]' : 'border-white/20 bg-transparent'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9,'⌫',0,''].map((k, i) => (
                k === '' ? <div key={i} /> :
                <button key={i} onClick={() => {
                  if (k === '⌫') { setPin(p => p.slice(0,-1)); setPinError(false); return }
                  if (pin.length >= 4) return
                  const newPin = pin + k
                  setPin(newPin)
                  if (newPin.length === 4) confirmPin(newPin)
                }}
                  className={`h-12 rounded-xl font-bold text-lg cursor-pointer transition-all
                    ${k === '⌫' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/8 text-white hover:bg-white/15'}`}>
                  {k}
                </button>
              ))}
            </div>
            {pinError && <p className="text-red-400 text-xs text-center mt-3">PIN incorrecto</p>}
            <button onClick={() => { setShowPinModal(false); setPin(''); setPinError(false) }}
              className="w-full mt-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm cursor-pointer hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}