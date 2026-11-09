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
import PinModal from './components/PinModal'
import { countAlarms } from './alarmLogic.js'
import { useLang, translate, reloadLang, LOCALES } from './i18n.js'

const T = {
  es: {
    nav_control: 'Control', nav_dashboard: 'Vista General', nav_alarms: 'Alarmas', nav_scheduler: 'Programador',
    nav_quiet: 'Modo Silencio', nav_maint: 'Mantenimiento', nav_settings: 'Configuración',
    reboot_title: '¿Reiniciar el sistema?', reboot_body: 'Connect se reiniciará y la pantalla quedará apagada unos segundos.',
    rebooting: 'Reiniciando...', cancel: 'Cancelar', reboot: 'Reiniciar',
    imd_mode: 'Modo IMD',
    no_comms_big: 'SIN COMUNICACIÓN', broken_big: 'AVERÍA GRAVE',
    bus_msg: 'Ningún equipo responde. Revise el cable del bus y su conexión al controlador',
    comms_msg: 'Revise la alimentación del equipo. Si persiste, llame al servicio técnico', call_tech: 'Llame al servicio técnico',
    ev_noresp_one: 'Evaporativo {ids} sin respuesta', ev_noresp_many: 'Evaporativos {ids} sin respuesta',
    ev_stopped_one: 'Evaporativo {ids} parado', ev_stopped_many: 'Evaporativos {ids} parados', tech_access: 'Acceso técnico',
    evap: 'Evaporativo', banner_broken: 'avería grave, parado — llame al servicio técnico',
    banner_comms: 'sin comunicación — revise la alimentación del equipo', review: 'Revisar',
    banner_rest: 'El resto de equipos sigue funcionando con normalidad.',
    starting: 'Iniciando...', quiet_badge: 'Modo silencio', alarm_one: 'alarma', alarm_many: 'alarmas',
    online: 'En línea', offline: 'Sin conexión',
  },
  en: {
    nav_control: 'Control', nav_dashboard: 'Overview', nav_alarms: 'Alarms', nav_scheduler: 'Scheduler',
    nav_quiet: 'Quiet mode', nav_maint: 'Maintenance', nav_settings: 'Settings',
    reboot_title: 'Restart the system?', reboot_body: 'Connect will restart and the screen will go dark for a few seconds.',
    rebooting: 'Restarting...', cancel: 'Cancel', reboot: 'Restart',
    imd_mode: 'IMD mode',
    no_comms_big: 'NO COMMUNICATION', broken_big: 'SEVERE FAULT',
    bus_msg: 'No device is responding. Check the bus cable and its connection to the controller',
    comms_msg: 'Check the unit\'s power supply. If it persists, call technical service', call_tech: 'Call technical service',
    ev_noresp_one: 'Cooler {ids} not responding', ev_noresp_many: 'Coolers {ids} not responding',
    ev_stopped_one: 'Cooler {ids} stopped', ev_stopped_many: 'Coolers {ids} stopped', tech_access: 'Technician access',
    evap: 'Cooler', banner_broken: 'severe fault, stopped — call technical service',
    banner_comms: 'no communication — check the unit\'s power supply', review: 'Check',
    banner_rest: 'The other units keep working normally.',
    starting: 'Starting...', quiet_badge: 'Quiet mode', alarm_one: 'alarm', alarm_many: 'alarms',
    online: 'Online', offline: 'Offline',
  },
  pt: {
    nav_control: 'Controlo', nav_dashboard: 'Visão geral', nav_alarms: 'Alarmes', nav_scheduler: 'Programador',
    nav_quiet: 'Modo silêncio', nav_maint: 'Manutenção', nav_settings: 'Definições',
    reboot_title: 'Reiniciar o sistema?', reboot_body: 'O Connect vai reiniciar e o ecrã ficará apagado durante alguns segundos.',
    rebooting: 'A reiniciar...', cancel: 'Cancelar', reboot: 'Reiniciar',
    imd_mode: 'Modo IMD',
    no_comms_big: 'SEM COMUNICAÇÃO', broken_big: 'AVARIA GRAVE',
    bus_msg: 'Nenhum equipamento responde. Verifique o cabo do barramento e a sua ligação ao controlador',
    comms_msg: 'Verifique a alimentação do equipamento. Se persistir, contacte o serviço técnico', call_tech: 'Contacte o serviço técnico',
    ev_noresp_one: 'Evaporativo {ids} sem resposta', ev_noresp_many: 'Evaporativos {ids} sem resposta',
    ev_stopped_one: 'Evaporativo {ids} parado', ev_stopped_many: 'Evaporativos {ids} parados', tech_access: 'Acesso técnico',
    evap: 'Evaporativo', banner_broken: 'avaria grave, parado — contacte o serviço técnico',
    banner_comms: 'sem comunicação — verifique a alimentação do equipamento', review: 'Verificar',
    banner_rest: 'Os restantes equipamentos continuam a funcionar normalmente.',
    starting: 'A iniciar...', quiet_badge: 'Modo silêncio', alarm_one: 'alarme', alarm_many: 'alarmes',
    online: 'Em linha', offline: 'Sem ligação',
  },
  ca: {
    nav_control: 'Control', nav_dashboard: 'Vista general', nav_alarms: 'Alarmes', nav_scheduler: 'Programador',
    nav_quiet: 'Mode silenci', nav_maint: 'Manteniment', nav_settings: 'Configuració',
    reboot_title: 'Reiniciar el sistema?', reboot_body: 'Connect es reiniciarà i la pantalla quedarà apagada uns segons.',
    rebooting: 'Reiniciant...', cancel: 'Cancel·lar', reboot: 'Reiniciar',
    imd_mode: 'Mode IMD',
    no_comms_big: 'SENSE COMUNICACIÓ', broken_big: 'AVARIA GREU',
    bus_msg: 'Cap equip respon. Reviseu el cable del bus i la seva connexió al controlador',
    comms_msg: 'Reviseu l\'alimentació de l\'equip. Si persisteix, truqueu al servei tècnic', call_tech: 'Truqueu al servei tècnic',
    ev_noresp_one: 'Evaporatiu {ids} sense resposta', ev_noresp_many: 'Evaporatius {ids} sense resposta',
    ev_stopped_one: 'Evaporatiu {ids} aturat', ev_stopped_many: 'Evaporatius {ids} aturats', tech_access: 'Accés tècnic',
    evap: 'Evaporatiu', banner_broken: 'avaria greu, aturat — truqueu al servei tècnic',
    banner_comms: 'sense comunicació — reviseu l\'alimentació de l\'equip', review: 'Revisar',
    banner_rest: 'La resta d\'equips continua funcionant amb normalitat.',
    starting: 'Iniciant...', quiet_badge: 'Mode silenci', alarm_one: 'alarma', alarm_many: 'alarmes',
    online: 'En línia', offline: 'Sense connexió',
  },
  fr: {
    nav_control: 'Contrôle', nav_dashboard: 'Vue d\'ensemble', nav_alarms: 'Alarmes', nav_scheduler: 'Programmateur',
    nav_quiet: 'Mode silencieux', nav_maint: 'Maintenance', nav_settings: 'Paramètres',
    reboot_title: 'Redémarrer le système ?', reboot_body: 'Connect va redémarrer et l\'écran restera éteint quelques secondes.',
    rebooting: 'Redémarrage...', cancel: 'Annuler', reboot: 'Redémarrer',
    imd_mode: 'Mode IMD',
    no_comms_big: 'SANS COMMUNICATION', broken_big: 'PANNE GRAVE',
    bus_msg: 'Aucun équipement ne répond. Vérifiez le câble du bus et sa connexion au contrôleur',
    comms_msg: 'Vérifiez l\'alimentation de l\'équipement. Si le problème persiste, appelez le service technique', call_tech: 'Appelez le service technique',
    ev_noresp_one: 'Évaporatif {ids} sans réponse', ev_noresp_many: 'Évaporatifs {ids} sans réponse',
    ev_stopped_one: 'Évaporatif {ids} à l\'arrêt', ev_stopped_many: 'Évaporatifs {ids} à l\'arrêt', tech_access: 'Accès technicien',
    evap: 'Évaporatif', banner_broken: 'panne grave, à l\'arrêt — appelez le service technique',
    banner_comms: 'sans communication — vérifiez l\'alimentation de l\'équipement', review: 'Vérifier',
    banner_rest: 'Les autres équipements continuent de fonctionner normalement.',
    starting: 'Démarrage...', quiet_badge: 'Mode silencieux', alarm_one: 'alarme', alarm_many: 'alarmes',
    online: 'En ligne', offline: 'Déconnecté',
  },
  it: {
    nav_control: 'Controllo', nav_dashboard: 'Panoramica', nav_alarms: 'Allarmi', nav_scheduler: 'Programmatore',
    nav_quiet: 'Modalità silenziosa', nav_maint: 'Manutenzione', nav_settings: 'Impostazioni',
    reboot_title: 'Riavviare il sistema?', reboot_body: 'Connect si riavvierà e lo schermo rimarrà spento per alcuni secondi.',
    rebooting: 'Riavvio in corso...', cancel: 'Annulla', reboot: 'Riavvia',
    imd_mode: 'Modalità IMD',
    no_comms_big: 'SENZA COMUNICAZIONE', broken_big: 'GUASTO GRAVE',
    bus_msg: 'Nessuna apparecchiatura risponde. Controllare il cavo del bus e il suo collegamento al controller',
    comms_msg: 'Controllare l\'alimentazione dell\'apparecchiatura. Se persiste, chiamare l\'assistenza tecnica', call_tech: 'Chiamare l\'assistenza tecnica',
    ev_noresp_one: 'Evaporativo {ids} senza risposta', ev_noresp_many: 'Evaporativi {ids} senza risposta',
    ev_stopped_one: 'Evaporativo {ids} fermo', ev_stopped_many: 'Evaporativi {ids} fermi', tech_access: 'Accesso tecnico',
    evap: 'Evaporativo', banner_broken: 'guasto grave, fermo — chiamare l\'assistenza tecnica',
    banner_comms: 'senza comunicazione — controllare l\'alimentazione dell\'apparecchiatura', review: 'Controlla',
    banner_rest: 'Le altre apparecchiature continuano a funzionare normalmente.',
    starting: 'Avvio in corso...', quiet_badge: 'Modalità silenziosa', alarm_one: 'allarme', alarm_many: 'allarmi',
    online: 'Online', offline: 'Non connesso',
  },
}

// Texto de esta pantalla en el idioma activo (si falta, en español)
function useT() {
  const lang = useLang()
  return key => translate(T, lang, key)
}

// El nombre de cada página (nav_<id>) está en el diccionario de arriba
const NAV = [
  { id: 'control',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg> },
  { id: 'dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { id: 'alarms',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  { id: 'scheduler',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id: 'quiet',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
  { id: 'maint',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  { id: 'settings',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

function RebootModal({ onClose }) {
  const t = useT()
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
          <p className="text-white text-xl font-black mb-2">{t('reboot_title')}</p>
          <p className="text-white/40 text-sm">{t('reboot_body')}</p>
        </div>
        {rebooting ? (
          <div className="text-center py-4">
            <p className="text-red-400 font-bold">{t('rebooting')}</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold cursor-pointer hover:bg-white/10">{t('cancel')}</button>
            <button onClick={doReboot} className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold cursor-pointer hover:bg-red-500/30">{t('reboot')}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Clock() {
  const lang = useLang()
  const locale = LOCALES[lang] || 'es-ES'
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right">
      <p className="text-white font-mono text-sm font-bold leading-none">{time.toLocaleTimeString(locale)}</p>
      <p className="text-white/30 text-xs mt-0.5">{time.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
    </div>
  )
}

// Pantalla roja: TODOS los evaporativos están averiados o sin comunicación
function BrokenScreen({ coolers, comms, bus, onTech }) {
  const t = useT()
  const plural = coolers.length > 1
  const ids = coolers.map(c => `#${c.unit_id}`).join(', ')
  const detailKey = comms ? (plural ? 'ev_noresp_many' : 'ev_noresp_one') : (plural ? 'ev_stopped_many' : 'ev_stopped_one')

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-900">
      <p className="text-8xl mb-6">⚠</p>
      <p className="text-white text-4xl font-black mb-3 text-center px-8">
        {comms ? t('no_comms_big') : t('broken_big')}
      </p>
      <p className="text-white/80 text-xl text-center mb-2 px-8">
        {bus
          ? t('bus_msg')
          : comms
            ? t('comms_msg')
            : t('call_tech')}
      </p>
      <p className="text-white/50 text-sm text-center mb-10 px-8">
        {t(detailKey).replace('{ids}', ids)}
      </p>
      <button onClick={onTech}
        className="px-6 py-3 rounded-xl bg-white/10 border border-white/30 text-white/70 text-sm font-bold cursor-pointer hover:bg-white/20">
        {t('tech_access')}
      </button>
    </div>
  )
}

// Franja de aviso: ALGUNOS evaporativos fuera de servicio; el resto sigue funcionando
function FaultBanner({ coolers, onTech }) {
  const t = useT()
  return (
    <div className="shrink-0 mx-4 mt-3 rounded-xl border border-red-500/40 bg-red-500/15 px-4 py-2.5 flex flex-col gap-1.5">
      {coolers.map(c => (
        <div key={c.unit_id} className="flex items-center justify-between gap-3">
          <p className="text-sm min-w-0">
            <span className="text-red-400 font-black">⚠ {t('evap')} #{c.unit_id}:</span>{' '}
            <span className="text-white/80">
              {Number(c.broken_cooler) === 1
                ? t('banner_broken')
                : t('banner_comms')}
            </span>
          </p>
          <button onClick={() => onTech(c.unit_id)}
            className="shrink-0 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white/70 text-xs font-bold cursor-pointer hover:bg-white/20">
            {t('review')}
          </button>
        </div>
      ))}
      <p className="text-white/40 text-xs">{t('banner_rest')}</p>
    </div>
  )
}

export default function App() {
  const t = useT()
  const [page, setPage] = useState('control')
  const [showReboot, setShowReboot] = useState(false)
  const [imdActive, setImdActive] = useState(false)
  const [imdUnitId, setImdUnitId] = useState(null)              // evaporativo en el IMD
  const [pendingImdUnit, setPendingImdUnit] = useState(null)    // evaporativo pendiente del PIN
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

  const alarmCount = countAlarms(data)     // críticos + avisos; lo informativo no cuenta

  // Evaporativos fuera de servicio: avería grave o sin comunicación
  const outCoolers = data.coolers.filter(c => Number(c.broken_cooler) === 1 || Number(c.comms_lost) === 1)
  const allOut     = data.coolers.length > 0 && outCoolers.length === data.coolers.length   // todos → pantalla roja
  const anyBroken  = outCoolers.some(c => Number(c.broken_cooler) === 1)

  // IMD de UN evaporativo: se aparta de su zona; el resto sigue funcionando
  const openImd = (unitId) => {
    fetch(`${API_URL}/coolers/${unitId}/imd`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'ENTER' })
    }).catch(() => {})
    setImdUnitId(unitId)
    setImdActive(true)
  }

  // Salir: solo ese evaporativo vuelve al control de su zona (no se apaga nada)
  const exitImd = () => {
    if (imdUnitId !== null)
      fetch(`${API_URL}/coolers/${imdUnitId}/imd`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'EXIT' })
      }).catch(() => {})
    setImdActive(false)
    setImdUnitId(null)
  }

  const isPrewet = !imdActive && data.zones.some(z => z.prewet_in_progress === 'yes')
  const pages = { dashboard: Dashboard, control: Control, alarms: Alarms, maint: Maintenance, settings: Settings, scheduler: Scheduler, quiet: Quiet }
  const PageComponent = pages[page]

  if (setupRequired === null)
    return <div className="flex h-screen w-screen bg-[#060c12] items-center justify-center text-white/40">{t('starting')}</div>

  // Al terminar el setup, el idioma elegido ya está guardado: se vuelve a leer para que lo usen todas las pantallas
  if (setupRequired)
    return <Setup onComplete={() => { reloadLang(); setSetupRequired(false) }} data={data} />

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
              {imdActive ? t('imd_mode') : t('nav_' + page)}
            </span>
            {quietMode > 0 && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-[#088fc3]/30 bg-[#088fc3]/10 text-[#088fc3] font-bold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                {t('quiet_badge')}
              </span>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <img src="/logo_australair_connect_Mini.png" alt="Australair" className="h-5 opacity-80" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {alarmCount > 0 && (
              <button onClick={() => !imdActive && setPage('alarms')}
                className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-colors">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {alarmCount} {alarmCount > 1 ? t('alarm_many') : t('alarm_one')}
              </button>
            )}
            <Clock />
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border
              ${connected ? 'text-[#088fc3] border-[#088fc3]/30 bg-[#088fc3]/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#088fc3]' : 'bg-red-400'}`} />
              {connected ? t('online') : t('offline')}
            </div>
          </div>
        </header>

        {/* AVISO — algunos evaporativos fuera de servicio (no bloquea: el resto sigue funcionando) */}
        {outCoolers.length > 0 && !allOut && !imdActive && (
          <FaultBanner coolers={outCoolers} onTech={unitId => setPendingImdUnit(unitId)} />
        )}

        <div className="flex-1 overflow-hidden">
          {imdActive ? (
            <IMD data={data} unitId={imdUnitId} onExit={exitImd} />
          ) : (
            <PageComponent
              data={data}
              connected={connected}
              onImdActivate={unitId => setPendingImdUnit(unitId)}
            />
          )}
        </div>
      </main>

      {showReboot && <RebootModal onClose={() => setShowReboot(false)} />}

      {/* PANTALLA ROJA — TODOS los evaporativos fuera de servicio (salvo en el IMD, donde el técnico trabaja) */}
      {allOut && !imdActive && (
        <BrokenScreen
          coolers={outCoolers}
          comms={!anyBroken}
          bus={Number(data.status?.bus_lost) === 1}
          onTech={() => setPendingImdUnit(outCoolers[0].unit_id)} />
      )}

      {/* PIN del técnico — para entrar en el IMD de un evaporativo, venga de donde venga */}
      {pendingImdUnit !== null && (
        <PinModal title={t('imd_mode')}
          onSuccess={() => { const u = pendingImdUnit; setPendingImdUnit(null); openImd(u) }}
          onCancel={() => setPendingImdUnit(null)} />
      )}
    </div>
  )
}
