import { useState } from 'react'

export default function HourPicker({ value, onChange, onClose }) {
  const [hours, minutes] = (value || '08:00').split(':').map(Number)
  const [h, setH] = useState(hours)
  const [m, setM] = useState(minutes)

  const confirm = () => {
    onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
    onClose()
  }

  return (
    <div className="fixed bottom-0 right-0 z-[200] bg-[#07111a] border-t border-l border-white/10 p-4 shadow-2xl"
      style={{ left: '64px' }}
      onTouchStart={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-center gap-8 mb-4">
        {/* Horas */}
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setH(h => (h + 1) % 24)}
            className="w-12 h-12 rounded-xl bg-white/10 text-white text-2xl cursor-pointer hover:bg-white/20">▲</button>
          <span className="text-white font-mono text-4xl font-black w-16 text-center">{String(h).padStart(2,'0')}</span>
          <button onClick={() => setH(h => (h - 1 + 24) % 24)}
            className="w-12 h-12 rounded-xl bg-white/10 text-white text-2xl cursor-pointer hover:bg-white/20">▼</button>
          <span className="text-white/30 text-xs">HORA</span>
        </div>

        <span className="text-white text-4xl font-black">:</span>

        {/* Minutos */}
        <div className="flex flex-col items-center gap-2">
          <button onClick={() => setM(m => (m + 5) % 60)}
            className="w-12 h-12 rounded-xl bg-white/10 text-white text-2xl cursor-pointer hover:bg-white/20">▲</button>
          <span className="text-white font-mono text-4xl font-black w-16 text-center">{String(m).padStart(2,'0')}</span>
          <button onClick={() => setM(m => (m - 5 + 60) % 60)}
            className="w-12 h-12 rounded-xl bg-white/10 text-white text-2xl cursor-pointer hover:bg-white/20">▼</button>
          <span className="text-white/30 text-xs">MINUTOS</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold cursor-pointer">
          Cancelar
        </button>
        <button onClick={confirm}
          className="flex-1 py-3 rounded-xl bg-[#088fc3]/20 border border-[#088fc3]/40 text-[#088fc3] font-bold cursor-pointer hover:bg-[#088fc3]/30">
          Confirmar
        </button>
      </div>
    </div>
  )
}