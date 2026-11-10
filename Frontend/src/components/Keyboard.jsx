import { useState } from 'react'
import { useLang, translate } from '../i18n.js'

const T = {
  es: { placeholder: 'Escribe...' },
  en: { placeholder: 'Type...' },
  pt: { placeholder: 'Escreva...' },
  ca: { placeholder: 'Escriviu...' },
  fr: { placeholder: 'Saisissez...' },
  it: { placeholder: 'Scrivi...' },
}

// La última fila lleva el apóstrofo y el guion: hacen falta en nombres como "L'Oficina" o "Sala d'estar"
const ROWS_FULL = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l','ñ'],
  ['z','x','c','v','b','n','m',',','.','⌫'],
  ['CAPS',"'",'ESPACIO','-','↵']
]

const ROWS_NUMERIC = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['⌫','0','↵']
]

// Con signo (offsets de calibración, que suelen ser negativos): la tecla "-" cambia el signo del número
const ROWS_NUMERIC_SIGNED = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['-','0','⌫'],
  ['↵']
]

export default function Keyboard({ value, onChange, onClose, numeric = false, signed = false }) {
  const lang = useLang()
  const [caps, setCaps] = useState(false)
  const ROWS = numeric ? (signed ? ROWS_NUMERIC_SIGNED : ROWS_NUMERIC) : ROWS_FULL

  const press = (key) => {
    if (key === '⌫') onChange(value.slice(0, -1))
    else if (key === 'CAPS') setCaps(c => !c)
    else if (key === '↵') onClose()
    else if (key === '-' && numeric) onChange(value.startsWith('-') ? value.slice(1) : '-' + value)
    else if (key === 'ESPACIO') onChange(value + ' ')
    else onChange(value + (caps ? key.toUpperCase() : key))
  }

  return (
    <div className="fixed bottom-0 right-0 z-[200] bg-[#07111a] border-t border-l border-white/10 shadow-2xl"
      style={{ left: '64px' }}
      onTouchStart={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}>

      {/* Barra de preview */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-[#0a1929]">
        <span className="flex-1 text-white font-bold text-lg truncate min-h-[28px]">
          {value ? value : <span className="text-white/20 font-normal">{translate(T, lang, 'placeholder')}</span>}
        </span>
        <button onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-[#088fc3] text-white text-sm font-bold cursor-pointer shrink-0">
          OK ↵
        </button>
      </div>

      {/* Teclas */}
      <div className="p-3">
        {ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1.5 justify-center mb-1.5">
            {row.map((key, ki) => (
              <button key={ki} onClick={() => press(key)}
                className={`h-12 rounded-xl font-bold text-sm cursor-pointer transition-all
                  ${key === 'ESPACIO' ? 'flex-[6] bg-white/10 text-white/60' :
                    key === 'CAPS' ? `flex-[2] ${caps ? 'bg-[#088fc3] text-white' : 'bg-white/10 text-white/60'}` :
                    key === '↵' ? 'flex-[2] bg-[#088fc3] text-white' :
                    key === '⌫' ? 'flex-[2] bg-red-500/20 text-red-400' :
                    'flex-1 bg-white/8 text-white hover:bg-white/15'}`}>
                {key === 'ESPACIO' ? '␣' : caps && key.length === 1 ? key.toUpperCase() : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
