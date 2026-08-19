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

function SchedulerModal({ editing, form, setForm, zones, onSave, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-[420px] rounded-3xl border border-[#088fc3]/30 p-6 bg-[#060c12] shadow-2xl bg-gradient-to-br from-[#004d89]/20 to-transparent">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Programación</p>
            <p className="text-white text-2xl font-black">{editing ? 'Editar' : 'Nueva'}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Nombre</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Encendido mañana"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#088fc3]/60" />
          </div>

          <div>
            <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Zona</label>
            <select value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: parseInt(e.target.value) }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#088fc3]/60"
              style={{ backgroundColor: '#0d1a26' }}>
              {zones.map(z => (
                <option key={z.zone_id} value={z.zone_id} style={{ backgroundColor: '#0d1a26' }}>{z.name || `Zona ${z.zone_id}`}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Acción</label>
              <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#088fc3]/60"
                style={{ backgroundColor: '#0d1a26' }}>
                <option value="ON" style={{ backgroundColor: '#0d1a26' }}>▶ Encender</option>
                <option value="OFF" style={{ backgroundColor: '#0d1a26' }}>■ Apagar</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Hora</label>
              <input type="time" value={form.hour} onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#088fc3]/60" />
            </div>
          </div>

          <div>
            <label className="text-white/30 text-xs uppercase tracking-wider block mb-2">Días</label>
            <div className="flex gap-2 justify-between">
              {DAYS.map(d => (
                <button key={d.key} onClick={() => setForm(f => ({ ...f, [d.key]: f[d.key] ? 0 : 1 }))}
                  className={`flex-1 h-10 rounded-xl text-sm font-bold cursor-pointer transition-all
                    ${form[d.key] ? 'bg-[#088fc3] text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold cursor-pointer hover:bg-white/10">
            Cancelar
          </button>
          <button onClick={onSave}
            className="flex-1 py-3 rounded-xl bg-[#088fc3]/20 border border-[#088fc3]/40 text-[#088fc3] font-bold cursor-pointer hover:bg-[#088fc3]/30">
            {editing ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Scheduler({ data }) {
  const [schedulers, setSchedulers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const zones = data?.zones || []

  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/scheduler`)
      const json = await res.json()
      setSchedulers(Array.isArray(json) ? json : [])
    } catch { setSchedulers([]) }
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

      {schedulers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-24 h-24 mb-4 text-[#088fc3] opacity-20">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-white/25 text-sm">Crea una nueva programación</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {schedulers.map(s => {
            const zone = zones.find(z => z.zone_id === s.zone_id)
            const activeDays = DAYS.filter(d => s[d.key]).map(d => d.label)
            return (
              <div key={s.id}
                className={`relative rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all hover:scale-[1.02]
                  ${s.active
                    ? 'bg-gradient-to-br from-[#004d89]/40 to-[#088fc3]/10 border-[#088fc3]/30'
                    : 'bg-gradient-to-br from-white/3 to-transparent border-white/8 opacity-60'}`}>

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className={`text-3xl font-black ${s.action === 'ON' ? 'text-[#088fc3]' : 'text-red-400'}`}>
                    {s.action === 'ON' ? '▶' : '■'}
                  </div>
                  <button onClick={() => toggle(s)}
                    className={`w-9 h-5 rounded-full transition-all cursor-pointer relative shrink-0
                      ${s.active ? 'bg-[#088fc3]' : 'bg-white/15'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${s.active ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="text-white font-black text-lg leading-tight">{s.name}</p>
                  <p className="text-white/40 text-xs mt-1">{zone?.name || `Zona ${s.zone_id}`}</p>
                </div>

                {/* Hora */}
                <p className="text-white font-mono text-2xl font-bold">{s.hour}</p>

                {/* Días */}
                <div className="flex gap-1">
                  {DAYS.map(d => (
                    <span key={d.key}
                      className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
                        ${s[d.key] ? 'bg-[#088fc3]/30 text-[#088fc3]' : 'bg-white/5 text-white/20'}`}>
                      {d.label}
                    </span>
                  ))}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-1 border-t border-white/5">
                  <button onClick={() => openEdit(s)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 text-xs cursor-pointer transition-colors">
                    Editar
                  </button>
                  <button onClick={() => del(s.id)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 text-xs cursor-pointer transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <SchedulerModal
          editing={editing}
          form={form}
          setForm={setForm}
          zones={zones}
          onSave={save}
          onClose={() => { setShowModal(false); setEditing(null); setForm(EMPTY) }}
        />
      )}
    </div>
  )
}