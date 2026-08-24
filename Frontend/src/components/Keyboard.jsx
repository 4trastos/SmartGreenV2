// components/Keyboard.jsx
import { useState } from 'react'

const ROWS = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l','ñ'],
  ['z','x','c','v','b','n','m',',','.','⌫'],
  ['CAPS',' ',' ',' ','ESPACIO',' ',' ',' ','↵']
]

export default function Keyboard({ value, onChange, onClose }) {
  const [caps, setCaps] = useState(false)

  const press = (key) => {
    if (key === '⌫')
      onChange(value.slice(0, -1))
    else if (key === 'CAPS')
      setCaps(c => !c)
    else if (key === '↵')
      onClose()
    else if (key === 'ESPACIO')
      onChange(value + ' ')
    else
      onChange(value + (caps ? key.toUpperCase() : key))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#07111a] border-t border-white/10 p-3 shadow-2xl"
      onTouchStart={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}>
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1.5 justify-center mb-1.5">
          {row.map((key, ki) => (
            <button key={ki} onClick={() => press(key)}
              className={`h-11 rounded-xl font-bold text-sm cursor-pointer transition-all
                ${key === 'ESPACIO' ? 'flex-[4] bg-white/10 text-white/60' :
                  key === 'CAPS' ? `flex-[1.5] ${caps ? 'bg-[#088fc3] text-white' : 'bg-white/10 text-white/60'}` :
                  key === '↵' ? 'flex-[1.5] bg-[#088fc3] text-white' :
                  key === '⌫' ? 'flex-[1.5] bg-red-500/20 text-red-400' :
                  'flex-1 bg-white/8 text-white hover:bg-white/15'}`}>
              {key === 'ESPACIO' ? '␣' : caps && key.length === 1 ? key.toUpperCase() : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}