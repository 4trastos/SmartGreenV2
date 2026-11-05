import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'
import HourPicker from '../components/HourPicker'
import { useLang, translate } from '../i18n.js'

const T = {
  es: {
    title: 'Modo Silencio', subtitle: 'Limita la velocidad del fan durante el periodo configurado',
    m_off: 'Desactivado', m_24h: '24 horas', m_time: 'Horario',
    max_speed: 'Velocidad máxima', of_10: 'de 10', quiet_schedule: 'Horario de silencio', start: 'Inicio', end: 'Fin',
    saved: '✓ Guardado', save: 'Guardar configuración',
  },
  en: {
    title: 'Quiet mode', subtitle: 'Limits the fan speed during the configured period',
    m_off: 'Off', m_24h: '24 hours', m_time: 'Schedule',
    max_speed: 'Maximum speed', of_10: 'of 10', quiet_schedule: 'Quiet hours', start: 'Start', end: 'End',
    saved: '✓ Saved', save: 'Save settings',
  },
  pt: {
    title: 'Modo silêncio', subtitle: 'Limita a velocidade do ventilador durante o período configurado',
    m_off: 'Desativado', m_24h: '24 horas', m_time: 'Horário',
    max_speed: 'Velocidade máxima', of_10: 'de 10', quiet_schedule: 'Horário de silêncio', start: 'Início', end: 'Fim',
    saved: '✓ Guardado', save: 'Guardar configuração',
  },
  ca: {
    title: 'Mode silenci', subtitle: 'Limita la velocitat del ventilador durant el període configurat',
    m_off: 'Desactivat', m_24h: '24 hores', m_time: 'Horari',
    max_speed: 'Velocitat màxima', of_10: 'de 10', quiet_schedule: 'Horari de silenci', start: 'Inici', end: 'Fi',
    saved: '✓ Desat', save: 'Desar configuració',
  },
  fr: {
    title: 'Mode silencieux', subtitle: 'Limite la vitesse du ventilateur pendant la période configurée',
    m_off: 'Désactivé', m_24h: '24 heures', m_time: 'Horaire',
    max_speed: 'Vitesse maximale', of_10: 'sur 10', quiet_schedule: 'Horaire de silence', start: 'Début', end: 'Fin',
    saved: '✓ Enregistré', save: 'Enregistrer la configuration',
  },
  it: {
    title: 'Modalità silenziosa', subtitle: 'Limita la velocità del ventilatore durante il periodo configurato',
    m_off: 'Disattivato', m_24h: '24 ore', m_time: 'Orario',
    max_speed: 'Velocità massima', of_10: 'su 10', quiet_schedule: 'Orario di silenzio', start: 'Inizio', end: 'Fine',
    saved: '✓ Salvato', save: 'Salva configurazione',
  },
}

// Texto de esta pantalla en el idioma activo (si falta, en español)
function useT() {
  const lang = useLang()
  return key => translate(T, lang, key)
}

const intToHour = (val) => {
  const h = Math.floor(val / 100)
  const m = val % 100
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

const hourToInt = (str) => {
  const [h, m] = str.split(':').map(Number)
  return h * 100 + m
}

const modeToInt = { 'OFF': 0, '24H': 1, 'TIME': 2 }
const intToMode = { 0: 'OFF', 1: '24H', 2: 'TIME' }

export default function Quiet() {
  const t = useT()
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
          return found !== undefined ? found.value : def
        }
        setMode(intToMode[get('quiet_mode', 0)] || 'OFF')
        setMaxSpeed(get('quiet_max_speed', 3))
        setStartHour(intToHour(get('quiet_start', 2200)))
        setEndHour(intToHour(get('quiet_end', 600)))
      })
  }, [])

  const save = async () => {
    const configs = [
      { key: 'quiet_mode',      value: modeToInt[mode] },
      { key: 'quiet_max_speed', value: maxSpeed },
      { key: 'quiet_start',     value: hourToInt(startHour) },
      { key: 'quiet_end',       value: hourToInt(endHour) },
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
        <p className="text-white/20 text-xs font-bold tracking-widest uppercase">{t('title')}</p>
        <p className="text-white/40 text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Selector de modo */}
      <div className="flex gap-3 shrink-0">
        {['OFF', '24H', 'TIME'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-4 rounded-2xl border font-black text-lg cursor-pointer transition-all
              ${mode === m
                ? 'bg-[#088fc3]/20 border-[#088fc3]/40 text-[#088fc3]'
                : 'bg-white/3 border-white/10 text-white/30 hover:bg-white/8'}`}>
            {m === 'OFF' ? t('m_off') : m === '24H' ? t('m_24h') : t('m_time')}
          </button>
        ))}
      </div>

      {/* Velocidad + Horario en paralelo */}
      {mode !== 'OFF' && (
        <div className="flex gap-4 flex-1 min-h-0">

          {/* Velocidad máxima */}
          <div className="flex-1 bg-white/3 rounded-2xl border border-white/8 p-6 flex flex-col">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-4">{t('max_speed')}</p>
            <div className="flex-1 flex items-center justify-center gap-6">
              <button onClick={() => setMaxSpeed(s => Math.max(1, s - 1))}
                className="w-14 h-14 rounded-2xl bg-white/8 border border-white/10 text-white text-3xl font-black cursor-pointer hover:bg-white/15 flex items-center justify-center">
                −
              </button>
              <div className="text-center">
                <p className="text-[#088fc3] text-7xl font-black font-mono leading-none">{String(maxSpeed).padStart(2,'0')}</p>
                <p className="text-white/25 text-xs mt-2">{t('of_10')}</p>
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
              <p className="text-white/40 text-xs uppercase tracking-wider mb-4">{t('quiet_schedule')}</p>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-2">{t('start')}</p>
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
                  <p className="text-white/30 text-xs uppercase tracking-wider mb-2">{t('end')}</p>
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
        {saved ? t('saved') : t('save')}
      </button>

    </div>
  )
}
