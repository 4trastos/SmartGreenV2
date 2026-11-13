import { useState, useEffect } from 'react'
import { API_URL } from '../config.js'

// Idiomas de la instalación, en el orden en que se guardan (índice 0 = es)
const LANGS = ['es', 'en', 'pt', 'ca', 'fr', 'it']
const LOCALES = { es: 'es-ES', en: 'en-GB', pt: 'pt-PT', ca: 'ca-ES', fr: 'fr-FR', it: 'it-IT' }

const T = {
  es: {
    title: 'Información del sistema', info: 'Información', params: 'parámetros',
    readonly: 'Solo lectura · Modificar desde IMD o servidor',
    tiles: { sistema: 'Sistema', salinidad: 'Drenaje', prewet: 'Pre-mojado', garantia: 'Garantía', maint: 'Mantenimiento', modbus: 'Modbus' },
    keys: {
      num_coolers: 'Nº Coolers', num_sensors: 'Nº Sensores', num_zones: 'Nº Zonas',
      refresh_interval: 'Intervalo lectura (s)', history_interval: 'Intervalo histórico (s)', modbus_retries: 'Reintentos Modbus',
      salinity_trigger: 'Umbral salinidad (μS)',
      prewet_selector: 'Pre-mojado activo', prewet_delay_pump: 'Delay bomba (s)', prewet_delay_solenoid: 'Delay solenoide (s)',
      prewet_delay_water: 'Delay agua (s)', prewet_max_wait: 'Espera máx (s)', prewet_check_interval: 'Check intervalo (s)',
      warranty_months: 'Meses garantía', install_date: 'Fecha instalación',
      maint_plan: 'Plan (0=cierre, 1=apertura+cierre)', maint_legionella: 'Legionela (0=no, 1=sí)',
      maint_closing_date: 'Fecha cierre', maint_opening_date: 'Fecha apertura', maint_legionella_date: 'Fecha legionela',
      water_manager: 'Gestor agua', water_seal_opening_speed: 'Vel. apertura sello',
      auto_restart: 'Auto reinicio', temperature_unit: 'Unidad temp (0=C, 1=F)', tank_drain_delay: 'Delay drenaje tanque',
      drain_type: 'Renovación (1=tiempo, 0=salinidad)', drain_periodic: 'Renovar cada (min)',
      drain_periodic_time: 'Duración renovación (s)', drain_max_time: 'Máx. drenaje salinidad (s)',
      drain_safety_hours: 'Drenaje seguridad (h apagado)', salinity_drain_delay: 'Vaciado seguridad (s)',
    },
  },
  en: {
    title: 'System information', info: 'Information', params: 'parameters',
    readonly: 'Read only · Change from IMD or server',
    tiles: { sistema: 'System', salinidad: 'Drain', prewet: 'Pre-wetting', garantia: 'Warranty', maint: 'Maintenance', modbus: 'Modbus' },
    keys: {
      num_coolers: 'No. of coolers', num_sensors: 'No. of sensors', num_zones: 'No. of zones',
      refresh_interval: 'Reading interval (s)', history_interval: 'History interval (s)', modbus_retries: 'Modbus retries',
      salinity_trigger: 'Salinity threshold (μS)',
      prewet_selector: 'Pre-wetting enabled', prewet_delay_pump: 'Pump delay (s)', prewet_delay_solenoid: 'Solenoid delay (s)',
      prewet_delay_water: 'Water delay (s)', prewet_max_wait: 'Max wait (s)', prewet_check_interval: 'Check interval (s)',
      warranty_months: 'Warranty (months)', install_date: 'Installation date',
      maint_plan: 'Plan (0=closing, 1=opening+closing)', maint_legionella: 'Legionella (0=no, 1=yes)',
      maint_closing_date: 'Closing date', maint_opening_date: 'Opening date', maint_legionella_date: 'Legionella date',
      water_manager: 'Water manager', water_seal_opening_speed: 'Seal opening speed',
      auto_restart: 'Auto restart', temperature_unit: 'Temp. unit (0=C, 1=F)', tank_drain_delay: 'Tank drain delay',
      drain_type: 'Renewal (1=time, 0=salinity)', drain_periodic: 'Renew every (min)',
      drain_periodic_time: 'Renewal duration (s)', drain_max_time: 'Max. salinity drain (s)',
      drain_safety_hours: 'Safety drain (h off)', salinity_drain_delay: 'Safety emptying (s)',
    },
  },
  pt: {
    title: 'Informação do sistema', info: 'Informação', params: 'parâmetros',
    readonly: 'Só leitura · Alterar a partir do IMD ou do servidor',
    tiles: { sistema: 'Sistema', salinidad: 'Drenagem', prewet: 'Pré-molhagem', garantia: 'Garantia', maint: 'Manutenção', modbus: 'Modbus' },
    keys: {
      num_coolers: 'N.º de coolers', num_sensors: 'N.º de sensores', num_zones: 'N.º de zonas',
      refresh_interval: 'Intervalo de leitura (s)', history_interval: 'Intervalo do histórico (s)', modbus_retries: 'Tentativas Modbus',
      salinity_trigger: 'Limite de salinidade (μS)',
      prewet_selector: 'Pré-molhagem ativa', prewet_delay_pump: 'Atraso da bomba (s)', prewet_delay_solenoid: 'Atraso do solenoide (s)',
      prewet_delay_water: 'Atraso da água (s)', prewet_max_wait: 'Espera máx. (s)', prewet_check_interval: 'Intervalo de verificação (s)',
      warranty_months: 'Meses de garantia', install_date: 'Data de instalação',
      maint_plan: 'Plano (0=fecho, 1=abertura+fecho)', maint_legionella: 'Legionela (0=não, 1=sim)',
      maint_closing_date: 'Data de fecho', maint_opening_date: 'Data de abertura', maint_legionella_date: 'Data da legionela',
      water_manager: 'Gestor de água', water_seal_opening_speed: 'Vel. abertura do selo',
      auto_restart: 'Reinício automático', temperature_unit: 'Unidade temp. (0=C, 1=F)', tank_drain_delay: 'Atraso drenagem do depósito',
      drain_type: 'Renovação (1=tempo, 0=salinidade)', drain_periodic: 'Renovar a cada (min)',
      drain_periodic_time: 'Duração da renovação (s)', drain_max_time: 'Máx. drenagem salinidade (s)',
      drain_safety_hours: 'Drenagem de segurança (h desligado)', salinity_drain_delay: 'Esvaziamento de segurança (s)',
    },
  },
  ca: {
    title: 'Informació del sistema', info: 'Informació', params: 'paràmetres',
    readonly: 'Només lectura · Modificar des de l\'IMD o el servidor',
    tiles: { sistema: 'Sistema', salinidad: 'Drenatge', prewet: 'Pre-mullat', garantia: 'Garantia', maint: 'Manteniment', modbus: 'Modbus' },
    keys: {
      num_coolers: 'Nre. de coolers', num_sensors: 'Nre. de sensors', num_zones: 'Nre. de zones',
      refresh_interval: 'Interval de lectura (s)', history_interval: 'Interval d\'historial (s)', modbus_retries: 'Reintents Modbus',
      salinity_trigger: 'Llindar de salinitat (μS)',
      prewet_selector: 'Pre-mullat actiu', prewet_delay_pump: 'Retard bomba (s)', prewet_delay_solenoid: 'Retard solenoide (s)',
      prewet_delay_water: 'Retard aigua (s)', prewet_max_wait: 'Espera màx. (s)', prewet_check_interval: 'Interval de comprovació (s)',
      warranty_months: 'Mesos de garantia', install_date: 'Data d\'instal·lació',
      maint_plan: 'Pla (0=tancament, 1=obertura+tancament)', maint_legionella: 'Legionel·la (0=no, 1=sí)',
      maint_closing_date: 'Data de tancament', maint_opening_date: 'Data d\'obertura', maint_legionella_date: 'Data de legionel·la',
      water_manager: 'Gestor d\'aigua', water_seal_opening_speed: 'Vel. obertura del segell',
      auto_restart: 'Reinici automàtic', temperature_unit: 'Unitat temp. (0=C, 1=F)', tank_drain_delay: 'Retard drenatge del dipòsit',
      drain_type: 'Renovació (1=temps, 0=salinitat)', drain_periodic: 'Renovar cada (min)',
      drain_periodic_time: 'Durada de la renovació (s)', drain_max_time: 'Màx. drenatge salinitat (s)',
      drain_safety_hours: 'Drenatge de seguretat (h apagat)', salinity_drain_delay: 'Buidatge de seguretat (s)',
    },
  },
  fr: {
    title: 'Informations système', info: 'Informations', params: 'paramètres',
    readonly: 'Lecture seule · Modifier depuis l\'IMD ou le serveur',
    tiles: { sistema: 'Système', salinidad: 'Vidange', prewet: 'Pré-mouillage', garantia: 'Garantie', maint: 'Maintenance', modbus: 'Modbus' },
    keys: {
      num_coolers: 'Nb de coolers', num_sensors: 'Nb de capteurs', num_zones: 'Nb de zones',
      refresh_interval: 'Intervalle de lecture (s)', history_interval: 'Intervalle d\'historique (s)', modbus_retries: 'Tentatives Modbus',
      salinity_trigger: 'Seuil de salinité (μS)',
      prewet_selector: 'Pré-mouillage actif', prewet_delay_pump: 'Délai pompe (s)', prewet_delay_solenoid: 'Délai électrovanne (s)',
      prewet_delay_water: 'Délai eau (s)', prewet_max_wait: 'Attente max (s)', prewet_check_interval: 'Intervalle de contrôle (s)',
      warranty_months: 'Mois de garantie', install_date: 'Date d\'installation',
      maint_plan: 'Plan (0=fermeture, 1=ouverture+fermeture)', maint_legionella: 'Légionelle (0=non, 1=oui)',
      maint_closing_date: 'Date de fermeture', maint_opening_date: 'Date d\'ouverture', maint_legionella_date: 'Date légionelle',
      water_manager: 'Gestion de l\'eau', water_seal_opening_speed: 'Vit. ouverture du joint',
      auto_restart: 'Redémarrage auto', temperature_unit: 'Unité temp. (0=C, 1=F)', tank_drain_delay: 'Délai vidange du bac',
      drain_type: 'Renouvellement (1=durée, 0=salinité)', drain_periodic: 'Renouveler toutes les (min)',
      drain_periodic_time: 'Durée du renouvellement (s)', drain_max_time: 'Vidange salinité max. (s)',
      drain_safety_hours: 'Vidange de sécurité (h à l\'arrêt)', salinity_drain_delay: 'Vidage de sécurité (s)',
    },
  },
  it: {
    title: 'Informazioni di sistema', info: 'Informazioni', params: 'parametri',
    readonly: 'Sola lettura · Modificare da IMD o dal server',
    tiles: { sistema: 'Sistema', salinidad: 'Scarico', prewet: 'Pre-bagnatura', garantia: 'Garanzia', maint: 'Manutenzione', modbus: 'Modbus' },
    keys: {
      num_coolers: 'N. di coolers', num_sensors: 'N. di sensori', num_zones: 'N. di zone',
      refresh_interval: 'Intervallo di lettura (s)', history_interval: 'Intervallo storico (s)', modbus_retries: 'Tentativi Modbus',
      salinity_trigger: 'Soglia di salinità (μS)',
      prewet_selector: 'Pre-bagnatura attiva', prewet_delay_pump: 'Ritardo pompa (s)', prewet_delay_solenoid: 'Ritardo solenoide (s)',
      prewet_delay_water: 'Ritardo acqua (s)', prewet_max_wait: 'Attesa max (s)', prewet_check_interval: 'Intervallo di controllo (s)',
      warranty_months: 'Mesi di garanzia', install_date: 'Data di installazione',
      maint_plan: 'Piano (0=chiusura, 1=apertura+chiusura)', maint_legionella: 'Legionella (0=no, 1=sì)',
      maint_closing_date: 'Data di chiusura', maint_opening_date: 'Data di apertura', maint_legionella_date: 'Data legionella',
      water_manager: 'Gestore acqua', water_seal_opening_speed: 'Vel. apertura guarnizione',
      auto_restart: 'Riavvio automatico', temperature_unit: 'Unità temp. (0=C, 1=F)', tank_drain_delay: 'Ritardo scarico serbatoio',
      drain_type: 'Rinnovo (1=tempo, 0=salinità)', drain_periodic: 'Rinnovare ogni (min)',
      drain_periodic_time: 'Durata del rinnovo (s)', drain_max_time: 'Max. scarico salinità (s)',
      drain_safety_hours: 'Scarico di sicurezza (h spento)', salinity_drain_delay: 'Svuotamento di sicurezza (s)',
    },
  },
}

// Idioma de la instalación: lo guarda el setup en config ("language"), como índice (0 = es) o como código
function getLang(config) {
  const v = config.find(c => c.key === 'language')?.value
  if (v === undefined || v === null || v === '') return 'es'
  const s = String(v).toLowerCase()
  if (LANGS.includes(s)) return s
  const n = Number(s)
  return Number.isInteger(n) && LANGS[n] ? LANGS[n] : 'es'
}

const TILES = [
  { id: 'sistema',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,       color: 'from-[#004d89]/40 to-[#088fc3]/10', border: 'border-[#088fc3]/30', keys: ['num_coolers','num_sensors','num_zones','refresh_interval','history_interval','modbus_retries'] },
  { id: 'salinidad', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>, color: 'from-blue-900/30 to-transparent', border: 'border-blue-500/25', keys: ['drain_type','drain_periodic','drain_periodic_time','salinity_trigger','drain_max_time','salinity_drain_delay','drain_safety_hours'] },
  { id: 'prewet',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,                                       color: 'from-cyan-900/25 to-transparent',   border: 'border-cyan-500/20',    keys: ['prewet_selector','prewet_delay_pump','prewet_delay_solenoid','prewet_delay_water','prewet_max_wait','prewet_check_interval'] },
  { id: 'garantia',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,                              color: 'from-green-900/25 to-transparent',  border: 'border-green-500/20',   keys: ['warranty_months','install_date'] },
  { id: 'maint',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>, color: 'from-orange-900/25 to-transparent', border: 'border-orange-500/20',  keys: ['maint_plan','maint_legionella','maint_closing_date','maint_opening_date','maint_legionella_date'] },
  { id: 'modbus',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,                                                  color: 'from-purple-900/25 to-transparent', border: 'border-purple-500/20',  keys: ['water_manager','water_seal_opening_speed','auto_restart','temperature_unit','tank_drain_delay'] },
]

const formatVal = (key, val, lang) => {
  if (key === 'install_date' && val && val !== '—')
    return new Date(parseInt(val) * 1000).toLocaleDateString(LOCALES[lang] || 'es-ES')
  return val
}

function SettingsModal({ tile, config, lang, onClose }) {
  const tr = T[lang] || T.es
  const getVal = (key) => config.find(c => c.key === key)?.value ?? '—'
  const label = (key) => tr.keys[key] ?? T.es.keys[key] ?? key

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-lg" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`w-[460px] max-h-[80vh] rounded-3xl border p-6 bg-[#060c12] shadow-2xl flex flex-col bg-gradient-to-br ${tile.color} ${tile.border}`}>
        <div className="flex justify-between items-start mb-5 shrink-0">
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">{tr.info}</p>
            <p className="text-white text-2xl font-black">{tr.tiles[tile.id]}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white cursor-pointer">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tile.keys.map(key => (
            <div key={key} className="flex items-center justify-between bg-white/4 rounded-xl px-4 py-3 gap-3">
              <span className="text-white/40 text-xs flex-1">{label(key)}</span>
              <span className="font-mono font-bold text-sm text-white shrink-0">
                {formatVal(key, getVal(key), lang)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-white/20 text-xs text-center mt-4 shrink-0">{tr.readonly}</p>
      </div>
    </div>
  )
}

export default function Settings() {
  const [config, setConfig] = useState([])
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/config`).then(r => r.json()).then(setConfig).catch(() => {})
  }, [])

  const lang = getLang(config)
  const tr = T[lang] || T.es
  const openTile = TILES.find(t => t.id === open)

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <p className="text-white/20 text-xs font-bold tracking-widest uppercase shrink-0">{tr.title}</p>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {TILES.map(tile => (
          <button key={tile.id} onClick={() => setOpen(tile.id)}
            className={`rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200 hover:brightness-110 bg-gradient-to-br ${tile.color} ${tile.border} flex flex-col justify-between`}>
            <div className="text-white/60 mb-3">{tile.icon}</div>
            <div>
              <p className="text-white font-bold text-sm">{tr.tiles[tile.id]}</p>
              <p className="text-white/25 text-xs mt-0.5">{tile.keys.length} {tr.params}</p>
            </div>
          </button>
        ))}
      </div>

      {open && openTile && (
        <SettingsModal
          tile={openTile}
          config={config}
          lang={lang}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}
