import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import Keyboard from '../components/Keyboard'

export default function Control({ data, onImdActivate }) {
  const zones = data.zones.length > 0 ? data.zones : [
    { zone_id: 1, on_off: 'ON', fan_speed_cmd: 7, target_temp: 25.0, cool_fan_mode: 'AUTO', humidity_min: 60, humidity_max: 70, humidity_control: 1  },
    { zone_id: 2, on_off: 'OFF', fan_speed_cmd: 3, target_temp: 22.0, cool_fan_mode: 'AUTO', humidity_min: 60, humidity_max: 70, humidity_control: 1  }
  ]

  const [localZones, setLocalZones] = useState(zones)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [pendingZoneId, setPendingZoneId] = useState(null)
  const [showPinKeyboard, setShowPinKeyboard] = useState(false)

  useEffect(() => {
    if (data.zones.length > 0)
      setLocalZones([...data.zones])
  }, [JSON.stringify(data.zones)])

  const handleModeClick = async (zoneId, mode) => {
    if (mode === 'IMD') {
      setPendingZoneId(zoneId)
      setPin('')
      setPinError(false)
      setShowPinModal(true)
    } else {
      setMode(zoneId, mode)
    }
  }

  const confirmPin = async () => {
    const res = await fetch(`${API_URL}/imd/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    })
    if (res.ok) {
      setShowPinModal(false)
      setMode(pendingZoneId, 'IMD')
      onImdActivate(pendingZoneId)
    } else {
      setPinError(true)
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
  }

  const setFanSpeed = async (zoneId, speed) => {
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, fan_speed_cmd: speed } : z))
    await fetch(`${API_URL}/zones/${zoneId}/fanspeed`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    })
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
    const current = parseFloat(zone[key]) || (type === 'min' ? 60 : 70)  // ← default si undefined
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

  return (
    <>
    <div className="h-full flex flex-col p-6 gap-4">
      <p className="text-white/30 text-xs font-bold tracking-widest uppercase shrink-0">Control de zonas</p>
      <div className="flex gap-4 flex-1">
        {localZones.map(zone => {
          const fSpeed = zone.on_off === 'ON' ? zone.fan_speed_cmd : 0
          return (
            <div key={zone.zone_id}
              className={`flex-1 rounded-3xl border p-6 flex flex-col gap-6 transition-all duration-300
                ${zone.on_off === 'ON' ? 'bg-[#004d89]/20 border-[#088fc3]/40' : 'bg-white/2 border-white/8'}`}>

              {/* Header */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[#088fc3] text-xs font-bold tracking-widest uppercase">Zona</p>
                  <p className="text-white text-4xl font-black">{zone.zone_id}</p>
                </div>
                <button onClick={() => toggle(zone.zone_id)}
                  className={`relative w-16 h-8 rounded-full transition-all duration-300 cursor-pointer
                    ${zone.on_off === 'ON' ? 'bg-[#088fc3] shadow-[0_0_20px_#088fc340]' : 'bg-white/10'}`}>
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300
                    ${zone.on_off === 'ON' ? 'left-9' : 'left-1'}`} />
                </button>
              </div>

              {/* Aviso modo FAN */}
              {zone.cool_fan_mode === 'FAN' && zone.on_off === 'ON' && (
                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-black tracking-wide">
                  ⚠️ MODO VENTILACIÓN — NO está enfriando
                </div>
              )}

              {/* Fan speed */}
              {(zone.cool_fan_mode === 'MANUAL' ||  zone.cool_fan_mode === 'FAN') && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/40 text-xs uppercase tracking-wider">Velocidad</span>
                  <span className="text-[#088fc3] font-mono font-black text-2xl">{fSpeed}<span className="text-white/30 text-sm">/10</span></span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <button key={i} onClick={() => setFanSpeed(zone.zone_id, i)}
                      className={`flex-1 h-10 rounded-lg transition-all cursor-pointer font-bold text-sm
                        ${i === fSpeed
                          ? 'bg-[#088fc3] text-white shadow-[0_0_10px_#088fc360]'
                          : i < fSpeed
                            ? 'bg-[#004d89]/60 text-[#088fc3]'
                            : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>
                      {i}
                    </button>
                  ))}
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
              </div>

              {/* Humedad máxima — solo en modo AUTO */}
              {zone.cool_fan_mode === 'AUTO' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/40 text-xs uppercase tracking-wider">
                      Humedad máxima
                    </span>

                    <button
                      onClick={() => toggleHumidityControl(zone.zone_id)}
                      className={`relative w-10 h-5 rounded-full transition-all cursor-pointer
                        ${zone.humidity_control ? 'bg-[#088fc3]' : 'bg-white/10'}`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
                          ${zone.humidity_control ? 'left-5' : 'left-0.5'}`}
                      />
                    </button>
                  </div>

                  {zone.humidity_control ? (
                    <div className="flex items-center gap-3">

                      <button
                        onClick={() => setHumidity(zone.zone_id, 'max', -5)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 cursor-pointer flex items-center justify-center"
                      >
                        −
                      </button>

                      <span className="text-white font-mono font-bold flex-1 text-center">
                        {zone.humidity_max}%
                      </span>

                      <button
                        onClick={() => setHumidity(zone.zone_id, 'max', 5)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>

                    </div>
                  ) : (
                    <p className="text-white/20 text-xs">
                      Control de humedad desactivado
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    {/* Modal PIN - IMD */}
    {showPinModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg"
        onClick={() => setShowPinModal(false)}>
        <div onClick={e => e.stopPropagation()}
          className="w-[320px] rounded-3xl border border-red-500/30 p-6 bg-[#060c12] shadow-2xl">
          <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Acceso restringido</p>
          <p className="text-white text-2xl font-black mb-6">Modo IMD</p>
          <input value={pin}
            readOnly
            onFocus={() => setShowPinKeyboard(true)}
            onClick={e => { e.stopPropagation(); setShowPinKeyboard(true) }}
            onTouchStart={e => e.stopPropagation()}
            placeholder="PIN técnico"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-widest mb-2
              ${pinError ? 'border-red-500/60' : 'border-white/10'}`} />
          {pinError && <p className="text-red-400 text-xs text-center mb-4">PIN incorrecto</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowPinModal(false)}
              className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold cursor-pointer">
              Cancelar
            </button>
            <button onClick={confirmPin}
              className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold cursor-pointer">
              Acceder
            </button>
          </div>
          {showPinKeyboard && (
            <Keyboard
              value={pin}
              onChange={val => setPin(val)}
              onClose={() => setShowPinKeyboard(false)}
              numeric={true}
            />
          )}
        </div>
      </div>
    )}
    </>
  )
}
