import { useState, useEffect } from 'react'
const API_URL = 'http://localhost:8080/api'

const TILES = [
  { id: 'sistema',      label: 'Sistema',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, color: 'from-[#004d89]/40 to-[#088fc3]/10', border: 'border-[#088fc3]/30', keys: ['num_coolers','num_sensors','num_zones','refresh_interval','history_interval','modbus_retries'] },
  { id: 'salinidad',    label: 'Salinidad',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>, color: 'from-blue-900/30 to-transparent', border: 'border-blue-500/25', keys: ['salinity_trigger','salinity_drain_delay','salinity_drain_interval'] },
  { id: 'prewet',       label: 'Pre-mojado',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>, color: 'from-cyan-900/25 to-transparent', border: 'border-cyan-500/20', keys: ['prewet_selector','prewet_delay_pump','prewet_delay_solenoid','prewet_delay_water','prewet_max_wait','prewet_check_interval'] },
  { id: 'garantia',     label: 'Garantía',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, color: 'from-green-900/25 to-transparent', border: 'border-green-500/20', keys: ['warranty_months','install_date'] },
  { id: 'maint',        label: 'Mantenimiento',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, color: 'from-orange-900/25 to-transparent', border: 'border-orange-500/20', keys: ['maint_plan','maint_legionella','maint_closing_date','maint_opening_date','maint_legionella_date'] },
  { id: 'modbus',       label: 'Modbus',         icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, color: 'from-purple-900/25 to-transparent', border: 'border-purple-500/20', keys: ['water_manager','water_seal_opening_speed','auto_restart','temperature_unit','tank_drain_delay'] },
]

const KEY_LABELS = {
  num_coolers: 'Nº Coolers', num_sensors: 'Nº Sensores', num_zones: 'Nº Zonas',
  refresh_interval: 'Intervalo lectura (s)', history_interval: 'Intervalo histórico (s)',
  modbus_retries: 'Reintentos Modbus',
  salinity_trigger: 'Umbral salinidad (μS)', salinity_drain_delay: 'Tiempo drenaje (s)', salinity_drain_interval: 'Intervalo drenaje (s)',
  prewet_selector: 'Pre-mojado activo', prewet_delay_pump: 'Delay bomba (s)', prewet_delay_solenoid: 'Delay solenoide (s)',
  prewet_delay_water: 'Delay agua (s)', prewet_max_wait: 'Espera máx (s)', prewet_check_interval: 'Check intervalo (s)',
  warranty_months: 'Meses garantía', install_date: 'Fecha instalación',
  maint_plan: 'Plan (0=cierre, 1=apertura+cierre)', maint_legionella: 'Legionela (0=no, 1=sí)',
  maint_closing_date: 'Fecha cierre', maint_opening_date: 'Fecha apertura', maint_legionella_date: 'Fecha legionela',
  water_manager: 'Gestor agua', water_seal_opening_speed: 'Vel. apertura sello',
  auto_restart: 'Auto reinicio', temperature_unit: 'Unidad temp (0=C, 1=F)', tank_drain_delay: 'Delay drenaje tanque',
}

export default function Settings() {
  const [config, setConfig] = useState([])
  const [open, setOpen] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/config`).then(r=>r.json()).then(setConfig).catch(()=>{})
  }, [])

  const save = async (key) => {
    await fetch(`${API_URL}/config`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({key, value: parseInt(editVal)})
    })
    setConfig(prev => prev.map(c => c.key===key ? {...c, value: editVal} : c))
    setSaved(key)
    setEditing(null)
    setTimeout(() => setSaved(null), 2000)
  }

  const getVal = (key) => config.find(c => c.key === key)?.value ?? '—'

  return (
    <div className="h-full flex flex-col p-5 gap-4 overflow-hidden">
      <p className="text-white/20 text-xs font-bold tracking-widest uppercase shrink-0">Configuración del sistema</p>

      {/* Tile grid */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {TILES.map(tile => (
          <button key={tile.id}
            onClick={() => setOpen(open === tile.id ? null : tile.id)}
            className={`relative rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200 bg-gradient-to-br ${tile.color} ${tile.border}
              ${open === tile.id ? 'ring-1 ring-[#088fc3]/40 brightness-110' : 'hover:brightness-110'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`text-white/60 ${open === tile.id ? 'text-[#088fc3]' : ''}`}>{tile.icon}</div>
              <span className={`text-xs transition-all ${open === tile.id ? 'text-[#088fc3]' : 'text-white/20'}`}>
                {open === tile.id ? '▲' : '▼'}
              </span>
            </div>
            <p className="text-white font-bold text-sm">{tile.label}</p>
            <p className="text-white/25 text-xs mt-0.5">{tile.keys.length} parámetros</p>
          </button>
        ))}
      </div>

      {/* Expandable panel */}
      {open && (
        <div className="flex-1 overflow-y-auto bg-[#0d1a26]/80 rounded-2xl border border-white/8 p-5">
          <p className="text-[#088fc3] text-xs font-bold tracking-widest uppercase mb-4">
            {TILES.find(t=>t.id===open)?.label}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TILES.find(t=>t.id===open)?.keys.map(key => (
              <div key={key} className="bg-white/3 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-xs mb-1 truncate">{KEY_LABELS[key] || key}</p>
                  {editing === key ? (
                    <div className="flex items-center gap-2">
                      <input value={editVal} onChange={e=>setEditVal(e.target.value)}
                        className="w-24 bg-[#004d89]/30 border border-[#088fc3]/40 rounded-lg px-2 py-1 text-white text-sm focus:outline-none font-mono"
                        autoFocus onKeyDown={e => e.key==='Enter' && save(key)} />
                      <button onClick={()=>save(key)} className="text-[#088fc3] text-xs cursor-pointer hover:text-white">✓</button>
                      <button onClick={()=>setEditing(null)} className="text-white/25 text-xs cursor-pointer">✕</button>
                    </div>
                  ) : (
                    <p className={`font-mono font-bold text-sm ${saved===key ? 'text-green-400' : 'text-white'}`}>
                      {saved===key ? '✓ Guardado' : getVal(key)}
                    </p>
                  )}
                </div>
                {editing !== key && (
                  <button onClick={()=>{setEditing(key);setEditVal(String(getVal(key)))}}
                    className="text-white/20 hover:text-[#088fc3] cursor-pointer text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-all shrink-0">
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!open && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/15 text-sm">Selecciona una categoría para configurar</p>
        </div>
      )}
    </div>
  )
}
