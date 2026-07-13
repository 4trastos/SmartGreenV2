import { useState } from 'react'
const API_URL = 'http://localhost:8080/api'

export default function Maintenance({ data }) {
  const [form, setForm] = useState({ unit_id: 2, type: 'closing', technician: '', description: '' })
  const [sent, setSent] = useState(false)

  const submit = async () => {
    await fetch(`${API_URL}/maintenance/${form.unit_id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: form.type, technician: form.technician, description: form.description })
    })
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const TYPES = [
    { id: 'opening',    label: 'Apertura',   icon: '▲', desc: 'Inicio de temporada' },
    { id: 'closing',    label: 'Cierre',     icon: '▼', desc: 'Fin de temporada' },
    { id: 'legionella', label: 'Legionela',  icon: '◈', desc: 'Tratamiento bacteriológico' },
    { id: 'repair',     label: 'Reparación', icon: '◧', desc: 'Intervención técnica' },
  ]

  return (
    <div className="h-full flex gap-6 p-6">
      {/* Form */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        <p className="text-white/30 text-xs font-bold tracking-widest uppercase">Registrar mantenimiento</p>

        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer
                ${form.type === t.id
                  ? 'bg-[#004d89]/40 border-[#088fc3]/60 text-[#088fc3]'
                  : 'bg-white/3 border-white/10 text-white/40 hover:border-white/20'}`}>
              <p className="text-lg mb-1">{t.icon}</p>
              <p className="text-xs font-bold">{t.label}</p>
              <p className="text-xs opacity-60">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Cooler */}
        <div>
          <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Cooler</label>
          <select value={form.unit_id}
            onChange={e => setForm(f => ({ ...f, unit_id: +e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#088fc3]/60">
            {(data.coolers.length > 0 ? data.coolers : [{ unit_id: 2 }, { unit_id: 3 }]).map(c => (
              <option key={c.unit_id} value={c.unit_id} className="bg-[#0d1a26]">Cooler #{c.unit_id}</option>
            ))}
          </select>
        </div>

        {/* Técnico */}
        <div>
          <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Técnico</label>
          <input value={form.technician}
            onChange={e => setForm(f => ({ ...f, technician: e.target.value }))}
            placeholder="Nombre del técnico"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#088fc3]/60" />
        </div>

        {/* Descripción */}
        <div>
          <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Observaciones</label>
          <textarea value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descripción del trabajo realizado..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#088fc3]/60 resize-none" />
        </div>

        <button onClick={submit}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer
            ${sent
              ? 'bg-green-500/20 border border-green-500/40 text-green-400'
              : 'bg-[#004d89] border border-[#088fc3]/40 text-white hover:bg-[#005fa8]'}`}>
          {sent ? '✓ Registrado correctamente' : 'Registrar mantenimiento'}
        </button>
      </div>

      {/* Info garantía */}
      <div className="flex-1 flex flex-col gap-4">
        <p className="text-white/30 text-xs font-bold tracking-widest uppercase">Estado de equipos</p>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto">
          {(data.coolers.length > 0 ? data.coolers : [
            { unit_id: 2, hours_running: 1250, install_date: 1700000000, warranty_months: 24, alarm_warranty: 0, alarm_maint_closing: 0, last_closing: 1783849118 },
            { unit_id: 3, hours_running: 980, install_date: 1700000000, warranty_months: 24, alarm_warranty: 0, alarm_maint_closing: 1, last_closing: 0 },
          ]).map(c => (
            <div key={c.unit_id} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white font-bold">Cooler #{c.unit_id}</span>
                {c.alarm_warranty ? (
                  <span className="text-orange-400 text-xs font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30">⚠ Garantía</span>
                ) : (
                  <span className="text-green-400 text-xs">✓ En garantía</span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/30">Horas funcionamiento</span>
                  <span className="text-white font-mono">{c.hours_running?.toFixed ? c.hours_running.toFixed(0) : c.hours_running} h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Último cierre</span>
                  <span className={c.last_closing ? 'text-white' : 'text-yellow-400'}>
                    {c.last_closing ? new Date(c.last_closing * 1000).toLocaleDateString('es-ES') : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
