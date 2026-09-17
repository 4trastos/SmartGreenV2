import { API_URL } from '../config.js'
import { useState, useEffect, useRef } from 'react'
import Keyboard from '../components/Keyboard'

// ─── TRADUCCIONES ────────────────────────────────────────────
const T = {
  es: {
    title: 'ASISTENTE DE INSTALACIÓN',
    lang_sub: 'Selección de idioma',
    zones_sub: '¿Cuántas zonas tiene la instalación?',
    coolers_sub: '¿Cuántos climatizadores evaporativos?',
    scan_sub: 'Exploración del sistema',
    scan_warning_title: '¡IMPORTANTE!',
    scan_warning_body: 'Asegúrese que los componentes estén conectados y encendidos.',
    scanning_sub: 'Exploración sistema. Espere.',
    result_sub: 'Se encontraron los siguientes en el sist:',
    sensor_sub: 'Asignar tipo de sensor',
    sensor_hint: 'Indique si cada sensor es interior o exterior',
    purge_sub: 'Ciclo de purga paneles',
    purge_sub_active: 'Ciclo de purga paneles. ESPERE',
    purge_body: 'Purgadno paneles el evaporativo es nuevo.',
    purge_hint: 'Esto puede tardar 10 minutos.',
    confirm_sub: 'Resumen de la instalación',
    lang_label: 'Idioma', zones_label: 'Zonas',
    coolers_label: 'Evaporativos', sensors_label: 'Sensores',
    fridge: 'EVAPORATIVO', sensor: 'SENSOR',
    scan_fridge: 'EVAPORATIVOS', scan_sensors: 'SENSORES',
    in_progress: 'EN CURSO', found: 'ENCONTRADO',
    purging_msg: 'Purgando paneles — espere...',
    back: 'VOLV', next: 'CONT', accept: 'ACEPTAR',
    retry: 'REINT', ok: 'ACEPTA', later: 'TARDE', stop: 'STOP',
    confirm_btn: '✓  CONFIRMAR INSTALACIÓN',
    zone_placeholder: 'Zona',
    no_devices: 'No se encontraron equipos',
  },
  en: {
    title: 'INSTALLATION WIZARD',
    lang_sub: 'Language selection',
    zones_sub: 'How many zones does the installation have?',
    coolers_sub: 'How many evaporative coolers?',
    scan_sub: 'System scan',
    scan_warning_title: 'IMPORTANT!',
    scan_warning_body: 'Make sure all components are connected and powered on.',
    scanning_sub: 'Scanning system. Please wait.',
    result_sub: 'The following were found in the system:',
    sensor_sub: 'Assign sensor type',
    sensor_hint: 'Indicate whether each sensor is indoor or outdoor',
    purge_sub: 'Panel purge cycle',
    purge_sub_active: 'Panel purge cycle. PLEASE WAIT',
    purge_body: 'Purge panels if cooler is new.',
    purge_hint: 'This may take up to 10 minutes.',
    confirm_sub: 'Installation summary',
    lang_label: 'Language', zones_label: 'Zones',
    coolers_label: 'Coolers', sensors_label: 'Sensors',
    fridge: 'COOLER', sensor: 'SENSOR',
    scan_fridge: 'COOLERS', scan_sensors: 'SENSORS',
    in_progress: 'IN PROGRESS', found: 'FOUND',
    purging_msg: 'Purging panels — please wait...',
    back: 'BACK', next: 'NEXT', accept: 'ACCEPT',
    retry: 'RETRY', ok: 'ACCEPT', later: 'LATER', stop: 'STOP',
    confirm_btn: '✓  CONFIRM INSTALLATION',
    zone_placeholder: 'Zone',
    no_devices: 'No devices found',
  },
  pt: {
    title: 'ASSISTENTE DE INSTALAÇÃO',
    lang_sub: 'Seleção de idioma',
    zones_sub: 'Quantas zonas tem a instalação?',
    coolers_sub: 'Quantos refrigeradores evaporativos?',
    scan_sub: 'Exploração do sistema',
    scan_warning_title: 'IMPORTANTE!',
    scan_warning_body: 'Certifique-se que os componentes estão ligados e conectados.',
    scanning_sub: 'Explorando sistema. Aguarde.',
    result_sub: 'Foram encontrados os seguintes no sistema:',
    sensor_sub: 'Atribuir tipo de sensor',
    sensor_hint: 'Indique se cada sensor é interior ou exterior',
    purge_sub: 'Ciclo de purga de painéis',
    purge_sub_active: 'Ciclo de purga. AGUARDE',
    purge_body: 'Purgue os painéis se o refrigerador for novo.',
    purge_hint: 'Isso pode demorar até 10 minutos.',
    confirm_sub: 'Resumo da instalação',
    lang_label: 'Idioma', zones_label: 'Zonas',
    coolers_label: 'Refrigeradores', sensors_label: 'Sensores',
    fridge: 'REFRIGERADOR', sensor: 'SENSOR',
    scan_fridge: 'REFRIGERADORES', scan_sensors: 'SENSORES',
    in_progress: 'EM CURSO', found: 'ENCONTRADO',
    purging_msg: 'Purgando painéis — aguarde...',
    back: 'VOLTAR', next: 'CONT', accept: 'ACEITAR',
    retry: 'TENTAR', ok: 'ACEITAR', later: 'TARDE', stop: 'PARAR',
    confirm_btn: '✓  CONFIRMAR INSTALAÇÃO',
    zone_placeholder: 'Zona',
    no_devices: 'Nenhum dispositivo encontrado',
  },
  ca: {
    title: 'ASSISTENT D\'INSTAL·LACIÓ',
    lang_sub: 'Selecció d\'idioma',
    zones_sub: 'Quantes zones té la instal·lació?',
    coolers_sub: 'Quants climatitzadors evaporatius?',
    scan_sub: 'Exploració del sistema',
    scan_warning_title: 'IMPORTANT!',
    scan_warning_body: 'Assegureu-vos que els components estiguin connectats i encesos.',
    scanning_sub: 'Explorant sistema. Espereu.',
    result_sub: 'S\'han trobat els següents al sistema:',
    sensor_sub: 'Assignar tipus de sensor',
    sensor_hint: 'Indiqueu si cada sensor és interior o exterior',
    purge_sub: 'Cicle de purga de panells',
    purge_sub_active: 'Cicle de purga. ESPEREU',
    purge_body: 'Purgeu els panells si el climatitzador és nou.',
    purge_hint: 'Això pot trigar fins a 10 minuts.',
    confirm_sub: 'Resum de la instal·lació',
    lang_label: 'Idioma', zones_label: 'Zones',
    coolers_label: 'Climatitzadors', sensors_label: 'Sensors',
    fridge: 'CLIMATITZADOR', sensor: 'SENSOR',
    scan_fridge: 'CLIMATITZADORS', scan_sensors: 'SENSORS',
    in_progress: 'EN CURS', found: 'TROBAT',
    purging_msg: 'Purgant panells — espereu...',
    back: 'TORNAR', next: 'CONT', accept: 'ACCEPTAR',
    retry: 'REINTENTAR', ok: 'ACCEPTAR', later: 'TARD', stop: 'PARAR',
    confirm_btn: '✓  CONFIRMAR INSTAL·LACIÓ',
    zone_placeholder: 'Zona',
    no_devices: 'No s\'han trobat dispositius',
  },
  fr: {
    title: 'ASSISTANT D\'INSTALLATION',
    lang_sub: 'Sélection de la langue',
    zones_sub: 'Combien de zones compte l\'installation ?',
    coolers_sub: 'Combien de rafraîchisseurs évaporatifs ?',
    scan_sub: 'Exploration du système',
    scan_warning_title: 'IMPORTANT !',
    scan_warning_body: 'Assurez-vous que les composants sont connectés et allumés.',
    scanning_sub: 'Exploration en cours. Veuillez patienter.',
    result_sub: 'Les éléments suivants ont été trouvés dans le système :',
    sensor_sub: 'Attribuer le type de capteur',
    sensor_hint: 'Indiquez si chaque capteur est intérieur ou extérieur',
    purge_sub: 'Cycle de purge des panneaux',
    purge_sub_active: 'Cycle de purge. VEUILLEZ PATIENTER',
    purge_body: 'Purgez les panneaux si le refroidisseur est neuf.',
    purge_hint: 'Cela peut prendre jusqu\'à 10 minutes.',
    confirm_sub: 'Résumé de l\'installation',
    lang_label: 'Langue', zones_label: 'Zones',
    coolers_label: 'Refroidisseurs', sensors_label: 'Capteurs',
    fridge: 'REFROIDISSEUR', sensor: 'CAPTEUR',
    scan_fridge: 'REFROIDISSEURS', scan_sensors: 'CAPTEURS',
    in_progress: 'EN COURS', found: 'TROUVÉ',
    purging_msg: 'Purge des panneaux — veuillez patienter...',
    back: 'RETOUR', next: 'CONT', accept: 'ACCEPTER',
    retry: 'RÉESSAYER', ok: 'ACCEPTER', later: 'PLUS TARD', stop: 'ARRÊT',
    confirm_btn: '✓  CONFIRMER L\'INSTALLATION',
    zone_placeholder: 'Zone',
    no_devices: 'Aucun appareil trouvé',
  },
  it: {
    title: 'ASSISTENTE DI INSTALLAZIONE',
    lang_sub: 'Selezione della lingua',
    zones_sub: 'Quante zone ha l\'installazione?',
    coolers_sub: 'Quanti raffrescatori evaporativi?',
    scan_sub: 'Esplorazione del sistema',
    scan_warning_title: 'IMPORTANTE!',
    scan_warning_body: 'Assicurarsi che i componenti siano collegati e accesi.',
    scanning_sub: 'Esplorazione sistema. Attendere.',
    result_sub: 'Nel sistema sono stati trovati i seguenti:',
    sensor_sub: 'Assegnare il tipo di sensore',
    sensor_hint: 'Indicare se ogni sensore è interno o esterno',
    purge_sub: 'Ciclo di spurgo dei pannelli',
    purge_sub_active: 'Ciclo di spurgo. ATTENDERE',
    purge_body: 'Spurgare i pannelli se il raffrescatore è nuovo.',
    purge_hint: 'Questo può richiedere fino a 10 minuti.',
    confirm_sub: 'Riepilogo dell\'installazione',
    lang_label: 'Lingua', zones_label: 'Zone',
    coolers_label: 'Raffrescatori', sensors_label: 'Sensori',
    fridge: 'RAFFRESCATORE', sensor: 'SENSORE',
    scan_fridge: 'RAFFRESCATORI', scan_sensors: 'SENSORI',
    in_progress: 'IN CORSO', found: 'TROVATO',
    purging_msg: 'Spurgo pannelli — attendere...',
    back: 'INDIETRO', next: 'CONT', accept: 'ACCETTA',
    retry: 'RIPROVA', ok: 'ACCETTA', later: 'DOPO', stop: 'STOP',
    confirm_btn: '✓  CONFERMA INSTALLAZIONE',
    zone_placeholder: 'Zona',
    no_devices: 'Nessun dispositivo trovato',
  },
}

// ─── COMPONENTES ─────────────────────────────────────────────
function Header({ title, subtitle }) {
  return (
    <div className="w-full bg-red-600 px-6 py-4 rounded-t-2xl">
      <p className="text-white font-black text-base uppercase tracking-wide">{title}</p>
      {subtitle && <p className="text-white/80 text-sm font-bold">{subtitle}</p>}
    </div>
  )
}

function Btn({ label, onClick, disabled, full }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${full ? 'w-full' : 'px-8'} py-2.5 rounded-full font-bold text-sm cursor-pointer
        bg-gray-200 border-2 border-gray-400 text-gray-700 hover:bg-gray-300
        disabled:opacity-40 disabled:cursor-not-allowed transition-all`}>
      {label}
    </button>
  )
}

function Row({ label, value }) {
  return (
    <>
      <div className="flex justify-between items-center py-2.5">
        <span className="text-gray-300 font-bold text-sm">{label}</span>
        <span className="text-white font-bold text-sm">{value}</span>
      </div>
      <div className="border-b border-white/10" />
    </>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function Setup({ onComplete, data }) {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState('es')
  const [numZones, setNumZones] = useState(1)
  const [zones, setZones] = useState([{ name: 'Zona 1' }])
  const [activeZoneKeyboard, setActiveZoneKeyboard] = useState(null)
  const [numCoolers, setNumCoolers] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [foundCoolers, setFoundCoolers] = useState([])
  const [foundSensors, setFoundSensors] = useState([])
  const [sensorRoles, setSensorRoles] = useState({})
  const [purging, setPurging] = useState(false)
  const prewetStartedRef = useRef(false)
  const [purgeProgress, setPurgeProgress] = useState(0)

  const t = T[lang] || T.es

  // Cambiar idioma y actualizar nombres de zona por defecto
  const changeLanguage = (code) => {
    const oldT = T[lang] || T.es
    const newT = T[code] || T.es
    setLang(code)
    setZones(prev => prev.map((z, i) => {
      if (z.name === `${oldT.zone_placeholder} ${i + 1}`)
        return { ...z, name: `${newT.zone_placeholder} ${i + 1}` }
      return z
    }))
  }

  // Detectar fin de purga via WebSocket
  useEffect(() => {
    if (!data?.zones) return
    const zone = data.zones?.[0]
    if (!zone) return
    if (prewetStartedRef.current && zone.prewet_in_progress === 'no') {
      prewetStartedRef.current = false
      setPurging(false)
      setStep(8)
    }
  }, [data?.zones])

  const post = async (endpoint, body = {}) => {
    const r = await fetch(`${API_URL}/setup/${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return r.json()
  }

  const scan = async () => {
    setScanning(true)
    setScanProgress(0)
    setFoundCoolers([])
    setFoundSensors([])
    setSensorRoles({})
    const interval = setInterval(() => setScanProgress(p => Math.min(p + 3, 95)), 600)
    const r = await fetch(`${API_URL}/setup/scan`, { method: 'POST' })
    const d = await r.json()
    clearInterval(interval)
    setScanProgress(100)
    setFoundCoolers(d.coolers || [])
    setFoundSensors(d.sensors || [])
    const roles = {}
    ;(d.sensors || []).forEach((s, i) => { roles[s.unit_id] = i === 0 ? 'INT' : 'EXT' })
    setSensorRoles(roles)
    setScanning(false)
    setTimeout(() => setStep(5), 600)
  }

  const purge = async () => {
    prewetStartedRef.current = true
    setPurging(true)
    setPurgeProgress(0)
    await post('language', { lang })
    await post('zones', { num_zones: numZones, zones })
    await post('coolers', { zone_id: 1, num_coolers: foundCoolers.length || numCoolers, coolers: foundCoolers })
    await post('sensors', { sensors: foundSensors.map(s => ({ unit_id: s.unit_id, role: sensorRoles[s.unit_id] || 'INT' })) })
    await fetch(`${API_URL}/setup/purge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(err => console.error('Error purga:', err))

    const TOTAL = 361
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed++
      setPurgeProgress(Math.min(99, Math.round((elapsed / TOTAL) * 100)))
    }, 1000)

    // Polling hasta que termine
    await new Promise(resolve => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/zones`)
          const zones = await res.json()
          const zone = zones.find(z => z.zone_id === 1)
          if (zone && zone.prewet_in_progress === 'no') {
            clearInterval(interval)
            resolve()
          }
        } catch {}
      }, 2000)
    })

    clearInterval(timer)
    setPurgeProgress(100)
    await new Promise(resolve => setTimeout(resolve, 500))
    setStep(8)
  }

  const confirm = async () => {
    await post('language', { lang })
    await post('zones', { num_zones: numZones, zones })
    await post('coolers', { zone_id: 1, num_coolers: foundCoolers.length || numCoolers, coolers: foundCoolers })
    await post('sensors', { sensors: foundSensors.map(s => ({ unit_id: s.unit_id, role: sensorRoles[s.unit_id] || 'INT' })) })
    await post('confirm', {})
    onComplete()
  }

  return (
    <div className="flex h-screen w-screen bg-[#060c12] items-center justify-center"
      style={{ fontFamily: "'Arial', sans-serif" }}>
      <div className="w-[520px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0D1F35]">

        {/* PASO 0 — Idioma */}
        {step === 0 && (<>
          <Header title={t.title} subtitle={t.lang_sub} />
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                {code:'es', label:'ESPAÑOL'},
                {code:'pt', label:'PORTUGUÊS'},
                {code:'en', label:'ENGLISH'},
                {code:'fr', label:'FRANÇAIS'},
                {code:'ca', label:'CATALÀ'},
                {code:'it', label:'ITALIANO'},
              ].map(l => (
                <div key={l.code} onClick={() => changeLanguage(l.code)}
                  className="flex items-center justify-between py-3 px-4 rounded-lg border-2 cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderColor: lang === l.code ? '#888' : '#333' }}>
                  <span className="font-bold text-white text-sm">{l.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 transition-all ${lang === l.code ? 'bg-gray-400 border-gray-300' : 'bg-transparent border-gray-600'}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Btn label={t.accept} onClick={() => setStep(1)} />
            </div>
          </div>
        </>)}

        {/* PASO 1 — Zonas */}
        {step === 1 && (<>
          <Header title={t.title} subtitle={t.zones_sub} />
          <div className="p-6">
            <div className="flex items-center justify-center gap-8 my-4">
              <button onClick={() => { if(numZones > 1) { setNumZones(n => n-1); setZones(z => z.slice(0,-1)); setActiveZoneKeyboard(null) }}}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">−</button>
              <span className="text-white text-5xl font-black w-16 text-center">{numZones}</span>
              <button onClick={() => { if(numZones < 8) { setNumZones(n => n+1); setZones(z => [...z, {name:`${t.zone_placeholder} ${numZones+1}`}]) }}}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">+</button>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              {zones.map((z, i) => (
                <div key={i}>
                  <input value={z.name}
                    readOnly
                    onFocus={() => setActiveZoneKeyboard(i)}
                    onClick={e => { e.stopPropagation(); setActiveZoneKeyboard(i) }}
                    onTouchStart={e => e.stopPropagation()}
                    placeholder={`${t.zone_placeholder} ${i + 1}`}
                    className="w-full bg-white/5 border-2 rounded-lg px-4 py-2 text-white font-bold text-center cursor-pointer"
                    style={{ borderColor: activeZoneKeyboard === i ? '#088fc3' : 'rgba(255,255,255,0.1)' }} />
                  {activeZoneKeyboard === i && (
                    <Keyboard
                      value={z.name}
                      onChange={val => setZones(prev => prev.map((z, j) => j === i ? {...z, name: val} : z))}
                      onClose={() => setActiveZoneKeyboard(null)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Btn label={t.back} onClick={() => setStep(0)} />
              <Btn label={t.next} onClick={() => setStep(2)} />
            </div>
          </div>
        </>)}

        {/* PASO 2 — Coolers */}
        {step === 2 && (<>
          <Header title={t.title} subtitle={t.coolers_sub} />
          <div className="p-6">
            <div className="flex items-center justify-center gap-8 my-6">
              <button onClick={() => { if(numCoolers > 1) setNumCoolers(n => n-1) }}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">−</button>
              <span className="text-white text-5xl font-black w-16 text-center">{numCoolers}</span>
              <button onClick={() => { if(numCoolers < 20) setNumCoolers(n => n+1) }}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">+</button>
            </div>
            <div className="flex justify-between">
              <Btn label={t.back} onClick={() => setStep(1)} />
              <Btn label={t.next} onClick={() => setStep(3)} />
            </div>
          </div>
        </>)}

        {/* PASO 3 — Aviso scan */}
        {step === 3 && !scanning && (<>
          <Header title={t.title} subtitle={t.scan_sub} />
          <div className="p-6 text-center">
            <p className="text-red-400 font-black text-lg mb-3">{t.scan_warning_title}</p>
            <p className="text-white/70 font-bold mb-8">{t.scan_warning_body}</p>
            <div className="flex justify-between">
              <Btn label={t.back} onClick={() => setStep(2)} />
              <Btn label={t.next} onClick={scan} />
            </div>
          </div>
        </>)}

        {/* PASO 3 — Scan en progreso */}
        {step === 3 && scanning && (<>
          <Header title={t.title} subtitle={t.scanning_sub} />
          <div className="p-6">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300 font-bold text-sm">{t.scan_fridge}</span>
              <span className="text-white/50 text-sm">{foundCoolers.length > 0 ? `${foundCoolers.length} ${t.found}` : t.in_progress}</span>
            </div>
            <div className="border-b border-white/10 mb-2" />
            <div className="flex justify-between items-center py-2 mb-4">
              <span className="text-gray-300 font-bold text-sm">{t.scan_sensors}</span>
              <span className="text-white/50 text-sm">{foundSensors.length > 0 ? `${foundSensors.length} ${t.found}` : t.in_progress}</span>
            </div>
            <div className="flex justify-center my-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff20" strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#9ca3af" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42 * scanProgress / 100} ${2 * Math.PI * 42}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl">{scanProgress}%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <Btn label={t.stop} onClick={() => { setScanning(false); setStep(3) }} />
            </div>
          </div>
        </>)}

        {/* PASO 5 — Resultado scan */}
        {step === 5 && (<>
          <Header title={t.title} subtitle={t.result_sub} />
          <div className="p-6">
            {foundCoolers.map((c, i) => (
              <Row key={c.unit_id}
                label={`${t.fridge} ${String(i+1).padStart(2,'0')}`}
                value={c.model || `Addr #${c.unit_id}`} />
            ))}
            {foundSensors.map((s, i) => (
              <Row key={s.unit_id}
                label={`${t.sensor} ${String(i+1).padStart(2,'0')}`}
                value={`Addr ${s.unit_id}`} />
            ))}
            {foundCoolers.length === 0 && foundSensors.length === 0 && (
              <p className="text-white/30 text-center py-4 font-bold">{t.no_devices}</p>
            )}
            <div className="flex justify-between mt-6">
              <Btn label={t.back} onClick={() => setStep(3)} />
              <Btn label={t.retry} onClick={() => { setStep(3); setTimeout(scan, 100) }} />
              <Btn label={t.ok} onClick={() => setStep(foundSensors.length > 0 ? 6 : 7)} />
            </div>
          </div>
        </>)}

        {/* PASO 6 — Asignar INT/EXT */}
        {step === 6 && (<>
          <Header title={t.title} subtitle={t.sensor_sub} />
          <div className="p-6">
            <p className="text-white/40 text-sm mb-4 text-center">{t.sensor_hint}</p>
            {foundSensors.map(s => (
              <div key={s.unit_id} className="flex items-center justify-between mb-4">
                <span className="text-white font-bold text-sm">{t.sensor} #{s.unit_id}</span>
                <div className="flex gap-2">
                  {['INT', 'EXT'].map(role => (
                    <button key={role} onClick={() => setSensorRoles(r => ({...r, [s.unit_id]: role}))}
                      className={`px-5 py-2 rounded-full border-2 font-bold text-sm cursor-pointer transition-all
                        ${sensorRoles[s.unit_id] === role
                          ? 'bg-gray-500 border-gray-400 text-white'
                          : 'bg-white/5 border-white/20 text-white/50 hover:bg-white/10'}`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-between mt-4">
              <Btn label={t.back} onClick={() => setStep(5)} />
              <Btn label={t.next} onClick={() => setStep(7)} />
            </div>
          </div>
        </>)}

        {/* PASO 7 — Purga */}
        {step === 7 && !purging && (<>
          <Header title={t.title} subtitle={t.purge_sub} />
          <div className="p-6 text-center">
            <p className="text-white/80 font-bold mb-1">{t.purge_body}</p>
            <p className="text-white/50 text-sm mb-8">{t.purge_hint}</p>
            <div className="flex justify-between">
              <Btn label={t.later} onClick={() => setStep(8)} />
              <Btn label={t.next} onClick={purge} />
            </div>
          </div>
        </>)}

        {step === 7 && purging && (<>
          <Header title={t.title} subtitle={t.purge_sub_active} />
          <div className="p-6">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300 font-bold text-sm">{t.purge_body}</span>
              <span className="text-white/50 text-sm">{t.in_progress}</span>
            </div>
            <div className="border-b border-white/10 mb-2" />
            <div className="flex justify-between items-center py-2 mb-4">
              <span className="text-gray-300 font-bold text-sm">Drain</span>
              <span className="text-white/50 text-sm">{t.in_progress}</span>
            </div>
            <div className="flex justify-center my-4">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff20" strokeWidth="10" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#088fc3" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42 * purgeProgress / 100} ${2 * Math.PI * 42}`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-xl">{purgeProgress}%</span>
                </div>
              </div>
            </div>
            <p className="text-white/50 text-sm text-center">{t.purging_msg}</p>
          </div>
        </>)}

        {/* PASO 8 — Confirmar */}
        {step === 8 && (<>
          <Header title={t.title} subtitle={t.confirm_sub} />
          <div className="p-6">
            <Row label={t.lang_label} value={lang.toUpperCase()} />
            <Row label={t.zones_label} value={numZones} />
            <Row label={t.coolers_label} value={foundCoolers.length || numCoolers} />
            <Row label={t.sensors_label} value={foundSensors.length} />
            {foundSensors.map(s => (
              <Row key={s.unit_id} label={`  · ${t.sensor} #${s.unit_id}`} value={sensorRoles[s.unit_id] || '?'} />
            ))}
            <div className="flex justify-center mt-6">
              <Btn label={t.confirm_btn} onClick={confirm} full />
            </div>
          </div>
        </>)}

      </div>
    </div>
  )
}