import { useState } from 'react'
const API_URL = 'http://localhost:8080/api'

const TILES = [
  { id: 'opening',    label: 'Apertura',       icon: '▲', desc: 'Inicio de temporada',       color: 'from-[#004d89]/40 to-[#088fc3]/10', border: 'border-[#088fc3]/40' },
  { id: 'closing',    label: 'Cierre',          icon: '▼', desc: 'Fin de temporada',           color: 'from-blue-900/30 to-transparent',   border: 'border-blue-500/30' },
  { id: 'legionella', label: 'Legionela',       icon: '◈', desc: 'Tratamiento bacteriológico', color: 'from-orange-900/30 to-transparent', border: 'border-orange-500/30' },
  { id: 'repair',     label: 'Reparación',      icon: '◧', desc: 'Intervención técnica',       color: 'from-purple-900/30 to-transparent', border: 'border-purple-500/30' },
  { id: 'status',     label: 'Estado equipos',  icon: '◉', desc: 'Ver todos los equipos',      color: 'from-green-900/30 to-transparent',  border: 'border-green-500/30' },
  { id: 'future',     label: 'Próximamente',    icon: '○', desc: 'Funcionalidad futura',       color: 'from-white/2 to-transparent',       border: 'border-white/10' },
]

function MaintenanceModal({ type, coolers, onClose }) {
  const [form, setForm] = useState({ unit_id: coolers[0]?.unit_id || 2, technician: '', description: '' })
  const [sent, setSent] = useState(false)
  const t = TILES.find(t => t.id === type)

  const submit = async () => {
    await fetch(`${API_URL}/maintenance/${form.unit_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, technician: form.technician, description: form.description })
    })
    setSent(true)
    setTimeout(() => { setSent(false); onClose() }, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-[420px] rounded-3xl border p-6 bg-[#060c12] shadow-2xl bg-gradient-to-br ${t.color} ${t.border}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Registrar mantenimiento</p>
            <p className="text-white text-2xl font-black">{t.icon} {t.label}</p>
            <p className="text-white/30 text-sm mt-1">{t.desc}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        <div className="mb-4">
          <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Cooler</label>
          <select value={form.unit_id}
            onChange={e => setForm(f => ({ ...f, unit_id: +e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#088fc3]/60"
            style={{ backgroundColor: '#0d1a26' }}>
            {coolers.map(c => (
              <option key={c.unit_id} value={c.unit_id} style={{ backgroundColor: '#0d1a26' }}>Cooler #{c.unit_id}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Técnico</label>
          <input value={form.technician}
            onChange={e => setForm(f => ({ ...f, technician: e.target.value }))}
            placeholder="Nombre del técnico"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#088fc3]/60" />
        </div>

        <div className="mb-6">
          <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Observaciones</label>
          <textarea value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descripción del trabajo realizado..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#088fc3]/60 resize-none" />
        </div>

        <button onClick={submit}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer
            ${sent
              ? 'bg-green-500/20 border border-green-500/40 text-green-400'
              : 'bg-[#004d89] border border-[#088fc3]/40 text-white hover:bg-[#005fa8]'}`}>
          {sent ? '✓ Registrado correctamente' : `Registrar ${t.label}`}
        </button>
      </div>
    </div>
  )
}

function StatusModal({ coolers, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-[480px] max-h-[85vh] rounded-3xl border border-green-500/30 p-6 bg-[#060c12] shadow-2xl flex flex-col bg-gradient-to-br from-green-900/20 to-transparent">
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Mantenimiento</p>
            <p className="text-white text-2xl font-black">◉ Estado equipos</p>
            <p className="text-white/30 text-sm mt-1">{coolers.length} equipos registrados</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
          {coolers.map(c => (
            <div key={c.unit_id} className="bg-white/4 border border-white/8 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-bold">Cooler #{c.unit_id}</span>
                {c.alarm_warranty ? (
                  <span className="text-orange-400 text-xs font-bold bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/30">⚠ Garantía</span>
                ) : (
                  <span className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/30">✓ En garantía</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-white/30 mb-1">Horas funcionamiento</p>
                  <p className="text-white font-mono font-bold">{c.hours_running?.toFixed ? c.hours_running.toFixed(0) : c.hours_running} h</p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-white/30 mb-1">Último cierre</p>
                  <p className={c.last_closing ? 'text-white font-mono' : 'text-yellow-400 font-bold'}>
                    {c.last_closing ? new Date(c.last_closing * 1000).toLocaleDateString('es-ES') : 'Pendiente'}
                  </p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-white/30 mb-1">Alarmas activas</p>
                  <p className={`font-bold ${(c.alarm_fault || c.alarm_water || c.alarm_comms) ? 'text-red-400' : 'text-green-400'}`}>
                    {(c.alarm_fault || c.alarm_water || c.alarm_comms) ? 'Sí' : 'No'}
                  </p>
                </div>
                <div className="bg-white/3 rounded-lg p-2">
                  <p className="text-white/30 mb-1">Estado</p>
                  <p className={`font-bold ${c.fan_on ? 'text-[#088fc3]' : 'text-white/40'}`}>
                    {c.fan_on ? 'Activo' : 'Standby'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Maintenance({ data }) {
  const [selected, setSelected] = useState(null)

  const coolers = data.coolers.length > 0 ? data.coolers : [
    { unit_id: 2, hours_running: 1250, alarm_warranty: 0, last_closing: 1783849118, fan_on: 1, alarm_fault: 0, alarm_water: 0, alarm_comms: 0 },
    { unit_id: 3, hours_running: 980,  alarm_warranty: 0, last_closing: 0,          fan_on: 0, alarm_fault: 0, alarm_water: 1, alarm_comms: 0 },
    { unit_id: 4, hours_running: 2100, alarm_warranty: 0, last_closing: 1783849118, fan_on: 1, alarm_fault: 0, alarm_water: 0, alarm_comms: 0 },
    { unit_id: 5, hours_running: 3500, alarm_warranty: 1, last_closing: 0,          fan_on: 1, alarm_fault: 0, alarm_water: 0, alarm_comms: 0 },
    { unit_id: 6, hours_running: 150,  alarm_warranty: 0, last_closing: 0,          fan_on: 0, alarm_fault: 1, alarm_water: 0, alarm_comms: 0 },
  ]

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <p className="text-white/20 text-xs font-bold tracking-widest uppercase shrink-0">Mantenimiento</p>

      {/* 6 tiles en grid 3x2 */}
      <div className="grid grid-cols-3 gap-3 flex-1">
        {TILES.map(t => (
          <button key={t.id}
            onClick={() => t.id !== 'future' && setSelected(t.id)}
            className={`rounded-2xl border p-4 text-left transition-all duration-200 bg-gradient-to-br ${t.color} ${t.border} flex flex-col justify-between
              ${t.id === 'future' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}>
            <div className="text-white/60 text-3xl mb-2">{t.icon}</div>
            <div>
              <p className="text-white font-bold text-sm">{t.label}</p>
              <p className="text-white/25 text-xs mt-0.5">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modals */}
      {selected === 'status' && (
        <StatusModal coolers={coolers} onClose={() => setSelected(null)} />
      )}
      {selected && selected !== 'status' && selected !== 'future' && (
        <MaintenanceModal type={selected} coolers={coolers} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
