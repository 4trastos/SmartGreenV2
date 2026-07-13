import { useState } from 'react'

const API_URL = 'http://localhost:8080/api'

const mockData = {
  coolers: [
    { unit_id: 2, zone_id: 1, fan_on: 1, water_present: 9, salinity_us: 711, actual_fan_speed: 7, alarm_fault: 0, alarm_water: 0, alarm_comms: 0, alarm_warranty: 0, hours_running: 1250.5, fault_present: 0, salinity_ppm: 391, cool_mode_on: 1 },
    { unit_id: 3, zone_id: 1, fan_on: 0, water_present: 0, salinity_us: 0, actual_fan_speed: 0, alarm_fault: 0, alarm_water: 1, alarm_comms: 0, alarm_warranty: 0, hours_running: 980.2, fault_present: 0, salinity_ppm: 0, cool_mode_on: 0 },
    { unit_id: 4, zone_id: 2, fan_on: 1, water_present: 5, salinity_us: 420, actual_fan_speed: 5, alarm_fault: 0, alarm_water: 0, alarm_comms: 0, alarm_warranty: 0, hours_running: 2100.0, fault_present: 0, salinity_ppm: 280, cool_mode_on: 1 },
    { unit_id: 5, zone_id: 2, fan_on: 1, water_present: 3, salinity_us: 890, actual_fan_speed: 8, alarm_fault: 0, alarm_water: 0, alarm_comms: 0, alarm_warranty: 1, hours_running: 3500.0, fault_present: 0, salinity_ppm: 512, cool_mode_on: 1 },
    { unit_id: 6, zone_id: 2, fan_on: 0, water_present: 0, salinity_us: 0, actual_fan_speed: 0, alarm_fault: 1, alarm_water: 0, alarm_comms: 0, alarm_warranty: 0, hours_running: 150.0, fault_present: 1, salinity_ppm: 0, cool_mode_on: 0 },
  ],
  sensors: [
    { sensor_id: 177, type: 'EXT', temperature: 32.4, humidity: 38.1, valid: 1 },
    { sensor_id: 178, type: 'INT', temperature: 24.7, humidity: 61.3, valid: 1 }
  ],
  zones: [
    { zone_id: 1, on_off: 'ON', fan_speed_cmd: 7, target_temp: 25.0, cool_fan_mode: 'COOL' },
    { zone_id: 2, on_off: 'ON', fan_speed_cmd: 5, target_temp: 22.0, cool_fan_mode: 'FAN' }
  ],
  status: { alarm_level: 1, alarm_text: '🟡 AVISO', modbus_connected: 1 }
}

function coolerStatus(c) {
  if (c.alarm_fault || c.fault_present) return 'fault'
  if (c.alarm_comms) return 'offline'
  if (c.alarm_water) return 'warning'
  if (c.alarm_warranty) return 'warranty'
  if (c.fan_on) return 'active'
  return 'idle'
}

const STATUS = {
  active:  { gradient: 'from-[#004d89]/40 to-[#088fc3]/10', border: 'border-[#088fc3]/35', dot: 'bg-[#088fc3] shadow-[0_0_10px_#088fc3]', label: 'ACTIVO',   lc: 'text-[#088fc3]' },
  idle:    { gradient: 'from-white/4 to-transparent',        border: 'border-white/8',       dot: 'bg-white/25',                              label: 'STANDBY',  lc: 'text-white/30' },
  warning: { gradient: 'from-yellow-900/30 to-transparent',  border: 'border-yellow-500/35', dot: 'bg-yellow-400 shadow-[0_0_10px_#eab308]',  label: 'SIN AGUA', lc: 'text-yellow-400' },
  fault:   { gradient: 'from-red-900/30 to-transparent',     border: 'border-red-500/40',    dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',     label: 'FALLO',    lc: 'text-red-400' },
  offline: { gradient: 'from-red-900/15 to-transparent',     border: 'border-red-500/20',    dot: 'bg-red-500/50',                            label: 'OFFLINE',  lc: 'text-red-400/60' },
  warranty:{ gradient: 'from-orange-900/25 to-transparent',  border: 'border-orange-500/35', dot: 'bg-orange-400 shadow-[0_0_10px_#f97316]',  label: 'GARANTÍA', lc: 'text-orange-400' },
}

// Mini bar chart — simulated history
function MiniChart({ value, status }) {
  const bars = [3,5,4,6,5,7,value].map((v,i) => i === 6 ? value : v)
  const color = status === 'active' ? '#088fc3' : status === 'fault' ? '#ef4444' : status === 'warning' ? '#eab308' : '#ffffff30'
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{
            height: `${Math.max(15, (v/10)*100)}%`,
            backgroundColor: i === bars.length-1 ? color : color + '50',
          }} />
      ))}
    </div>
  )
}

function CoolerCard({ cooler, onClick }) {
  const st = STATUS[coolerStatus(cooler)]
  const s = coolerStatus(cooler)
  return (
    <div onClick={() => onClick(cooler)}
      className={`relative rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:brightness-110 overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
            <span className="text-white text-lg font-black">#{cooler.unit_id}</span>
            <span className="text-white/20 text-xs">Z{cooler.zone_id}</span>
          </div>
          <span className={`text-xs font-bold tracking-wider ${st.lc}`}>{st.label}</span>
        </div>

        {/* Chart + speed */}
        <div className="flex items-end justify-between gap-3 mb-3">
          <MiniChart value={cooler.actual_fan_speed} status={s} />
          <div className="text-right shrink-0">
            <p className={`text-2xl font-black font-mono leading-none ${st.lc}`}>{cooler.actual_fan_speed}</p>
            <p className="text-white/20 text-xs">/10</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 text-xs">
          <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
            <p className="text-white/25 mb-0.5">Agua</p>
            <p className={cooler.water_present ? 'text-[#088fc3] font-bold' : 'text-yellow-400 font-bold'}>
              {cooler.water_present ? '●' : '○'}
            </p>
          </div>
          <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
            <p className="text-white/25 mb-0.5">μS</p>
            <p className="text-white font-mono font-bold">{cooler.salinity_us.toFixed(0)}</p>
          </div>
          <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
            <p className="text-white/25 mb-0.5">Horas</p>
            <p className="text-white/60 font-mono">{cooler.hours_running.toFixed(0)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CoolerMini({ cooler, onClick }) {
  const st = STATUS[coolerStatus(cooler)]
  const s = coolerStatus(cooler)
  return (
    <div onClick={() => onClick(cooler)}
      className={`rounded-xl border cursor-pointer transition-all duration-150 hover:brightness-110 overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-3`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          <span className="text-white font-bold text-sm">#{cooler.unit_id}</span>
        </div>
        <span className={`text-xs font-bold ${st.lc}`}>{st.label}</span>
      </div>
      <MiniChart value={cooler.actual_fan_speed} status={s} />
      <div className="flex justify-between mt-2 text-xs text-white/30">
        <span>{cooler.actual_fan_speed}/10</span>
        <span className={cooler.water_present ? 'text-[#088fc3]' : 'text-yellow-400'}>
          {cooler.water_present ? '● Agua' : '○ Seco'}
        </span>
        <span>{cooler.salinity_us.toFixed(0)}μS</span>
      </div>
    </div>
  )
}

function CoolerNano({ cooler, onClick }) {
  const st = STATUS[coolerStatus(cooler)]
  return (
    <div onClick={() => onClick(cooler)}
      className={`rounded-lg px-3 py-2 border cursor-pointer hover:brightness-110 flex items-center gap-2 bg-gradient-to-r ${st.gradient} ${st.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
      <span className="text-white text-xs font-mono font-bold">#{cooler.unit_id}</span>
      <div className="flex-1 flex gap-0.5 h-1">
        {Array.from({length:10}).map((_,i) => (
          <div key={i} className={`flex-1 rounded-full ${i < cooler.actual_fan_speed ? 'bg-[#088fc3]' : 'bg-white/10'}`} />
        ))}
      </div>
      <span className={`text-xs font-bold shrink-0 ${st.lc}`}>{cooler.actual_fan_speed}</span>
    </div>
  )
}

function SingleHero({ cooler, onClick }) {
  const st = STATUS[coolerStatus(cooler)]
  const s = coolerStatus(cooler)
  return (
    <div onClick={() => onClick(cooler)}
      className={`flex-1 rounded-3xl border cursor-pointer overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-8 flex flex-col`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-2">Cooler principal</p>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${st.dot}`} />
            <p className="text-white text-6xl font-black leading-none">#{cooler.unit_id}</p>
          </div>
          <p className="text-white/20 text-sm mt-2">Zona {cooler.zone_id} · {cooler.cool_mode_on ? 'Modo Frío' : 'Modo Ventilador'}</p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold px-4 py-2 rounded-full border ${st.lc} border-current bg-current/10`}>{st.label}</span>
          <p className={`text-7xl font-black font-mono mt-4 leading-none ${st.lc}`}>{cooler.actual_fan_speed}<span className="text-3xl text-white/20">/10</span></p>
          <p className="text-white/25 text-xs mt-1">velocidad actual</p>
        </div>
      </div>

      {/* Big chart */}
      <div className="flex-1 flex items-end gap-1 mb-6">
        {[3,5,4,6,5,7,6,8,cooler.actual_fan_speed].map((v,i) => (
          <div key={i} className="flex-1 rounded-t-lg transition-all"
            style={{
              height: `${Math.max(10,(v/10)*100)}%`,
              backgroundColor: i === 8 ? (s === 'active' ? '#088fc3' : s === 'fault' ? '#ef4444' : '#eab308') : '#ffffff15'
            }} />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { l: 'Agua', v: cooler.water_present ? 'Presente' : 'Sin agua', c: cooler.water_present ? 'text-[#088fc3]' : 'text-yellow-400' },
          { l: 'Salinidad', v: `${cooler.salinity_us.toFixed(0)} μS`, c: 'text-white' },
          { l: 'Concentración', v: `${cooler.salinity_ppm?.toFixed(0)||0} ppm`, c: 'text-white' },
          { l: 'Horas totales', v: `${cooler.hours_running.toFixed(0)} h`, c: 'text-white/50' },
        ].map(({l,v,c}) => (
          <div key={l} className="bg-black/25 rounded-2xl p-4 text-center">
            <p className="text-white/25 text-xs uppercase tracking-wider mb-2">{l}</p>
            <p className={`font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoolerDetail({ cooler, onClose, onToggleZone }) {
  const [speed, setSpeed] = useState(cooler.actual_fan_speed)
  const st = STATUS[coolerStatus(cooler)]

  const sendSpeed = async s => {
    setSpeed(s)
    await fetch(`${API_URL}/zones/${cooler.zone_id}/fanspeed`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({speed:s})
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        className={`w-[480px] rounded-3xl border p-7 bg-[#060c12] shadow-2xl bg-gradient-to-b from-[#0a1628] to-[#060c12] ${st.border}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-white/25 text-xs tracking-widest uppercase mb-1">Detalle · Zona {cooler.zone_id}</p>
            <p className="text-white text-4xl font-black">Cooler #{cooler.unit_id}</p>
            <p className={`text-sm font-bold mt-1 ${st.lc}`}>{st.label} · {cooler.hours_running.toFixed(0)} h</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer transition-all">✕</button>
        </div>

        {/* Speed control */}
        <div className="bg-white/3 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/40 text-xs uppercase tracking-wider">Velocidad ventilador</span>
            <span className={`font-black font-mono text-2xl ${st.lc}`}>{speed}<span className="text-white/25 text-sm">/10</span></span>
          </div>
          <div className="flex gap-1">
            {Array.from({length:11}).map((_,i) => (
              <button key={i} onClick={()=>sendSpeed(i)}
                className={`flex-1 h-10 rounded-xl transition-all cursor-pointer text-xs font-bold
                  ${i===speed ? 'bg-[#088fc3] text-white shadow-[0_0_15px_#088fc340]'
                    : i<speed ? 'bg-[#004d89]/50 text-[#088fc3]'
                    : 'bg-white/5 text-white/20 hover:bg-white/8'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {l:'Agua', v: cooler.water_present ? '● Presente' : '○ Sin agua', c: cooler.water_present ? 'text-[#088fc3]' : 'text-yellow-400'},
            {l:'Salinidad', v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white'},
            {l:'PPM', v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white'},
            {l:'Bomba', v: cooler.pump_on ? 'ON' : 'OFF', c: cooler.pump_on ? 'text-[#088fc3]' : 'text-white/30'},
            {l:'Solenoide', v: cooler.solenoid_on ? 'ON' : 'OFF', c: cooler.solenoid_on ? 'text-[#088fc3]' : 'text-white/30'},
            {l:'Errores', v: cooler.error_count||0, c: (cooler.error_count||0) > 0 ? 'text-red-400' : 'text-white/30'},
          ].map(({l,v,c}) => (
            <div key={l} className="bg-white/4 rounded-xl p-3 text-center">
              <p className="text-white/25 text-xs uppercase tracking-wider mb-1">{l}</p>
              <p className={`font-bold text-sm ${c}`}>{v}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#004d89]/40 border border-[#088fc3]/30 text-[#088fc3] text-sm font-bold cursor-pointer hover:bg-[#004d89]/60 transition-all">
            Cerrar
          </button>
          <button className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm font-bold cursor-pointer hover:bg-white/8 transition-all">
            Ver historial
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ data, connected }) {
  const d = connected && data.coolers.length > 0 ? data : mockData
  const [selected, setSelected] = useState(null)
  const n = d.coolers.length

  const Card = n <= 4 ? CoolerCard : n <= 20 ? CoolerMini : CoolerNano
  const gridClass = n === 1 ? '' : n <= 4 ? 'grid-cols-2' : n <= 9 ? 'grid-cols-3' : n <= 16 ? 'grid-cols-4' : n <= 25 ? 'grid-cols-5' : 'grid-cols-6'

  // Action buttons bottom
  const allOn = d.zones.every(z => z.on_off === 'ON')
  const toggleAll = async (action) => {
    for (const z of d.zones) {
      await fetch(`${API_URL}/zones/${z.zone_id}/onoff`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action})
      })
    }
  }

  return (
    <div className="h-full flex gap-0">
      {/* Main */}
      <div className="flex-1 flex flex-col p-5 gap-3 overflow-hidden min-w-0">
        {/* Zone pills */}
        <div className="flex gap-2 flex-wrap items-center shrink-0">
          {d.zones.map(z => (
            <div key={z.zone_id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
                ${z.on_off==='ON' ? 'bg-[#004d89]/25 border-[#088fc3]/35 text-[#088fc3]' : 'bg-white/3 border-white/8 text-white/25'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${z.on_off==='ON' ? 'bg-[#088fc3] shadow-[0_0_6px_#088fc3]' : 'bg-white/15'}`} />
              Zona {z.zone_id} · {z.on_off} · {z.cool_fan_mode} · {z.fan_speed_cmd}/10 · {z.target_temp}°C
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-white/20">
            <span className={`w-1.5 h-1.5 rounded-full ${d.status?.modbus_connected ? 'bg-[#088fc3]' : 'bg-red-500'}`} />
            Modbus · {n} {n===1?'equipo':'equipos'}
          </div>
        </div>

        {/* Coolers */}
        <div className="flex-1 overflow-y-auto">
          {n === 1 ? (
            <div className="h-full flex">
              <SingleHero cooler={d.coolers[0]} onClick={setSelected} />
            </div>
          ) : (
            <div className={`grid ${gridClass} gap-3 content-start`}>
              {d.coolers.map(c => <Card key={c.unit_id} cooler={c} onClick={setSelected} />)}
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="flex gap-2 shrink-0">
          <button onClick={() => toggleAll('ON')}
            className="flex-1 py-2.5 rounded-xl bg-[#004d89]/40 border border-[#088fc3]/30 text-[#088fc3] text-sm font-bold cursor-pointer hover:bg-[#004d89]/60 transition-all">
            ▶ Encender todo
          </button>
          <button onClick={() => toggleAll('OFF')}
            className="flex-1 py-2.5 rounded-xl bg-white/4 border border-white/10 text-white/40 text-sm font-bold cursor-pointer hover:bg-white/8 transition-all">
            ■ Apagar todo
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-sm font-bold cursor-pointer hover:bg-yellow-500/15 transition-all">
            ◈ Modo test
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-52 shrink-0 border-l border-white/5 p-4 flex flex-col gap-3 bg-[#070d14]/50">
        <p className="text-white/20 text-xs font-bold tracking-widest uppercase">Ambiente</p>
        {d.sensors.map(s => (
          <div key={s.sensor_id} className="bg-white/3 rounded-2xl p-4 border border-white/6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[#088fc3] text-xs font-bold tracking-wider">{s.type==='EXT'?'EXTERIOR':'INTERIOR'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${s.valid ? 'bg-[#088fc3] shadow-[0_0_6px_#088fc3]' : 'bg-red-500'}`} />
            </div>
            <p className="text-[#088fc3] text-3xl font-black font-mono leading-none">{s.temperature}<span className="text-xl">°</span></p>
            <p className="text-white/20 text-xs mb-3">temperatura</p>
            <p className="text-white text-2xl font-black font-mono leading-none">{s.humidity}<span className="text-sm text-white/25">%</span></p>
            <p className="text-white/20 text-xs mb-2">humedad</p>
            <div className="h-0.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#088fc3]/60 rounded-full transition-all" style={{width:`${s.humidity}%`}} />
            </div>
          </div>
        ))}

        <div className="mt-auto space-y-1.5">
          <p className="text-white/20 text-xs font-bold tracking-widest uppercase mb-2">Resumen</p>
          {[
            {l:'Activos',    v:d.coolers.filter(c=>c.fan_on).length,                                            c:'text-[#088fc3]'},
            {l:'En espera',  v:d.coolers.filter(c=>!c.fan_on).length,                                           c:'text-white/30'},
            {l:'Con alarma', v:d.coolers.filter(c=>c.alarm_fault||c.alarm_water||c.alarm_comms).length,         c:'text-yellow-400'},
            {l:'Fallos',     v:d.coolers.filter(c=>c.fault_present).length,                                     c:'text-red-400'},
          ].map(({l,v,c}) => (
            <div key={l} className="flex justify-between items-center py-1.5 border-b border-white/4">
              <span className="text-white/25 text-xs">{l}</span>
              <span className={`font-bold font-mono ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {selected && <CoolerDetail cooler={selected} onClose={()=>setSelected(null)} />}
    </div>
  )
}
