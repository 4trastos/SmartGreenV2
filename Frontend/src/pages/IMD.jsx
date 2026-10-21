import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import Keyboard from '../components/Keyboard'

function ConfigParam({ label, unit, value, onChange }) {
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
        <Keyboard value={local} numeric={true}
          onChange={val => setLocal(val)}
          onClose={() => { setShowKb(false); if (local !== String(value)) onChange(local) }} />
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

const SECTIONS = ['test', 'config', 'info']

export default function IMD({ data, onExit }) {
  const [section, setSection] = useState('test')
  const [prewetRunning, setPrewetRunning] = useState(false)
  const [config, setConfig] = useState({})
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetProgress, setResetProgress] = useState(0)
  const [showRestart, setShowRestart] = useState(false)
  const cooler = data.coolers?.[0]
  const zone = data.zones?.[0]

   useEffect(() => {
    if (zone && zone.prewet_in_progress === 'no' && prewetRunning)
      setPrewetRunning(false)
  }, [data.zones])

  const sendCmd = async (endpoint, body) => {
    await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
  }

    useEffect(() => {
    fetch(`${API_URL}/config`)
        .then(r => r.json())
        .then(arr => {
        const obj = {}
        arr.forEach(item => { obj[item.key] = item.value })
        setConfig(obj)
        })
    }, [])

    const saveConfig = async (key, value) => {
    setConfig(prev => ({...prev, [key]: value}))
    setShowRestart(true) 
    await fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: parseInt(value) })
    })
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

  return (
    <div className="h-full flex flex-col p-4 gap-4">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
        <div>
            <p className="text-red-400 text-xs font-bold tracking-widest uppercase">Modo IMD</p>
            <p className="text-white text-2xl font-black">Configuración y Prueba de Componentes</p>
        </div>
        <button onClick={onExit}
            className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
            ✕ Salir IMD
        </button>
        </div>

        {/* AVERÍA GRAVE — rearme */}
        {cooler && (Number(cooler.broken_cooler) === 1 || Number(cooler.fault_solenoid) === 1 || Number(cooler.fault_pump) === 1) && (
        <div className="shrink-0 bg-red-500/15 rounded-2xl p-4 border border-red-500/40 flex items-center justify-between gap-3">
            <div>
            <p className="text-red-400 text-xs uppercase tracking-wider font-bold">⚠ Avería grave activa</p>
            <p className="text-white/60 text-sm">Cooler #{cooler.unit_id} bloqueado. Revisa el historial de alarmas antes de rearmar.</p>
            </div>
            <button onClick={() => sendCmd(`/coolers/${cooler.unit_id}/rearm`, {})}
            className="shrink-0 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
            Rearmar avería
            </button>
        </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 shrink-0">
        {[{id:'test',label:'Test'},{id:'config',label:'Config'},{id:'info',label:'ℹInfo'}].map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
                ${section === s.id ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
            {s.label}
            </button>
        ))}
        </div>

        {/* Test de componentes */}
        {section === 'test' && cooler && (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">

            {/* Fan */}
            <div className="bg-white/4 rounded-2xl p-4 col-span-2">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Velocidad Fan</p>
            <div className="flex gap-1.5">
                {Array.from({length: 11}).map((_,i) => (
                <button key={i}
                    onClick={() => sendCmd(`/zones/${zone?.zone_id}/fanspeed`, {speed: i})}
                    className="flex-1 h-10 rounded-lg bg-white/8 text-white/60 text-xs font-bold cursor-pointer hover:bg-[#088fc3] hover:text-white transition-all">
                    {i}
                </button>
                ))}
            </div>
            </div>

            {/* Bomba */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Bomba</p>
            <div className="flex gap-2">
                <button onClick={() => sendCmd(`/zones/${zone?.zone_id}/pump`, {action:'ON'})}
                className="flex-1 py-2 rounded-xl bg-[#088fc3]/20 text-[#088fc3] text-sm font-bold cursor-pointer hover:bg-[#088fc3]/30">ON</button>
                <button onClick={() => sendCmd(`/zones/${zone?.zone_id}/pump`, {action:'OFF'})}
                className="flex-1 py-2 rounded-xl bg-white/5 text-white/40 text-sm font-bold cursor-pointer hover:bg-white/10">OFF</button>
            </div>
            </div>

            {/* Solenoide */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Solenoide</p>
            <div className="flex gap-2">
                <button onClick={() => sendCmd(`/zones/${zone?.zone_id}/solenoid`, {action:'ON'})}
                className="flex-1 py-2 rounded-xl bg-[#088fc3]/20 text-[#088fc3] text-sm font-bold cursor-pointer hover:bg-[#088fc3]/30">ON</button>
                <button onClick={() => sendCmd(`/zones/${zone?.zone_id}/solenoid`, {action:'OFF'})}
                className="flex-1 py-2 rounded-xl bg-white/5 text-white/40 text-sm font-bold cursor-pointer hover:bg-white/10">OFF</button>
            </div>
            </div>

            {/* Drain */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Drenaje</p>
            <div className="flex gap-2">
                <button onClick={() => sendCmd(`/coolers/${cooler?.unit_id}/r50`, {value: 0})}
                className="flex-1 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 text-sm font-bold cursor-pointer hover:bg-yellow-500/30">
                Abrir
                </button>
                <button onClick={() => sendCmd(`/coolers/${cooler?.unit_id}/r50`, {value: 16})}
                className="flex-1 py-2 rounded-xl bg-white/5 text-white/40 text-sm font-bold cursor-pointer hover:bg-white/10">
                Cerrar
                </button>
            </div>
            </div>

            {/* Prewet */}
            <div className="bg-white/4 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-white/40 text-xs uppercase tracking-wider">Prewet (Test)</p>
                    {prewetRunning && (
                    <span className="px-2 py-1 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold">
                        ● Test en marcha
                    </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => {
                        setPrewetRunning(true)
                        sendCmd(`/coolers/${cooler?.unit_id}/prewet_test`, {})
                        }}
                        disabled={prewetRunning}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold cursor-pointer
                            ${prewetRunning ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-[#088fc3]/20 text-[#088fc3] hover:bg-[#088fc3]/30'}`}>
                        Forzar
                    </button>
                    <button onClick={async () => {
                    setPrewetRunning(false)
                    await sendCmd(`/zones/${zone?.zone_id}/onoff`, {action:'OFF'})
                    }}
                    className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
                    Detener
                    </button>
                </div>
            </div>
        </div>
        )}

        {/* Config técnica */}
        {section === 'config' && (
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {/* SENSORES */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Sensores</p>
            <div className="grid grid-cols-2 gap-3">
                {[
                { key: 'sensor_1_offset',           label: 'Offset Tª INT',  unit: '°C' },
                { key: 'sensor_1_humidity_offset',  label: 'Offset Hr INT',  unit: '%'  },
                { key: 'sensor_2_offset',           label: 'Offset Tª EXT',  unit: '°C' },
                { key: 'sensor_2_humidity_offset',  label: 'Offset Hr EXT',  unit: '%'  },
                ].map(({ key, label, unit }) => (
                <ConfigParam key={key} label={label} unit={unit}
                    value={config[key]} onChange={v => saveConfig(key, v)} />
                ))}
            </div>
            </div>

            {/* FAN */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Velocidad Fan</p>
            <div className="grid grid-cols-2 gap-3">
                {[
                { key: 'min_setpoint_fan', label: 'Velocidad mín', unit: '' },
                { key: 'max_setpoint_fan', label: 'Velocidad máx', unit: '' },
                ].map(({ key, label, unit }) => (
                <ConfigParam key={key} label={label} unit={unit}
                    value={config[key]} onChange={v => saveConfig(key, v)} />
                ))}
            </div>
            </div>

            {/* PREWET */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Prewet</p>
            <div className="grid grid-cols-2 gap-3">
                {[
                { key: 'prewet_delay_solenoid', label: 'Delay solenoide', unit: 's' },
                { key: 'prewet_delay_water',    label: 'Delay agua',      unit: 's' },
                { key: 'prewet_delay_pump',     label: 'Delay bomba',     unit: 's' },
                { key: 'prewet_max_wait',       label: 'Máx espera agua', unit: 's' },
                ].map(({ key, label, unit }) => (
                <ConfigParam key={key} label={label} unit={unit}
                    value={config[key]} onChange={v => saveConfig(key, v)} />
                ))}
            </div>
            </div>

            {/* DRENAJE */}
            <div className="bg-white/4 rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Drenaje</p>
            <div className="grid grid-cols-2 gap-3">
                <OptionParam label="Drenaje de seguridad (equipo apagado)"
                    value={config.drain_safety_hours ?? 72}
                    options={[{label:'72h',value:72},{label:'48h',value:48},{label:'24h',value:24},{label:'4h',value:4}]}
                    onChange={v => saveConfig('drain_safety_hours', v)} />
                <OptionParam label="Renovación de agua (equipo encendido)"
                    value={config.drain_type ?? 1}
                    options={[{label:'Por tiempo',value:1},{label:'Por salinidad',value:0}]}
                    onChange={v => saveConfig('drain_type', v)} />
                {Number(config.drain_type ?? 1) === 1 ? (
                <>
                    <OptionParam label="Renovar cada"
                        value={config.drain_periodic ?? 65}
                        options={[{label:'10h',value:600},{label:'4h',value:240},{label:'2h',value:120},{label:'65m',value:65}]}
                        onChange={v => saveConfig('drain_periodic', v)} />
                    <ConfigParam key="drain_periodic_time" label="Duración renovación" unit="s"
                        value={config.drain_periodic_time ?? 30} onChange={v => saveConfig('drain_periodic_time', v)} />
                </>
                ) : (
                <>
                    <OptionParam label="Trigger salinidad (µS)"
                        value={config.salinity_trigger ?? 4275}
                        options={[{label:'4275',value:4275},{label:'3620',value:3620},{label:'2960',value:2960},{label:'2305',value:2305}]}
                        onChange={v => saveConfig('salinity_trigger', v)} />
                    <SelectParam label="Máx. drenaje salinidad" unit="s"
                        value={config.drain_max_time ?? 600}
                        options={[60, 180, 360, 600]}
                        onChange={v => saveConfig('drain_max_time', v)} />
                </>
                )}
                <SelectParam label="Vaciado de seguridad" unit="s"
                    value={config.salinity_drain_delay ?? 120}
                    options={[30, 60, 120, 180, 240]}
                    onChange={v => saveConfig('salinity_drain_delay', v)} />
            </div>
            </div>

            {/* DRENAJE Y SECADO */}
            <div className="bg-white/4 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-white/40 text-xs uppercase tracking-wider">Drenaje y Secado</p>
                <button onClick={() => saveConfig('drain_dry_enabled', config.drain_dry_enabled ? 0 : 1)}
                className={`relative w-10 h-5 rounded-full transition-all cursor-pointer
                    ${config.drain_dry_enabled ? 'bg-[#088fc3]' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all
                    ${config.drain_dry_enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <ConfigParam key="drain_dry_minutes" label="Duración" unit="min"
                value={config.drain_dry_minutes} onChange={v => saveConfig('drain_dry_minutes', v)} />
                <ConfigParam key="drain_dry_speed" label="Velocidad fan" unit=""
                value={config.drain_dry_speed} onChange={v => saveConfig('drain_dry_speed', v)} />
            </div>
            </div>

            {/* RESET */}
            <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30">
            <p className="text-red-400 text-xs uppercase tracking-wider mb-3">Reset del sistema</p>
            <button onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm cursor-pointer hover:bg-red-500/30">
                Resetear instalación
            </button>
            </div>

            {/* Modal advertencia reset */}
            {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
                <div className="w-[320px] rounded-3xl border border-red-500/40 p-6 bg-[#060c12] shadow-2xl">
                <p className="text-red-400 text-xs uppercase tracking-wider mb-1 text-center">⚠ Atención</p>
                <p className="text-white text-xl font-black mb-3 text-center">Resetear instalación</p>
                <p className="text-white/50 text-sm text-center mb-6">Se borrará toda la configuración y el sistema volverá al estado inicial. Esta acción no se puede deshacer.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold cursor-pointer">
                    Cancelar
                    </button>
                    <button onClick={doReset}
                    className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold cursor-pointer hover:bg-red-500/30">
                    Resetear
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
                <p className="text-white font-black text-xl mb-2">Reseteando sistema</p>
                <p className="text-white/40 text-sm">Por favor espere...</p>
            </div>
            )}

            {/* POP-UP REINICIO */}
            {showRestart && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
                <div className="w-[340px] rounded-3xl border border-yellow-500/40 p-6 bg-[#060c12] shadow-2xl">
                <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1 text-center">⚠ Reinicio necesario</p>
                <p className="text-white text-xl font-black mb-3 text-center">Cambio guardado</p>
                <p className="text-white/50 text-sm text-center mb-6">Se aplicará al reiniciar el controlador. Hazlo con el equipo parado.</p>
                <div className="flex gap-3">
                    <button onClick={() => setShowRestart(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 font-bold cursor-pointer">
                    Más tarde
                    </button>
                    <button onClick={async () => {
                        setShowRestart(false)
                        await fetch(`${API_URL}/reboot`, { method: 'POST' }).catch(() => {})
                        }}
                    className="flex-1 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 font-bold cursor-pointer hover:bg-yellow-500/30">
                    Reiniciar
                    </button>
                </div>
                </div>
            </div>
            )}

        </div>
        )}

        {/* Info equipo */}
        {section === 'info' && cooler && (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
            {[
            {l:'Modelo', v: cooler.model || 'Breezair'},
            {l:'Firmware', v: cooler.firmware ? `v${(cooler.firmware >> 8)}.${cooler.firmware & 0xFF}` : '-'},
            {l:'Dirección Modbus', v:`#${cooler.modbus_addr}`},
            {l:'Horas funcionamiento', v:`${(cooler.hours_running/3600).toFixed(1)}h`},
            {l:'Arranques fan', v:cooler.fan_starts},
            {l:'Cold starts', v:cooler.cold_starts},
            {l:'Drenajes', v:cooler.tank_drains},
            {l:'Llenado medio', v:`${cooler.avg_tank_fill}s`},
            ].map(({l,v}) => (
            <div key={l} className="bg-white/4 rounded-xl p-4">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-1">{l}</p>
                <p className="text-white font-bold">{v}</p>
            </div>
            ))}
        </div>
        )}
    </div>
  )
}