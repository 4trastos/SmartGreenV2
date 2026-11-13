import { useState } from 'react'
import { API_URL } from '../config.js'
import { useLang, translate } from '../i18n.js'

const T = {
  es: { pin_restricted: 'Acceso restringido', pin_wrong: 'PIN incorrecto', cancel: 'Cancelar' },
  en: { pin_restricted: 'Restricted access', pin_wrong: 'Wrong PIN', cancel: 'Cancel' },
  pt: { pin_restricted: 'Acesso restrito', pin_wrong: 'PIN incorreto', cancel: 'Cancelar' },
  ca: { pin_restricted: 'Accés restringit', pin_wrong: 'PIN incorrecte', cancel: 'Cancel·lar' },
  fr: { pin_restricted: 'Accès restreint', pin_wrong: 'PIN incorrect', cancel: 'Annuler' },
  it: { pin_restricted: 'Accesso riservato', pin_wrong: 'PIN errato', cancel: 'Annulla' },
}

// Teclado de PIN del técnico. Lo usan el IMD y el histórico de alarmas.
// title: lo que se va a abrir ("Modo IMD", "Histórico"...), ya traducido por quien lo llama.
export default function PinModal({ title, onSuccess, onCancel }) {
  const lang = useLang()
  const t = key => translate(T, lang, key)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const confirmPin = async (pinValue) => {
    const res = await fetch(`${API_URL}/imd/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinValue })
    }).catch(() => null)
    if (res && res.ok) {
      setPin('')
      setPinError(false)
      onSuccess()
    } else {
      setPinError(true)
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()}
        className="w-[300px] rounded-3xl border border-white/10 p-6 bg-[#060c12] shadow-2xl">
        <p className="text-white/30 text-xs tracking-widest uppercase mb-1 text-center">{t('pin_restricted')}</p>
        <p className="text-white text-xl font-black mb-6 text-center">{title}</p>
        <div className="flex justify-center gap-3 mb-6">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all
              ${pinError ? 'border-red-500 bg-red-500' :
                pin.length > i ? 'border-[#088fc3] bg-[#088fc3]' : 'border-white/20 bg-transparent'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6,7,8,9,'⌫',0,''].map((k, i) => (
            k === '' ? <div key={i} /> :
            <button key={i} onClick={() => {
              if (k === '⌫') { setPin(p => p.slice(0,-1)); setPinError(false); return }
              if (pin.length >= 4) return
              const newPin = pin + k
              setPin(newPin)
              setPinError(false)
              if (newPin.length === 4) confirmPin(newPin)
            }}
              className={`h-12 rounded-xl font-bold text-lg cursor-pointer transition-all
                ${k === '⌫' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/8 text-white hover:bg-white/15'}`}>
              {k}
            </button>
          ))}
        </div>
        {pinError && <p className="text-red-400 text-xs text-center mt-3">{t('pin_wrong')}</p>}
        <button onClick={onCancel}
          className="w-full mt-4 py-2 rounded-xl bg-white/5 text-white/40 text-sm cursor-pointer hover:bg-white/10">
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}
