import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import HourPicker from '../components/HourPicker'

export default function Quiet() {
  const [mode, setMode] = useState('OFF')
  const [maxSpeed, setMaxSpeed] = useState(3)
  const [startHour, setStartHour] = useState('22:00')
  const [endHour, setEndHour] = useState('06:00')
  const [saved, setSaved] = useState(false)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then(r => r.json())
      .then(arr => {
        const get = (key, def) => {
          const found = arr.find(i => i.key === key)
          return found ? found.value : def
        }
        setMode(get('quiet_mode', 'OFF'))
        setMaxSpeed(get('quiet_max_speed', 3))
        setStartHour(get('quiet_start', '22:00'))
        setEndHour(get('quiet_end', '06:00'))
      })
  }, [])

  const save = async () => {
    const configs = [
      { key: 'quiet_mode',      value: mode },
      { key: 'quiet_max_speed', value: maxSpeed },
      { key: 'quiet_start',     value: startHour },
      { key: 'quiet_end',       value: endHour },
    ]
    await Promise.all(configs.map(c =>
      fetch(`${API_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      })
    ))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4">

      {/* Header */}
      <div className="shrink-0">
        <p className="text-white/20 text-xs font-bold tracking-widest uppercase">Modo Silencio</p>
        <p className="text-white/40 text-sm mt-1">Limita la velocidad del fan durante el periodo configurado</p>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-3 shrink-0">
        {['OFF', '24H', 'TIME'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-4 rounded-2xl border font-black text-lg cursor-pointer transition-all
              ${mode === m
                ? 'bg-[#088fc3]/20 border-[#088fc3]/40 text-[#088fc3]'
                : 'bg-white/3 border-white/10 text-white/30 hover:bg-white/8'}`}>
            {m === 'OFF' ? 'Desactivado' : m === '24H' ? '24 horas' : 'Horario'}
          </button>
        ))}
      </div>

      {/* Velocidad + Horario en paralelo */}
      {mode !== 'OFF' && (
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Velocidad máxima */}
          <div className="flex-1 bg-white/3 rounded-2xl border border-white/8 p-6 flex flex-col">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Velocidad máxima</p>
            <div className="flex-1 flex items-center justify-center gap-6">
              <button onClick={() => setMaxSpeed(s => Math.max(1, s - 1))}
                className="w-14 h-14 rounded-2xl bg-white/8 border border-white/10 text-white text-3xl font-black cursor-pointer hover:bg-white/15 flex items-center justify-center">
                −
              </button>
              <div className="text-center">
                <p className="text-[#088fc3] text-7xl font-black font-mono leading-none">{String(maxSpeed).padStart(2,'0')}</p>
                <p className="text-white/25 text-xs mt-2">de 10</p>
              </div>
              <button onClick={() => setMaxSpeed(s => Math.min(10, s + 1))}
                className="w-14 h-14 rounded-2xl bg-white/8 border border-white/10 text-white text-3xl font-black cursor-pointer hover:bg-white/15 flex items-center justify-center">
                +
              </button>
            </div>
          </div>

          {/* Horario — solo en modo TIME */}
        {mode === 'TIME' && (
        <div className="flex-1 bg-white/3 rounded-2xl border border-white/8 p-6 flex flex-col">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-4">Horario de silencio</p>
            <div className="flex-1 flex items-center gap-4">
            <div className="flex-1">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Inicio</p>
                <button onClick={() => setShowStartPicker(true)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-black font-mono cursor-pointer hover:bg-white/10">
                {startHour}
                </button>
                {showStartPicker && (
                <HourPicker value={startHour}
                    onChange={val => setStartHour(val)}
                    onClose={() => setShowStartPicker(false)} />
                )}
            </div>
            <div className="text-white/20 text-xl shrink-0">→</div>
            <div className="flex-1">
                <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Fin</p>
                <button onClick={() => setShowEndPicker(true)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-2xl font-black font-mono cursor-pointer hover:bg-white/10">
                {endHour}
                </button>
                {showEndPicker && (
                <HourPicker value={endHour}
                    onChange={val => setEndHour(val)}
                    onClose={() => setShowEndPicker(false)} />
                )}
            </div>
            </div>
        </div>
        )}

        </div>
      )}

      {/* Botón guardar — siempre visible */}
      <button onClick={save}
        className={`w-full py-4 rounded-2xl font-black text-lg cursor-pointer transition-all shrink-0
          ${saved
            ? 'bg-green-500/20 border border-green-500/40 text-green-400'
            : 'bg-[#088fc3]/20 border border-[#088fc3]/40 text-[#088fc3] hover:bg-[#088fc3]/30'}`}>
        {saved ? '✓ Guardado' : 'Guardar configuración'}
      </button>

    </div>
  )
}