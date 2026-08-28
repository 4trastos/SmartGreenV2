import { useState } from 'react'
import { API_URL } from '../config.js'

const SECTIONS = ['test', 'config', 'info']

export default function IMD({ data, onExit }) {
  const [section, setSection] = useState('test')
  const cooler = data.coolers?.[0]
  const zone = data.zones?.[0]

  const sendCmd = async (endpoint, body) => {
    await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
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
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Prewet</p>
            <div className="flex gap-2">
                <button onClick={() => sendCmd(`/coolers/${cooler?.unit_id}/prewet`, {})}
                className="flex-1 py-2 rounded-xl bg-[#088fc3]/20 text-[#088fc3] text-sm font-bold cursor-pointer hover:bg-[#088fc3]/30">
                Forzar
                </button>
                <button onClick={() => sendCmd(`/zones/${zone?.zone_id}/onoff`, {action:'OFF'})}
                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-bold cursor-pointer hover:bg-red-500/30">
                Detener
                </button>
            </div>
            </div>
        </div>
        )}

        {/* Config técnica */}
        {section === 'config' && (
        <div className="flex-1 overflow-y-auto">
            <p className="text-white/30 text-sm text-center mt-8">⚙️ Configuración técnica — próximamente</p>
        </div>
        )}

        {/* Info equipo */}
        {section === 'info' && cooler && (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
            {[
            {l:'Modelo', v:'Breezair TBS'},
            {l:'Firmware', v:`CPMD ${cooler.r0_config}`},
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