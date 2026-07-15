import { useState } from 'react'

const API_URL = 'http://localhost:8080/api'

function timeAgo(ts) {
  const diff = Math.floor(Date.now()/1000 - ts)
  if (diff < 60) return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff/60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff/3600)} h`
  return `Hace ${Math.floor(diff/86400)} días`
}

function alarmLevel(msg) {
  if (msg.includes('🔴')) return 'red'
  if (msg.includes('🟡')) return 'yellow'
  return 'blue'
}

const LEVEL_STYLES = {
  red:    { bar: 'bg-red-500',    bg: 'bg-red-500/8',    border: 'border-red-500/30',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  yellow: { bar: 'bg-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  blue:   { bar: 'bg-[#088fc3]',  bg: 'bg-[#004d89]/10', border: 'border-[#088fc3]/30',  text: 'text-[#088fc3]',  badge: 'bg-[#088fc3]/20 text-[#088fc3] border-[#088fc3]/30' },
}

// Genera alarmas activas desde el estado actual de coolers/sensores
function getActiveAlarms(data) {
  const alarms = []
  const now = Math.floor(Date.now()/1000)

  if (data.status && !data.status.modbus_connected)
    alarms.push({ id: 'modbus', level: 'red', message: 'Sin comunicación Modbus', unit_id: 0, timestamp: now })

  for (const c of data.coolers || []) {
    if (c.alarm_fault)
      alarms.push({ id: `fault_${c.unit_id}`, level: 'red', message: `Fallo cooler #${c.unit_id}`, unit_id: c.unit_id, timestamp: now })
    if (c.alarm_comms)
      alarms.push({ id: `comms_${c.unit_id}`, level: 'red', message: `Sin comunicación cooler #${c.unit_id}`, unit_id: c.unit_id, timestamp: now })
    if (c.alarm_salinity)
      alarms.push({ id: `sal_${c.unit_id}`, level: 'yellow', message: `Salinidad alta cooler #${c.unit_id} (${c.salinity_us?.toFixed(0)} μS)`, unit_id: c.unit_id, timestamp: now })
    if (c.alarm_water)
      alarms.push({ id: `water_${c.unit_id}`, level: 'yellow', message: `Sin agua cooler #${c.unit_id}`, unit_id: c.unit_id, timestamp: now })
    if (c.alarm_warranty)
      alarms.push({ id: `warranty_${c.unit_id}`, level: 'yellow', message: `Garantía próxima a vencer cooler #${c.unit_id}`, unit_id: c.unit_id, timestamp: now })
    if (c.alarm_maint_closing)
      alarms.push({ id: `maint_c_${c.unit_id}`, level: 'yellow', message: `Mantenimiento cierre pendiente cooler #${c.unit_id}`, unit_id: c.unit_id, timestamp: now })
    if (c.alarm_maint_opening)
      alarms.push({ id: `maint_o_${c.unit_id}`, level: 'yellow', message: `Mantenimiento apertura pendiente cooler #${c.unit_id}`, unit_id: c.unit_id, timestamp: now })
  }

  for (const s of data.sensors || []) {
    if (s.alarm_signal)
      alarms.push({ id: `sig_${s.sensor_id}`, level: 'red', message: `Sensor sin señal #${s.sensor_id} (${s.type})`, unit_id: s.sensor_id, timestamp: now })
    if (s.alarm_temp)
      alarms.push({ id: `temp_${s.sensor_id}`, level: 'yellow', message: `Temperatura fuera de rango sensor #${s.sensor_id}`, unit_id: s.sensor_id, timestamp: now })
  }

  return alarms.sort((a, b) => (a.level === 'red' ? -1 : 1))
}

function AlarmRow({ alarm }) {
  const st = LEVEL_STYLES[alarm.level]
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${st.bg} ${st.border}`}>
      <div className={`w-1 self-stretch rounded-full shrink-0 ${st.bar}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${st.text}`}>{alarm.message}</p>
        {alarm.unit_id > 0 && (
          <p className="text-white/25 text-xs mt-0.5">ID #{alarm.unit_id}</p>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${st.badge}`}>
        {alarm.level === 'red' ? 'CRÍTICO' : 'AVISO'}
      </span>
    </div>
  )
}

function HistoryModal({ onClose }) {
  const [history, setHistory] = useState([])
  const [loaded, setLoaded] = useState(false)

  useState(() => {
    fetch(`${API_URL}/alarms`)
      .then(r => r.json())
      .then(d => { setHistory(d); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="w-[500px] max-h-[85vh] rounded-3xl border border-white/10 p-6 bg-[#060c12] shadow-2xl flex flex-col">
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Alarmas</p>
            <p className="text-white text-xl font-black">Histórico</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {!loaded && <p className="text-white/30 text-center py-8">Cargando...</p>}
          {loaded && history.length === 0 && <p className="text-white/30 text-center py-8">Sin alarmas en el historial</p>}
          {history.map(alarm => {
            const level = alarmLevel(alarm.message)
            const st = LEVEL_STYLES[level]
            const cleanMsg = alarm.message.replace(/🔴|🟡|🟢/g, '').trim()
            return (
              <div key={alarm.id} className={`flex items-start gap-3 p-3 rounded-xl border ${st.bg} ${st.border}`}>
                <div className={`w-1 self-stretch rounded-full shrink-0 ${st.bar}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${st.text}`}>{cleanMsg}</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    {timeAgo(alarm.timestamp)} · {new Date(alarm.timestamp * 1000).toLocaleString('es-ES')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${st.badge}`}>
                  {level === 'red' ? 'CRÍTICO' : 'AVISO'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Alarms({ data }) {
  const [showHistory, setShowHistory] = useState(false)
  const activeAlarms = getActiveAlarms(data)
  const critCount = activeAlarms.filter(a => a.level === 'red').length
  const warnCount = activeAlarms.filter(a => a.level === 'yellow').length

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-hidden">
      {/* Header con 3 botones */}
      <div className="flex gap-2 shrink-0">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1
          ${critCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/3 border-white/8'}`}>
          <span className={`text-3xl font-black font-mono ${critCount > 0 ? 'text-red-400' : 'text-white/20'}`}>{critCount}</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${critCount > 0 ? 'text-red-400' : 'text-white/20'}`}>Críticos</p>
            <p className="text-white/20 text-xs">Acción inmediata</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border flex-1
          ${warnCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/3 border-white/8'}`}>
          <span className={`text-3xl font-black font-mono ${warnCount > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{warnCount}</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${warnCount > 0 ? 'text-yellow-400' : 'text-white/20'}`}>Avisos</p>
            <p className="text-white/20 text-xs">Revisar pronto</p>
          </div>
        </div>

        <button onClick={() => setShowHistory(true)}
          className="px-4 py-3 rounded-2xl border border-white/10 bg-white/3 hover:bg-white/8 cursor-pointer transition-all flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-white/40">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
          </svg>
          <span className="text-white/40 text-sm font-bold">Histórico</span>
        </button>
      </div>

      {/* Lista alarmas activas */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeAlarms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-4xl mb-3">🟢</p>
            <p className="text-white/30 font-bold">Sin alarmas activas</p>
            <p className="text-white/15 text-sm mt-1">Todos los sistemas funcionan correctamente</p>
          </div>
        ) : (
          activeAlarms.map(alarm => <AlarmRow key={alarm.id} alarm={alarm} />)
        )}
      </div>

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  )
}
