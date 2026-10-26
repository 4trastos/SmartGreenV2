import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'

function coolerStatus(c, zone) {
  if (Number(c.broken_cooler) === 1) return 'broken'
  if (Number(c.comms_lost) === 1) return 'nocomms'
  if (zone?.on_off === 'ON' && Number(c.user_off) === 1) return 'useroff'
  if (Number(c.fault_solenoid) === 1 || Number(c.fault_pump) === 1) return 'fanonly'
  if (c.alarm_fault || c.fault_present) return 'fault'
  if (c.alarm_comms || c.disabled) return 'offline'
  if (c.alarm_water && c.salinity_us <= 10) return 'warning'
  if (c.alarm_warranty) return 'warranty'
  if (zone?.on_off === 'ON') return 'active'
  return 'idle'
}

const fanSpeed = (cooler, zone) => isCoolerOn(cooler, zone) && !Number(cooler.broken_cooler) && !Number(cooler.comms_lost) ? cooler.actual_fan_speed : 0

const STATUS = {
  active:  { gradient: 'from-[#004d89]/40 to-[#088fc3]/10',  border: 'border-[#088fc3]/35',  dot: 'bg-[#088fc3] shadow-[0_0_10px_#088fc3]',   label: 'ACTIVO',   lc: 'text-[#088fc3]' },
  idle:    { gradient: 'from-white/4 to-transparent',        border: 'border-white/8',       dot: 'bg-white/25',                              label: 'OFF',      lc: 'text-white/30' },
  warning: { gradient: 'from-yellow-900/30 to-transparent',  border: 'border-yellow-500/35', dot: 'bg-yellow-400 shadow-[0_0_10px_#eab308]',  label: 'SIN AGUA', lc: 'text-yellow-400' },
  fault:   { gradient: 'from-red-900/30 to-transparent',     border: 'border-red-500/40',    dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',     label: 'FALLO',    lc: 'text-red-400' },
  offline: { gradient: 'from-red-900/15 to-transparent',     border: 'border-red-500/20',    dot: 'bg-red-500/50',                            label: 'OFFLINE',  lc: 'text-red-400/60' },
  warranty:{ gradient: 'from-orange-900/25 to-transparent',  border: 'border-orange-500/35', dot: 'bg-orange-400 shadow-[0_0_10px_#f97316]',  label: 'GARANTÍA', lc: 'text-orange-400' },
  broken:  { gradient: 'from-red-900/40 to-transparent',     border: 'border-red-500/60',    dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',     label: 'AVERÍA',            lc: 'text-red-400' },
  nocomms: { gradient: 'from-red-900/25 to-transparent',     border: 'border-red-500/40',    dot: 'bg-red-500/60',                            label: 'SIN COMUNICACIÓN',  lc: 'text-red-400' },
  fanonly: { gradient: 'from-yellow-900/30 to-transparent',  border: 'border-yellow-500/40', dot: 'bg-yellow-400 shadow-[0_0_10px_#eab308]',  label: 'SOLO FAN',          lc: 'text-yellow-400' },
  useroff: { gradient: 'from-white/4 to-transparent', border: 'border-white/15', dot: 'bg-white/40', label: 'APAGADO', lc: 'text-white/40' },
}

const formatHours = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
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

// Estado de un evaporativo dentro de su zona
const isCoolerOn = (cooler, zone) => zone?.on_off === 'ON' && !Number(cooler.user_off)

// Botón ■/▶ de un evaporativo: con la zona apagada, enciende la ZONA (el encendido es siempre de zona);
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

const toggleLabel = (cooler, zone) =>
  zone?.on_off !== 'ON' ? '▶ Encender la zona' : Number(cooler.user_off) ? '▶ Encender este' : '■ Apagar este'

function CoolerCard({ cooler, onClick, toggleCooler, zone }) {
  const st = STATUS[coolerStatus(cooler, zone)]
  const s = coolerStatus(cooler, zone)
  const isOn = zone?.on_off === 'ON'
  const toggleOnOff = async (e) => { e.stopPropagation(); await coolerToggle(cooler, zone) }

  return (
    <div onClick={() => onClick(cooler)}
      className={`relative rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-4`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
          <span className="text-white text-lg font-black">{cooler.model || `#${cooler.unit_id}`}</span>
          <span className="text-white/20 text-xs">Z{cooler.zone_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-wider ${st.lc}`}>{st.label}</span>
          <button onClick={toggleOnOff}
            className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-all
              ${isOn ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-[#004d89]/40 text-[#088fc3] hover:bg-[#004d89]/60'}`}>
              {isOn ? '■' : '▶'}
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 mb-3">
        <MiniChart value={fanSpeed(cooler, zone)} status={s} />
        <div className="text-right shrink-0">
          <p className={`text-2xl font-black font-mono leading-none ${st.lc}`}>{fanSpeed(cooler, zone)}</p>
          <p className="text-white/20 text-xs">/10</p>
        </div>
      </div>
      {zone?.cool_fan_mode === 'FAN' && zone?.on_off === 'ON' && (
        <div className="w-full text-center py-1 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-bold mb-2">
          ⚠️ No enfría
        </div>
      )}
      <div className="flex gap-2 text-xs">
        <div className="flex-1 bg-black/20 rounded-lg p-2 text-center">
          <p className="text-white/25 mb-0.5">Agua</p>
          <p className={cooler.alarm_water ? 'text-yellow-400 font-bold' : 'text-[#088fc3] font-bold'}>{cooler.alarm_water ? '○' : '●'}</p>
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

function CoolerMini({ cooler, onClick, toggleCooler, zone }) {
  const st = STATUS[coolerStatus(cooler, zone)]
  const s = coolerStatus(cooler, zone)
  const isOn = zone?.on_off === 'ON'
  const toggleOnOff = async (e) => { e.stopPropagation(); await coolerToggle(cooler, zone) }
  return (
    <div onClick={() => onClick(cooler)}
      className={`rounded-xl border cursor-pointer transition-all duration-150 hover:brightness-110 overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-3`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          <span className="text-white font-bold text-sm">#{cooler.unit_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${st.lc}`}>{st.label}</span>
          <button onClick={toggleOnOff}
            className={`w-6 h-6 rounded-lg text-xs font-bold cursor-pointer transition-all
              ${isOn ? 'bg-red-500/20 text-red-400' : 'bg-[#004d89]/40 text-[#088fc3]'}`}>
            {isOn ? '■' : '▶'}
          </button>
        </div>
      </div>
      <MiniChart value={fanSpeed(cooler, zone)} status={s} />
      <div className="flex justify-between mt-2 text-xs text-white/30">
        <span>{fanSpeed(cooler, zone)}/10</span>
        <span className={cooler.alarm_water ? 'text-yellow-400' : 'text-[#088fc3]'}>{cooler.alarm_water ? '○ Seco' : '● Agua'}</span>
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
          <div key={i} className={`flex-1 rounded-full ${i < fanSpeed(cooler, zone) ? 'bg-[#088fc3]' : 'bg-white/10'}`} />
        ))}
      </div>
      <span className={`text-xs font-bold shrink-0 ${st.lc}`}>{fanSpeed(cooler, zone)}</span>
    </div>
  )
}

function SingleHero({ cooler, onClick, toggleCooler, zone }) {
  const st = STATUS[coolerStatus(cooler, zone)]
  const s = coolerStatus(cooler, zone)
  const isOn = zone?.on_off === 'ON'
  const mode = zone?.cool_fan_mode || 'AUTO'

  return (
    <div onClick={() => onClick(cooler)}
      className={`flex-1 rounded-3xl border cursor-pointer overflow-hidden bg-gradient-to-br ${st.gradient} ${st.border} p-6 flex flex-col`}>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-white/30 text-xs font-bold tracking-widest uppercase mb-1">Cooler principal</p>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${st.dot}`} />
            <p className="text-white text-3xl font-black leading-none">{cooler.model || `#${cooler.unit_id}`}</p>
          </div>
          <p className="text-white/20 text-sm mt-1">#{cooler.unit_id} · {zone?.name || `Zona ${cooler.zone_id}`}</p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); coolerToggle(cooler, zone) }}
            className={`px-5 py-2 rounded-xl font-bold text-sm cursor-pointer
              ${isOn
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                : 'bg-[#004d89]/40 border border-[#088fc3]/40 text-[#088fc3] hover:bg-[#004d89]/60'}`}>
            {toggleLabel(cooler, zone)}
          </button>
          <p className={`text-6xl font-black font-mono leading-none ${st.lc}`}>
            {fanSpeed(cooler, zone)}<span className="text-2xl text-white/20">/10</span>
          </p>
        </div>
      </div>

      {/* Aviso FAN */}
      {mode === 'FAN' && isOn && (
        <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 text-sm font-black tracking-wide mb-4">
          ⚠️ VENTILACIÓN — No enfría
        </div>
      )}

      {/* Modo + temp objetivo */}
      <div className="flex gap-3 mb-4">
        <div className={`flex-1 rounded-xl p-3 text-center border
          ${mode === 'AUTO' ? 'bg-[#088fc3]/15 border-[#088fc3]/30' :
            mode === 'MANUAL' ? 'bg-white/8 border-white/15' :
            'bg-yellow-500/10 border-yellow-500/20'}`}>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Modo</p>
          <p className={`font-black text-lg
            ${mode === 'AUTO' ? 'text-[#088fc3]' :
              mode === 'MANUAL' ? 'text-white' :
              'text-yellow-400'}`}>{mode}</p>
        </div>
        {mode === 'AUTO' && (
          <div className="flex-1 rounded-xl p-3 text-center border bg-white/5 border-white/10">
            <p className="text-white/30 text-xs uppercase tracking-wider mb-1">Objetivo</p>
            <p className="text-white font-black text-lg">{zone?.target_temp}°C</p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Info grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Agua', v: cooler.alarm_water ? 'Sin agua' : 'Con agua', c: cooler.alarm_water ? 'text-yellow-400' : 'text-[#088fc3]' },
          { l:'Salinidad', v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white' },
          { l:'PPM', v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white' },
          { l:'Horas', v: formatHours(cooler.hours_running), c:'text-white/50' },
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

function CoolerDetail({ cooler, onClose, zone, onImd }) {
  const [speed, setSpeed] = useState(fanSpeed(cooler, zone))
  const [fanOn, setFanOn] = useState(zone?.on_off === 'ON')

  useEffect(() => {
    setFanOn(zone?.on_off === 'ON')
    setSpeed(fanSpeed(cooler, zone))
  }, [cooler.fan_on, cooler.cool_mode_on, fanSpeed(cooler, zone), zone?.on_off])

  const st = STATUS[coolerStatus({...cooler, fan_on: fanOn})]

  const sendSpeed = async s => {
    setSpeed(s)
    await fetch(`${API_URL}/zones/${cooler.zone_id}/fanspeed`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({speed:s})
    })
  }

  const toggleOnOff = async () => { await coolerToggle(cooler, zone) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        className={`w-[420px] rounded-3xl border p-6 bg-[#060c12] shadow-2xl ${st.border}`}>
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-white/25 text-xs tracking-widest uppercase mb-1">Cooler · Zona {cooler.zone_id}</p>
            <p className="text-white text-3xl font-black">{cooler.model || `#${cooler.unit_id}`}</p>
            <p className={`text-sm font-bold mt-1 ${st.lc}`}>{fanOn ? 'ON' : 'OFF'}</p>
            <button onClick={toggleOnOff}
              className={`mt-2 px-4 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all
                ${isCoolerOn(cooler, zone)
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                  : 'bg-[#004d89]/40 border border-[#088fc3]/40 text-[#088fc3] hover:bg-[#004d89]/60'}`}>
              {toggleLabel(cooler, zone)}
            </button>
          </div>
            <div className="flex gap-2">
              <button onClick={onImd}
                className="px-3 h-9 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/25">
                IMD
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
            </div>        
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
            {l:'Agua', v: cooler.alarm_water ? '○ Sin agua' : '● Con agua', c: cooler.alarm_water ? 'text-yellow-400' : 'text-[#088fc3]'},
            {l:'Salinidad', v:`${cooler.salinity_us.toFixed(0)} μS`, c:'text-white'},
            {l:'PPM', v:`${cooler.salinity_ppm?.toFixed(0)||0}`, c:'text-white'},
            {l:'Bomba', v:cooler.pump_on?'ON':'OFF', c:cooler.pump_on?'text-[#088fc3]':'text-white/30'},
            {l:'Solenoide', v:cooler.solenoid_on?'ON':'OFF', c:cooler.solenoid_on?'text-[#088fc3]':'text-white/30'},
            {l:'Horas', v: formatHours(cooler.hours_running), c:'text-white/60'},
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

// Pantalla de espera PRELOADING del dashboard
function PrewetLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
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
  )
}

export default function Dashboard({ data, connected, onImdActivate }) {
  const [selected, setSelected] = useState(null)
  const [coolerStates, setCoolerStates] = useState({})
  const getZone = (cooler) => data.zones.find(z => z.zone_id === cooler.zone_id)  // ← aquí
  const hasData = connected && data.coolers.length > 0 && data.coolers.some(c => c.last_read > 0)
  const n = hasData ? data.coolers.length : 0

  useEffect(() => {
    setCoolerStates({})
  }, [data.coolers])

  const coolersWithState = data.coolers.map(c => ({
    ...c,
    fan_on: coolerStates[c.unit_id] !== undefined ? coolerStates[c.unit_id] : c.fan_on
  }))

  const toggleCooler = async (zoneId, unitId, currentState) => {
    const newState = !currentState
    setCoolerStates(prev => ({...prev, [unitId]: newState}))
    await fetch(`${API_URL}/zones/${zoneId}/onoff`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action: newState ? 'ON' : 'OFF'})
    })
  }

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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
                  ${z.on_off==='ON'?'bg-[#004d89]/25 border-[#088fc3]/35 text-[#088fc3]':'bg-white/3 border-white/8 text-white/25'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${z.on_off==='ON'?'bg-[#088fc3]':'bg-white/15'}`} />
                Zona {z.name || `Zona ${z.zone_id}`} · {z.on_off} · {z.cool_fan_mode} · {
                  (() => {
                    const c = data.coolers.find(c => c.zone_id === z.zone_id)
                    return c ? c.actual_fan_speed : z.fan_speed_cmd
                  })()
                }/10 · {z.target_temp}°C
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
        ) : isPrewet ? (
          <PrewetLoading />
        ) : n === 1 ? (
          <div className="flex-1 flex">
            <SingleHero cooler={coolersWithState[0]} onClick={setSelected} toggleCooler={toggleCooler} zone={getZone(coolersWithState[0])} />
          </div>
        ) : (
          <div className={`flex-1 overflow-y-auto grid ${gridClass} gap-3 content-start`}>
            {coolersWithState.map(c => <Card key={c.unit_id} cooler={c} onClick={setSelected} toggleCooler={toggleCooler} zone={getZone(c)} />)}
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
              ▶ Encender todo
            </button>
            <button onClick={() => !isPrewet && toggleAll('OFF')}
              disabled={isPrewet}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all
                ${isPrewet
                  ? 'bg-white/2 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/4 border-white/10 text-white/40 cursor-pointer hover:bg-white/8'}`}>
              ■ Apagar todo
            </button>
            <button disabled={isPrewet}
              className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all
                ${isPrewet
                  ? 'bg-white/2 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400 cursor-pointer hover:bg-yellow-500/15'}`}>
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
      {selected && <CoolerDetail cooler={selected} onClose={() => setSelected(null)} zone={getZone(selected)}
        onImd={() => { const u = selected.unit_id; setSelected(null); onImdActivate(u) }} />}
    </div>
  )
}
