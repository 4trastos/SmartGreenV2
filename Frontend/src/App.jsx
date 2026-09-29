import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Control from './pages/Control'
import Alarms from './pages/Alarms'
import Maintenance from './pages/Maintenance'
import Settings from './pages/Settings'
import { useSmartGreen } from './hooks/useSmartGreen'
import Scheduler from './pages/Scheduler'
import IMD from './pages/IMD'
import Setup from './pages/Setup'
import Quiet from './pages/Quiet'
import { API_URL } from './config.js'

const NAV = [
  { id: 'control', label: 'Control',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg> },
  { id: 'dashboard', label: 'Vista General',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { id: 'alarms', label: 'Alarmas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: 'scheduler', label: 'Programador',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'quiet', label: 'Modo Silencio',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
  { id: 'maint', label: 'Mantenimiento',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { id: 'settings', label: 'Configuración',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

function RebootModal({ onClose }) {
  const [rebooting, setRebooting] = useState(false)
  const doReboot = async () => {
    setRebooting(true)
    await fetch(`${API_URL}/reboot`, { method: 'POST' }).catch(() => {})
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-[360px] rounded-3xl border border-red-500/30 p-6 bg-[#060c12] shadow-2xl bg-gradient-to-br from-red-900/20 to-transparent">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </div>
          <p className="text-white text-xl font-black mb-2">¿Reiniciar el sistema?</p>
          <p className="text-white/40 text-sm">Connect se reiniciará y la pantalla quedará apagada unos segundos.</p>
        </div>
        {rebooting ? (
          <div className="text-center py-4">
            <p className="text-red-400 font-bold">Reiniciando...</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold cursor-pointer hover:bg-white/10">Cancelar</button>
            <button onClick={doReboot} className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold cursor-pointer hover:bg-red-500/30">Reiniciar</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useState(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right">
      <p className="text-white font-mono text-sm font-bold leading-none">{time.toLocaleTimeString('es-ES')}</p>
      <p className="text-white/30 text-xs mt-0.5">{time.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('control')
  const [showReboot, setShowReboot] = useState(false)
  const [imdActive, setImdActive] = useState(false)
  const [imdZoneId, setImdZoneId] = useState(null)
  const [setupRequired, setSetupRequired] = useState(null)
  const [quietMode, setQuietMode] = useState(0)
  const [schedulerActive, setSchedulerActive] = useState(false)
  const { data, connected } = useSmartGreen()

  useEffect(() => {
    fetch(`${API_URL}/setup/status`)
      .then(r => r.json())
      .then(d => setSetupRequired(d.setup_required))
      .catch(() => setSetupRequired(false))
  }, [])

  useEffect(() => {
    fetch(`${API_URL}/config`)
      .then(r => r.json())
      .then(arr => {
        const found = arr.find(i => i.key === 'quiet_mode')
        if (found) setQuietMode(found.value)
      })
      .catch(() => {})
  }, [data.zones])

  useEffect(() => {
    const checkScheduler = () => {
      fetch(`${API_URL}/scheduler`)
        .then(r => r.json())
        .then(arr => {
          const now = new Date()
          const day = now.getDay() === 0 ? 'sun' : ['mon','tue','wed','thu','fri','sat'][now.getDay()-1]
          const active = arr.some(s => s.active && s[day])
          setSchedulerActive(active)
        })
        .catch(() => {})
    }
    checkScheduler()
    const interval = setInterval(checkScheduler, 30000)
    return () => clearInterval(interval)
  }, [])

  const alarmCount = data.coolers.filter(c =>
    c.alarm_fault || c.alarm_water || c.alarm_comms || c.alarm_salinity
  ).length + data.sensors.filter(s =>
    s.alarm_signal || s.alarm_temp
  ).length

  const isPrewet = !imdActive && data.zones.some(z => z.prewet_in_progress === 'yes')
  const pages = { dashboard: Dashboard, control: Control, alarms: Alarms, maint: Maintenance, settings: Settings, scheduler: Scheduler, quiet: Quiet }
  const PageComponent = pages[page]

  if (setupRequired === null)
    return <div className="flex h-screen w-screen bg-[#060c12] items-center justify-center text-white/40">Iniciando...</div>

  if (setupRequired)
    return <Setup onComplete={() => setSetupRequired(false)} data={data} />

  return (
    <div className="flex h-screen w-screen bg-[#060c12] overflow-hidden text-white"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <nav className="relative z-20 flex flex-col items-center py-5 w-16 border-r border-white/5 bg-[#07111a]/90 backdrop-blur-xl shrink-0">
        <div className="flex flex-col gap-1 flex-1 w-full px-2 mt-2">
          {NAV.map(item => {
            const isActive = page === item.id
            const hasAlert = item.id === 'alarms' && alarmCount > 0
            const hasScheduler = item.id === 'scheduler' && schedulerActive
            return (
              <button key={item.id} onClick={() => !isPrewet && !imdActive && setPage(item.id)}
                className={`relative w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isPrewet || imdActive ? 'opacity-30 cursor-not-allowed text-white/20' : isActive ? 'bg-[#088fc3]/20 text-white shadow-[inset_0_0_0_1px_rgba(8,143,195,0.3)] cursor-pointer' : 'text-white/40 hover:text-white hover:bg-white/6 cursor-pointer'}`}>
                {item.icon}
                {hasAlert && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444]" />}
                {hasScheduler && !hasAlert && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_6px_#4ade80]" />}
              </button>
            )
          })}
        </div>

        {/* Separador + botón reboot */}
        <div className="w-full px-2 mb-3">
          <div className="border-t border-white/8 mb-3" />
          <button onClick={() => !isPrewet && setShowReboot(true)}
            className={`w-full h-11 rounded-xl flex items-center justify-center transition-all duration-200
              ${isPrewet ? 'opacity-30 cursor-not-allowed text-white/20' : 'cursor-pointer text-white/25 hover:text-red-400 hover:bg-red-500/10'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </button>
        </div>

        <div className="mb-1">
          <div className={`w-2 h-2 rounded-full mx-auto transition-all ${connected ? 'bg-[#088fc3] shadow-[0_0_8px_#088fc3]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="relative flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-[#07111a]/70 backdrop-blur-xl shrink-0 h-14">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-xs tracking-widest uppercase font-medium">
              {NAV.find(n => n.id === page)?.label}
            </span>
            {quietMode > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-[#088fc3]/30 bg-[#088fc3]/10 text-[#088fc3] font-bold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Modo silencio
              </span>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <img src="/logo_australair_connect_Mini.png" alt="Australair" className="h-5 brightness-0 invert opacity-80" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {alarmCount > 0 && (
              <button onClick={() => setPage('alarms')}
                className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {alarmCount} alarma{alarmCount > 1 ? 's' : ''}
              </button>
            )}
            <Clock />
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border
              ${connected ? 'text-[#088fc3] border-[#088fc3]/30 bg-[#088fc3]/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#088fc3]' : 'bg-red-400'}`} />
              {connected ? 'En línea' : 'Sin conexión'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {imdActive ? (
            <IMD
              data={data}
              onExit={() => {
                setImdActive(false)
                fetch(`${API_URL}/zones/${imdZoneId}/onoff`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'OFF'}) })
                fetch(`${API_URL}/zones/${imdZoneId}/cancelprewet`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}' })
                fetch(`${API_URL}/zones/${imdZoneId}/mode`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mode: 'AUTO'}) })
              }}
            />
          ) : (
            <PageComponent
              data={data}
              connected={connected}
              onImdActivate={(zoneId) => { setImdActive(true); setImdZoneId(zoneId) }}
            />
          )}
        </div>
      </main>

      {showReboot && <RebootModal onClose={() => setShowReboot(false)} />}
    </div>
  )
}