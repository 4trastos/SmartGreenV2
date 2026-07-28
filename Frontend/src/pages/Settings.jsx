import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'

const TILES = [
  { id: 'sistema',   label: 'Sistema',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,       color: 'from-[#004d89]/40 to-[#088fc3]/10', border: 'border-[#088fc3]/30', keys: ['num_coolers','num_sensors','num_zones','refresh_interval','history_interval','modbus_retries'] },
  { id: 'salinidad', label: 'Salinidad',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>, color: 'from-blue-900/30 to-transparent',   border: 'border-blue-500/25',    keys: ['salinity_trigger','salinity_drain_delay','salinity_drain_interval'] },
  { id: 'prewet',    label: 'Pre-mojado',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,                                       color: 'from-cyan-900/25 to-transparent',   border: 'border-cyan-500/20',    keys: ['prewet_selector','prewet_delay_pump','prewet_delay_solenoid','prewet_delay_water','prewet_max_wait','prewet_check_interval'] },
  { id: 'garantia',  label: 'Garantía',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,                              color: 'from-green-900/25 to-transparent',  border: 'border-green-500/20',   keys: ['warranty_months','install_date'] },
  { id: 'maint',     label: 'Mantenimiento', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, color: 'from-orange-900/25 to-transparent', border: 'border-orange-500/20',  keys: ['maint_plan','maint_legionella','maint_closing_date','maint_opening_date','maint_legionella_date'] },
  { id: 'modbus',    label: 'Modbus',        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,                                                  color: 'from-purple-900/25 to-transparent', border: 'border-purple-500/20',  keys: ['water_manager','water_seal_opening_speed','auto_restart','temperature_unit','tank_drain_delay'] },
]

const KEY_LABELS = {
  num_coolers: 'Nº Coolers', num_sensors: 'Nº Sensores', num_zones: 'Nº Zonas',
  refresh_interval: 'Intervalo lectura (s)', history_interval: 'Intervalo histórico (s)', modbus_retries: 'Reintentos Modbus',
  salinity_trigger: 'Umbral salinidad (μS)', salinity_drain_delay: 'Tiempo drenaje (s)', salinity_drain_interval: 'Intervalo drenaje (s)',
  prewet_selector: 'Pre-mojado activo', prewet_delay_pump: 'Delay bomba (s)', prewet_delay_solenoid: 'Delay solenoide (s)',
  prewet_delay_water: 'Delay agua (s)', prewet_max_wait: 'Espera máx (s)', prewet_check_interval: 'Check intervalo (s)',
  warranty_months: 'Meses garantía', install_date: 'Fecha instalación',
  maint_plan: 'Plan (0=cierre, 1=apertura+cierre)', maint_legionella: 'Legionela (0=no, 1=sí)',
  maint_closing_date: 'Fecha cierre', maint_opening_date: 'Fecha apertura', maint_legionella_date: 'Fecha legionela',
  water_manager: 'Gestor agua', water_seal_opening_speed: 'Vel. apertura sello',
  auto_restart: 'Auto reinicio', temperature_unit: 'Unidad temp (0=C, 1=F)', tank_drain_delay: 'Delay drenaje tanque',
}

function SettingsModal({ tile, config, onClose, onSave }) {
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [saved, setSaved] = useState(null)

  const getVal = (key) => config.find(c => c.key === key)?.value ?? '—'

  const save = async (key) => {
    await fetch(`${API_URL}/config`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: parseInt(editVal) })
    })
    onSave(key, editVal)
    setSaved(key)
    setEditing(null)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-[460px] max-h-[80vh] rounded-3xl border p-6 bg-[#060c12] shadow-2xl flex flex-col bg-gradient-to-br ${tile.color} ${tile.border}`}>
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Configuración</p>
            <p className="text-white text-2xl font-black">{tile.label}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tile.keys.map(key => (
            <div key={key} className="flex items-center justify-between bg-white/4 rounded-xl px-4 py-3 gap-3">
              <span className="text-white/40 text-xs flex-1">{KEY_LABELS[key] || key}</span>
              {editing === key ? (
                <div className="flex items-center gap-2 shrink-0">
                  <input value={editVal} onChange={e => setEditVal(e.target.value)}
                    className="w-20 bg-[#004d89]/30 border border-[#088fc3]/40 rounded-lg px-2 py-1 text-white text-sm text-right focus:outline-none font-mono"
                    autoFocus onKeyDown={e => e.key === 'Enter' && save(key)} />
                  <button onClick={() => save(key)} className="text-[#088fc3] text-sm cursor-pointer">✓</button>
                  <button onClick={() => setEditing(null)} className="text-white/25 text-sm cursor-pointer">✕</button>
                </div>
              ) : (
                <button onClick={() => { setEditing(key); setEditVal(String(getVal(key))) }}
                  className={`font-mono font-bold text-sm shrink-0 cursor-pointer hover:text-[#088fc3] transition-colors ${saved === key ? 'text-green-400' : 'text-white'}`}>
                  {saved === key ? '✓' : getVal(key)}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [config, setConfig] = useState([])
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/config`).then(r => r.json()).then(setConfig).catch(() => {})
  }, [])

  const handleSave = (key, val) => {
    setConfig(prev => prev.map(c => c.key === key ? { ...c, value: val } : c))
  }

  const openTile = TILES.find(t => t.id === open)

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <p className="text-white/20 text-xs font-bold tracking-widest uppercase shrink-0">Configuración del sistema</p>

      {/* Tile grid 3x2 */}
      <div className="grid grid-cols-3 gap-3 flex-1">
        {TILES.map(tile => (
          <button key={tile.id} onClick={() => setOpen(tile.id)}
            className={`rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200 hover:brightness-110 bg-gradient-to-br ${tile.color} ${tile.border} flex flex-col justify-between`}>
            <div className="text-white/60 mb-3">{tile.icon}</div>
            <div>
              <p className="text-white font-bold text-sm">{tile.label}</p>
              <p className="text-white/25 text-xs mt-0.5">{tile.keys.length} parámetros</p>
            </div>
          </button>
        ))}
      </div>

      {open && openTile && (
        <SettingsModal
          tile={openTile}
          config={config}
          onClose={() => setOpen(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
