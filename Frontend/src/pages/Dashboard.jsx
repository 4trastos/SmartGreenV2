import { useState } from 'react'

const API_URL = 'http://localhost:8080/api'

function coolerStatus(c) {
  if (c.alarm_fault || c.fault_present) return 'fault'
  if (c.alarm_comms || c.disabled) return 'offline'
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

function MiniChart({ value, status }) {
  const bars = [3,5,4,6,5,7,value]
  const color = status === 'active' ? '#088fc3' : status === 'fault' ? '#ef4444' : status === 'warning' ? '#eab308' : '#ffffff30'
  return (
    <div className="flex items-end gap-0.5 h-8">
      {bars.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm"
          style={{ height: `${Math.max(15,(v/10)*100)}%`, backgroundColor: i===bars.length-1 ? color : color+'50' }} />
      ))}
    </div>
  )
}

function CoolerCard({ cooler, onClick }) {
  const st = STATUS[coolerStatus(cooler)]
  const s = coolerStatus(cooler)
  return (
    <div onClick={() => onClick(cooler)}
      className={`relative rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
          <span className="text-white text-lg font-black">#{cooler.unit_id}</span>
          <span className="text-white/20 text-xs">Z{cooler.zone_id}</span>
        </div>
        <span className={`text-xs font-bold tracking-wider ${st.lc}`}>{st.label}</span>
      </div>
      <div className="flex items-end justify-between gap-3 mb-3">
        <MiniChart value={cooler.actual_fan_speed} status={s} />
        <div className="text-right shrink-0">
          <p className={`text-2xl font-black font-mono leading-none ${st.lc}`}>{cooler.actual_fan_speed}</p>
          <p className="text-white/20 text-xs">/10</p>
        </div>
      </div>
      <div className="flex gap-2 text-xs">
        <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5">Agua</p>
          <p className={cooler.water_present ? 'text-[#088fc3] font-bold' : 'text-yellow-400 font-bold'}>{cooler.water_present ? '●' : '○'}</p>
        </div>
        <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5">μS</p>
          <p className="text-white font-mono font-bold">{cooler.salinity_us.toFixed(0)}</p>
        </div>
        <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5">h</p>
          <p className="text-white/60 font-mono">{cooler.hours_running.toFixed(0)}</p>
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
        <span className={cooler.water_present ? 'text-[#088fc3]' : 'text-yellow-400'}>{cooler.water_present ? '● Agua' : '○ Seco'}</span>
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
      className={`flex-1 rounded-3xl border cursor-pointer overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-6 flex flex-col`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-1">Cooler principal</p>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${st.dot}`} />
            <p className="text-white text-5xl font-black leading-none">#{cooler.unit_id}</p>
          </div>
          <p className="text-white/20 text-sm mt-1">Zona {cooler.zone_id}</p>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${st.lc} border-current bg-current/10`}>{st.label}</span>
          <p className={`text-6xl font-black font-mono mt-3 leading-none ${st.lc}`}>{cooler.actual_fan_speed}<span className="text-2xl text-white/20">/10</span></p>
        </div>
      </div>
      <div className="flex-1 flex items-end gap-1 mb-4">
        {[3,5,4,6,5,7,6,8,cooler.actual_fan_speed].map((v,i) => (
          <div key={i} className="flex-1 rounded-t-lg"
            style={{ height: `${Math.max(10,(v/10)*100)}%`, backgroundColor: i===8 ? (s==='active'?'#088fc3':s==='fault'?'#ef4444':'#eab308') : '#ffffff15' }} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Agua', v: cooler.water_present ? 'Presente' : 'Sin agua', c: cooler.water_present ? 'text-[#088fc3]' : 'text-yellow-400' },
          { l:'Salinidad', v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white' },
          { l:'PPM', v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white' },
          { l:'Horas', v:`${cooler.hours_running.toFixed(0)} h`, c:'text-white/50' },
        ].map(({l,v,c}) => (
          <div key={l} className="bg-black/25 rounded-xl p-3 text-center">
            <p className="text-white/25 text-xs uppercase tracking-wider mb-1">{l}</p>
            <p className={`font-bold text-sm ${c}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CoolerDetail({ cooler, onClose }) {
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
        className={`w-[420px] rounded-3xl border p-6 bg-[#060c12] shadow-2xl ${st.border}`}>
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-white/25 text-xs tracking-widest uppercase mb-1">Cooler · Zona {cooler.zone_id}</p>
            <p className="text-white text-3xl font-black">#{cooler.unit_id}</p>
            <p className={`text-sm font-bold mt-1 ${st.lc}`}>{st.label}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>
        <div className="bg-white/3 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/40 text-xs uppercase tracking-wider">Velocidad</span>
            <span className={`font-black font-mono text-2xl ${st.lc}`}>{speed}<span className="text-white/25 text-sm">/10</span></span>
          </div>
          <div className="flex gap-1">
            {Array.from({length:11}).map((_,i) => (
              <button key={i} onClick={()=>sendSpeed(i)}
                className={`flex-1 h-9 rounded-lg transition-all cursor-pointer text-xs font-bold
                  ${i===speed?'bg-[#088fc3] text-white':i<speed?'bg-[#004d89]/50 text-[#088fc3]':'bg-white/5 text-white/20 hover:bg-white/8'}`}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            {l:'Agua', v:cooler.water_present?'● Presente':'○ Sin agua', c:cooler.water_present?'text-[#088fc3]':'text-yellow-400'},
            {l:'Salinidad', v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white'},
            {l:'PPM', v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white'},
            {l:'Bomba', v:cooler.pump_on?'ON':'OFF', c:cooler.pump_on?'text-[#088fc3]':'text-white/30'},
            {l:'Solenoide', v:cooler.solenoid_on?'ON':'OFF', c:cooler.solenoid_on?'text-[#088fc3]':'text-white/30'},
            {l:'Horas', v:`${cooler.hours_running.toFixed(0)} h`, c:'text-white/60'},
          ].map(({l,v,c}) => (
            <div key={l} className="bg-white/4 rounded-xl p-3 text-center">
              <p className="text-white/25 text-xs uppercase tracking-wider mb-1">{l}</p>
              <p className={`font-bold text-sm ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Pantalla de espera DENTRO del dashboard
function DashboardLoading({ connected }) {
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

export default function Dashboard({ data, connected }) {
  const [selected, setSelected] = useState(null)

  const hasData = connected && data.coolers.length > 0 && data.coolers.some(c => !c.disabled && c.last_read > 0)
  const n = hasData ? data.coolers.length : 0

  const Card = n <= 4 ? CoolerCard : n <= 20 ? CoolerMini : CoolerNano
  const gridClass = n <= 4 ? 'grid-cols-2' : n <= 9 ? 'grid-cols-3' : n <= 16 ? 'grid-cols-4' : n <= 25 ? 'grid-cols-5' : 'grid-cols-6'

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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
                  ${z.on_off==='ON'?'bg-[#004d89]/25 border-[#088fc3]/35 text-[#088fc3]':'bg-white/3 border-white/8 text-white/25'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${z.on_off==='ON'?'bg-[#088fc3]':'bg-white/15'}`} />
                Zona {z.zone_id} · {z.on_off} · {z.cool_fan_mode} · {z.fan_speed_cmd}/10 · {z.target_temp}°C
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-xs text-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#088fc3]" />
              Modbus · {n} {n===1?'equipo':'equipos'}
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {!hasData ? (
          <DashboardLoading connected={connected} />
        ) : n === 1 ? (
          <div className="flex-1 flex">
            <SingleHero cooler={data.coolers[0]} onClick={setSelected} />
          </div>
        ) : (
          <div className={`flex-1 overflow-y-auto grid ${gridClass} gap-3 content-start`}>
            {data.coolers.map(c => <Card key={c.unit_id} cooler={c} onClick={setSelected} />)}
          </div>
        )}

        {/* Action bar — solo si hay datos */}
        {hasData && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => toggleAll('ON')}
              className="flex-1 py-2 rounded-xl bg-[#004d89]/40 border border-[#088fc3]/30 text-[#088fc3] text-sm font-bold cursor-pointer hover:bg-[#004d89]/60 transition-all">
              ▶ Encender todo
            </button>
            <button onClick={() => toggleAll('OFF')}
              className="flex-1 py-2 rounded-xl bg-white/4 border border-white/10 text-white/40 text-sm font-bold cursor-pointer hover:bg-white/8 transition-all">
              ■ Apagar todo
            </button>
            <button className="flex-1 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 text-sm font-bold cursor-pointer hover:bg-yellow-500/15 transition-all">
              ◈ Modo test
            </button>
          </div>
        )}
      </div>

      {/* Right panel — solo AMBIENTE */}
      <div className="w-48 shrink-0 border-l border-white/5 p-4 flex flex-col gap-4 bg-[#070d14]/50">
        <p className="text-white/20 text-xs font-bold tracking-widest uppercase">Ambiente</p>
        {!hasData ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/15 text-xs text-center">Sin datos de sensores</p>
          </div>
        ) : (
          data.sensors.map(s => (
            <div key={s.sensor_id} className="bg-white/3 rounded-2xl p-4 border border-white/6 flex-1">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[#088fc3] text-xs font-bold tracking-wider">{s.type==='EXT'?'EXTERIOR':'INTERIOR'}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${s.valid?'bg-[#088fc3] shadow-[0_0_6px_#088fc3]':'bg-red-500'}`} />
              </div>
              {s.valid ? (
                <>
                  <p className="text-[#088fc3] text-4xl font-black font-mono leading-none">{s.temperature}<span className="text-2xl">°</span></p>
                  <p className="text-white/20 text-xs mb-4">temperatura</p>
                  <p className="text-white text-3xl font-black font-mono leading-none">{s.humidity}<span className="text-lg text-white/25">%</span></p>
                  <p className="text-white/20 text-xs mb-2">humedad</p>
                  <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-[#088fc3]/60 rounded-full" style={{width:`${s.humidity}%`}} />
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

      {selected && <CoolerDetail cooler={selected} onClose={()=>setSelected(null)} />}
    </div>
  )
}
