const mockAlarms = [
  { id: 8, unit_id: 2, timestamp: Date.now()/1000 - 120, level: 'ERROR', message: '🔴 CRITICO: Fault cooler unit_id=2 code=3' },
  { id: 7, unit_id: 5, timestamp: Date.now()/1000 - 3600, level: 'ERROR', message: '🟡 AVISO: Garantía vence en menos de 30 días unit_id=5' },
  { id: 6, unit_id: 3, timestamp: Date.now()/1000 - 7200, level: 'ERROR', message: '🟡 AVISO: Sin agua cooler unit_id=3' },
  { id: 5, unit_id: 0, timestamp: Date.now()/1000 - 86400, level: 'ERROR', message: '🔴 CRITICO: Sin comunicacion Modbus' },
]

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
  red:    { bar: 'bg-red-500',    bg: 'bg-red-500/8',    border: 'border-red-500/30',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-400' },
  yellow: { bar: 'bg-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' },
  blue:   { bar: 'bg-[#088fc3]',  bg: 'bg-[#004d89]/10', border: 'border-[#088fc3]/30',  text: 'text-[#088fc3]',  badge: 'bg-[#088fc3]/20 text-[#088fc3]' },
}

export default function Alarms({ data }) {
  const alarms = mockAlarms

  const counts = {
    red: alarms.filter(a => alarmLevel(a.message) === 'red').length,
    yellow: alarms.filter(a => alarmLevel(a.message) === 'yellow').length,
  }

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      {/* Summary */}
      <div className="flex gap-3 shrink-0">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-6 py-3 flex items-center gap-3">
          <span className="text-red-400 text-3xl font-black font-mono">{counts.red}</span>
          <div>
            <p className="text-red-400 text-xs font-bold uppercase tracking-wider">Críticas</p>
            <p className="text-white/30 text-xs">Acción inmediata</p>
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-6 py-3 flex items-center gap-3">
          <span className="text-yellow-400 text-3xl font-black font-mono">{counts.yellow}</span>
          <div>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Avisos</p>
            <p className="text-white/30 text-xs">Revisar pronto</p>
          </div>
        </div>
        <div className="ml-auto flex items-center text-white/20 text-xs">
          Últimas 50 alarmas · Orden cronológico inverso
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {alarms.map(alarm => {
          const level = alarmLevel(alarm.message)
          const st = LEVEL_STYLES[level]
          const cleanMsg = alarm.message.replace(/🔴|🟡|🟢/g, '').trim()
          return (
            <div key={alarm.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border ${st.bg} ${st.border}`}>
              <div className={`w-1 self-stretch rounded-full shrink-0 ${st.bar}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${st.text}`}>{cleanMsg}</p>
                <div className="flex items-center gap-3 mt-1">
                  {alarm.unit_id > 0 && (
                    <span className="text-white/30 text-xs">Cooler #{alarm.unit_id}</span>
                  )}
                  <span className="text-white/20 text-xs">{timeAgo(alarm.timestamp)}</span>
                  <span className="text-white/20 text-xs">
                    {new Date(alarm.timestamp * 1000).toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-bold shrink-0 ${st.badge}`}>
                {level === 'red' ? 'CRÍTICO' : 'AVISO'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
