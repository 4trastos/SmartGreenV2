import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'

const DAYS = [
  { key: 'mon', label: 'L' },
  { key: 'tue', label: 'M' },
  { key: 'wed', label: 'X' },
  { key: 'thu', label: 'J' },
  { key: 'fri', label: 'V' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'D' },
]

const EMPTY = { name: '', zone_id: 1, action: 'ON', hour: '08:00', mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 }

export default function Scheduler({ data }) {
  const [schedulers, setSchedulers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const zones = data?.zones || []

  const load = async () => {
    const res = await fetch(`${API_URL}/scheduler`)
    const json = await res.json()
    setSchedulers(json)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (editing) {
      await fetch(`${API_URL}/scheduler/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    } else {
      await fetch(`${API_URL}/scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    }
    setShowModal(false)
    setEditing(null)
    setForm(EMPTY)
    load()
  }

  const del = async (id) => {
    await fetch(`${API_URL}/scheduler/${id}`, { method: 'DELETE' })
    load()
  }

  const toggle = async (s) => {
    await fetch(`${API_URL}/scheduler/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, active: s.active ? 0 : 1 })
    })
    load()
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({ ...s })
    setShowModal(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, zone_id: zones[0]?.zone_id || 1 })
    setShowModal(true)
  }

  return (
    <div className="h-full flex flex-col p-5 gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-xs uppercase tracking-widest">{schedulers.length} programaciones</p>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#088fc3]/20 border border-[#088fc3]/40 text-[#088fc3] text-sm font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-[#088fc3]/30 transition-colors">
          + Nueva
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {schedulers.map(s => {
          const zone = zones.find(z => z.zone_id === s.zone_id)
          return (
            <div key={s.id}
              className={`rounded-2xl border p-4 flex items-center gap-4 transition-all
                ${s.active ? 'bg-[#004d89]/20 border-[#088fc3]/25' : 'bg-white/3 border-white/8 opacity-50'}`}>
              {/* Toggle activo */}
              <button onClick={() => toggle(s)}
                className={`w-10 h-6 rounded-full transition-all cursor-pointer shrink-0
                  ${s.active ? 'bg-[#088fc3]' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-all ${s.active ? 'translate-x-4' : ''}`} />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{s.name}</p>
                <p className="text-white/40 text-xs">{zone?.name || `Zona ${s.zone_id}`}</p>
              </div>

              {/* Hora y acción */}
              <div className="text-center shrink-0">
                <p className="text-white font-mono font-bold">{s.hour}</p>
                <p className={`text-xs font-bold ${s.action === 'ON' ? 'text-[#088fc3]' : 'text-red-400'}`}>{s.action}</p>
              </div>

              {/* Días */}
              <div className="flex gap-1 shrink-0">
                {DAYS.map(d => (
                  <span key={d.key}
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
                      ${s[d.key] ? 'bg-[#088fc3]/30 text-[#088fc3]' : 'bg-white/5 text-white/20'}`}>
                    {d.label}
                  </span>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(s)}
                  className="text-white/30 hover:text-white transition-colors cursor-pointer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button onClick={() => del(s.id)}
                  className="text-white/30 hover:text-red-400 transition-colors cursor-pointer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}

        {schedulers.length === 0 && (
        <div className="text-center py-16">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-24 h-24 mx-auto mb-4 text-[#088fc3] opacity-20">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p className="text-white/25 text-sm">Crea una nueva programación</p>
        </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg"
          onClick={() => setShowModal(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-[420px] rounded-3xl border border-[#088fc3]/30 p-6 bg-[#060c12] shadow-2xl bg-gradient-to-br from-[#004d89]/20 to-transparent">
            <p className="text-white font-black text-lg mb-5">{editing ? 'Editar programación' : 'Nueva programación'}</p>

            <div className="flex flex-col gap-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nombre"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#088fc3]/50" />

              <select value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: parseInt(e.target.value) }))}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#088fc3]/50">
                {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
              </select>

              <div className="flex gap-3">
                <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#088fc3]/50">
                  <option value="ON">Encender</option>
                  <option value="OFF">Apagar</option>
                </select>
                <input type="time" value={form.hour} onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#088fc3]/50" />
              </div>

              {/* Días */}
              <div className="flex gap-2 justify-center mt-1">
                {DAYS.map(d => (
                  <button key={d.key} onClick={() => setForm(f => ({ ...f, [d.key]: f[d.key] ? 0 : 1 }))}
                    className={`w-9 h-9 rounded-full text-sm font-bold cursor-pointer transition-all
                      ${form[d.key] ? 'bg-[#088fc3] text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold cursor-pointer hover:bg-white/10">
                Cancelar
              </button>
              <button onClick={save}
                className="flex-1 py-3 rounded-xl bg-[#088fc3]/20 border border-[#088fc3]/40 text-[#088fc3] font-bold cursor-pointer hover:bg-[#088fc3]/30">
                {editing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}