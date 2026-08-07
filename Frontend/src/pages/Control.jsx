import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'

export default function Control({ data }) {
  const zones = data.zones.length > 0 ? data.zones : [
    { zone_id: 1, on_off: 'ON', fan_speed_cmd: 7, target_temp: 25.0, cool_fan_mode: 'AUTO' },
    { zone_id: 2, on_off: 'OFF', fan_speed_cmd: 3, target_temp: 22.0, cool_fan_mode: 'MANUAL' }
  ]

  const [localZones, setLocalZones] = useState(zones)

  useEffect(() => {
    if (data.zones.length > 0)
      setLocalZones([...data.zones])
  }, [JSON.stringify(data.zones)])

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
    await fetch(`${API_URL}/config`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: `target_temp_zone_${zoneId}`, value: newTemp })
    })
  }

  const setMode = async (zoneId, mode) => {
    setLocalZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, cool_fan_mode: mode } : z))
    await fetch(`${API_URL}/zones/${zoneId}/mode`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    })
  }

  const MODES = ['AUTO', 'MANUAL', 'FAN', 'IMD']

  return (
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

              {/* Fan speed */}
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

              {/* Target temp */}
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

              {/* Mode */}
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-3">Modo</span>
                <div className="grid grid-cols-4 gap-2">
                  {MODES.map(m => (
                    <button key={m} onClick={() => setMode(zone.zone_id, m)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                        ${zone.cool_fan_mode === m
                          ? 'bg-[#088fc3] text-white'
                          : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
