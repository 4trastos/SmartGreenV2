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
    purge_body: 'Purgando paneles el evaporativo es nuevo.',
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
    configured: 'CONFIGURADO', pending: 'PENDIENTE',
    new_board: 'Placa nueva encontrada', assign_as: 'CONFIGURAR COMO EVAPORATIVO',
    assigning: 'CONFIGURANDO...', one_at_a_time: 'Hay varias placas nuevas. Conecte solo una cada vez.',
    connect_next: 'Conecte el siguiente evaporativo (solo uno) y pulse REINT.',
    coolers_zones_hint: 'Indique en qué zona está cada evaporativo',
    zone_empty: 'La zona {n} no tiene ningún evaporativo',
    multi_zone_sensors_pending: 'Con varias zonas, la asignación del sensor interior de cada zona aún no está disponible en este asistente.',
    water_fail_title: 'NO LLEGA AGUA',
    water_fail_hint: 'Revise el suministro, la llave de paso, el solenoide y el sensor de agua.',
    water_fail_zone_one: 'Sin agua en la zona {z}: evaporativo {e}',
    water_fail_zone_many: 'Sin agua en la zona {z}: evaporativos {e}',
    and_word: 'y',
    water_repeat: 'HE CORREGIDO EL PROBLEMA: REPETIR PURGA',
    water_edit: 'MODIFICAR PARÁMETROS',
    wait_hint: 'Aumente la espera si el agua tarda más en llegar a este evaporativo (instalaciones grandes).',
    wait_prewet: 'Espera de agua en la purga',
    wait_run: 'Espera de agua en funcionamiento',
    wait_save: 'GUARDAR Y REPETIR PURGA',
    wait_back: 'VOLVER',
    new_install: 'NUEVA INSTALACIÓN',
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
    configured: 'CONFIGURED', pending: 'PENDING',
    new_board: 'New board found', assign_as: 'SET UP AS COOLER',
    assigning: 'SETTING UP...', one_at_a_time: 'Several new boards found. Connect only one at a time.',
    connect_next: 'Connect the next cooler (only one) and press RETRY.',
    coolers_zones_hint: 'Indicate which zone each cooler is in',
    zone_empty: 'Zone {n} has no cooler',
    multi_zone_sensors_pending: 'With several zones, assigning an indoor sensor to each zone is not yet available in this wizard.',
    water_fail_title: 'NO WATER IS COMING THROUGH',
    water_fail_hint: 'Check the supply, the shut-off valve, the solenoid, and the water sensor.',
    water_fail_zone_one: 'No water in zone {z}: cooler {e}',
    water_fail_zone_many: 'No water in zone {z}: coolers {e}',
    and_word: 'and',
    water_repeat: 'I HAVE FIXED THE PROBLEM: REPEAT PURGE',
    water_edit: 'MODIFY SETTINGS',
    wait_hint: 'Increase the wait if water takes longer to reach this cooler (large installations).',
    wait_prewet: 'Water wait during purge',
    wait_run: 'Water wait during operation',
    wait_save: 'SAVE AND REPEAT PURGE',
    wait_back: 'BACK',
    new_install: 'NEW INSTALLATION',
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
    configured: 'CONFIGURADO', pending: 'PENDENTE',
    new_board: 'Placa nova encontrada', assign_as: 'CONFIGURAR COMO REFRIGERADOR',
    assigning: 'A CONFIGURAR...', one_at_a_time: 'Há várias placas novas. Ligue apenas uma de cada vez.',
    connect_next: 'Ligue o refrigerador seguinte (apenas um) e prima TENTAR.',
    coolers_zones_hint: 'Indique em que zona está cada refrigerador',
    zone_empty: 'A zona {n} não tem nenhum refrigerador',
    multi_zone_sensors_pending: 'Com várias zonas, a atribuição do sensor interior a cada zona ainda não está disponível neste assistente.',
    water_fail_title: 'NÃO CHEGA ÁGUA',
    water_fail_hint: 'Verifique o abastecimento, a válvula de corte, o solenóide e o sensor de água.',
    water_fail_zone_one: 'Sem água na zona {z}: refrigerador {e}',
    water_fail_zone_many: 'Sem água na zona {z}: refrigeradores {e}',
    and_word: 'e',
    water_repeat: 'RESOLVI O PROBLEMA: REPETIR A LIMPEZA',
    water_edit: 'MODIFICAR PARÂMETROS',
    wait_hint: 'Aumente a espera se a água demorar mais a chegar a este refrigerador (instalações grandes).',
    wait_prewet: 'Espera de água na limpeza',
    wait_run: 'Espera de água em funcionamento',
    wait_save: 'GUARDAR E REPETIR A LIMPEZA',
    wait_back: 'VOLTAR',
    new_install: 'NOVA INSTALAÇÃO',
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
    configured: 'CONFIGURAT', pending: 'PENDENT',
    new_board: 'Placa nova trobada', assign_as: 'CONFIGURAR COM A CLIMATITZADOR',
    assigning: 'CONFIGURANT...', one_at_a_time: 'Hi ha diverses plaques noves. Connecteu-ne només una cada vegada.',
    connect_next: 'Connecteu el següent climatitzador (només un) i premeu REINTENTAR.',
    coolers_zones_hint: 'Indiqueu en quina zona és cada climatitzador',
    zone_empty: 'La zona {n} no té cap climatitzador',
    multi_zone_sensors_pending: 'Amb diverses zones, l\'assignació del sensor interior de cada zona encara no està disponible en aquest assistent.',
    water_fail_title: 'NO ARRIBA AIGUA',
    water_fail_hint: 'Reviseu el subministrament, la clau de pas, el solenoide i el sensor d\'aigua.',
    water_fail_zone_one: 'Sense aigua a la zona {z}: climatitzador {e}',
    water_fail_zone_many: 'Sense aigua a la zona {z}: climatitzadors {e}',
    and_word: 'i',
    water_repeat: 'HE CORREGIT EL PROBLEMA: REPETIR PURGA',
    water_edit: 'MODIFICAR PARÀMETRES',
    wait_hint: 'Augmenteu l\'espera si l\'aigua triga més a arribar a aquest evaporatiu (instal·lacions grans).',
    wait_prewet: 'Espera d\'aigua en la purga',
    wait_run: 'Espera d\'aigua en funcionament',
    wait_save: 'DESAR I REPETIR PURGA',
    wait_back: 'TORNAR',
    new_install: 'NOVA INSTAL·LACIÓ',
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
    configured: 'CONFIGURÉ', pending: 'EN ATTENTE',
    new_board: 'Nouvelle carte trouvée', assign_as: 'CONFIGURER COMME REFROIDISSEUR',
    assigning: 'CONFIGURATION...', one_at_a_time: 'Plusieurs nouvelles cartes détectées. Connectez-en une seule à la fois.',
    connect_next: 'Connectez le refroidisseur suivant (un seul) et appuyez sur RÉESSAYER.',
    coolers_zones_hint: 'Indiquez dans quelle zone se trouve chaque refroidisseur',
    zone_empty: 'La zone {n} n\'a aucun refroidisseur',
    multi_zone_sensors_pending: 'Avec plusieurs zones, l\'attribution du capteur intérieur à chaque zone n\'est pas encore disponible dans cet assistant.',
    water_fail_title: 'L\'EAU N\'ARRIVE PAS',
    water_fail_hint: 'Vérifiez l\'alimentation, le robinet d\'arrêt, l\'électrovanne et le capteur d\'eau.',
    water_fail_zone_one: 'Pas d\'eau dans la zone {z} : refroidisseur {e}',
    water_fail_zone_many: 'Pas d\'eau dans la zone {z} : refroidisseurs {e}',
    and_word: 'et',
    water_repeat: 'J\'AI CORRIGÉ LE PROBLÈME : RÉPÉTER LA PURGE',
    water_edit: 'MODIFIER LES PARAMÈTRES',
    wait_hint: 'Augmentez l\'attente si l\'eau met plus de temps à arriver à ce refroidisseur (grandes installations).',
    wait_prewet: 'Attente d\'eau pendant la purge',
    wait_run: 'Attente d\'eau en fonctionnement',
    wait_save: 'ENREGISTRER ET RÉPÉTER LA PURGE',
    wait_back: 'RETOUR',
    new_install: 'NOUVELLE INSTALLATION',
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
    configured: 'CONFIGURATO', pending: 'IN ATTESA',
    new_board: 'Nuova scheda trovata', assign_as: 'CONFIGURA COME RAFFRESCATORE',
    assigning: 'CONFIGURAZIONE...', one_at_a_time: 'Sono state trovate più schede nuove. Collegarne una sola alla volta.',
    connect_next: 'Collegare il raffrescatore successivo (uno solo) e premere RIPROVA.',
    coolers_zones_hint: 'Indicare in quale zona si trova ogni raffrescatore',
    zone_empty: 'La zona {n} non ha nessun raffrescatore',
    multi_zone_sensors_pending: 'Con più zone, l\'assegnazione del sensore interno a ciascuna zona non è ancora disponibile in questa procedura guidata.',
    water_fail_title: 'NON ARRIVA L\'ACQUA',
    water_fail_hint: 'Verificare l\'alimentazione, la valvola di intercettazione, il solenoide e il sensore dell\'acqua.',
    water_fail_zone_one: 'Senz\'acqua nella zona {z}: raffrescatore {e}',
    water_fail_zone_many: 'Senz\'acqua nella zona {z}: raffrescatori {e}',
    and_word: 'e',
    water_repeat: 'HO RISOLTO IL PROBLEMA: RIPETI LA PURGAZIONE',
    water_edit: 'MODIFICA PARAMETRI',
    wait_hint: 'Aumentare l\'attesa se l\'acqua impiega più tempo ad arrivare a questo raffrescatore (grandi impianti).',
    wait_prewet: 'Attesa acqua durante lo spurgo',
    wait_run: 'Attesa acqua in funzionamento',
    wait_save: 'SALVA E RIPETI LO SPURGO',
    wait_back: 'INDIETRO',
    new_install: 'NUOVA INSTALLAZIONE',
  },
}

// ─── PROGRESO GUARDADO ───────────────────────────────────────
// El progreso del setup se guarda en el navegador para sobrevivir a una recarga de la página
const SAVE_KEY = 'sg_setup_progress'
const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {} } catch { return {} }
}
const clearSaved = () => { try { localStorage.removeItem(SAVE_KEY) } catch {} }

// Valores por defecto de las esperas de agua (configuración de fábrica). Si se deja el valor por defecto, se envía 0 = usar el global
const WAIT_DEFAULT = { prewet: 90, run: 120 }
const WAIT_OPTIONS = { prewet: [60, 90, 120, 180, 300], run: [60, 120, 180, 300] }

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
  const [saved] = useState(loadSaved)                     // se lee UNA vez, al cargar la página
  const [step, setStep] = useState(saved.step ?? 0)
  const [lang, setLang] = useState(saved.lang ?? 'es')
  const [numZones, setNumZones] = useState(saved.numZones ?? 1)
  const [zones, setZones] = useState(saved.zones ?? [{ name: 'Zona 1' }])
  const [activeZoneKeyboard, setActiveZoneKeyboard] = useState(null)
  const [numCoolers, setNumCoolers] = useState(saved.numCoolers ?? 1)
  const [coolerZones, setCoolerZones] = useState(saved.coolerZones ?? {})   // posición del evaporativo (0, 1, ...) → zona (1 por defecto)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [foundCoolers, setFoundCoolers] = useState(saved.foundCoolers ?? [])
  const [foundSensors, setFoundSensors] = useState(saved.foundSensors ?? [])
  const [sensorRoles, setSensorRoles] = useState(saved.sensorRoles ?? {})
  const [purging, setPurging] = useState(false)
  const [purgeProgress, setPurgeProgress] = useState(0)
  const [assigning, setAssigning] = useState(false)
  const [assignMsg, setAssignMsg] = useState('')
  const [waterFails, setWaterFails] = useState(saved.waterFails ?? [])    // evaporativos sin agua: [{unit_id, zone_id}] (vacío = bien)
  const [editWaits, setEditWaits] = useState(false)
  const [waitEdits, setWaitEdits] = useState({})                        // unit_id → { prewet, run } elegidos en la pantalla
  const pendingWaits = useRef(null)

  const t = T[lang] || T.es
  const tt = key => t[key] ?? T.es[key]          // si falta una traducción, usar el español

  // Direcciones fijas: evaporativo N → dirección FIRST + N - 1 (la 1 queda libre para placas nuevas de fábrica)
  const FIRST = 2
  const slots = Array.from({ length: numCoolers }, (_, i) => FIRST + i)
  const okBoards  = foundCoolers.filter(c => slots.includes(c.unit_id))        // ya en su sitio
  const newBoards = foundCoolers.filter(c => !slots.includes(c.unit_id))       // de fábrica o en otra dirección
  const nextSlot  = slots.find(s => !okBoards.some(c => c.unit_id === s))      // primer hueco libre
  const allReady  = okBoards.length === numCoolers

  // Zona de cada evaporativo (si se reduce el número de zonas, nunca queda apuntando a una que ya no existe)
  const multi = numZones > 1
  const zoneOf = i => Math.min(coolerZones[i] ?? 1, numZones)
  const setCoolerZone = (i, z) => setCoolerZones(prev => ({ ...prev, [i]: z }))
  const zoneName = j => zones[j - 1]?.name || `${t.zone_placeholder} ${j}`
  const emptyZones = multi
    ? Array.from({ length: numZones }, (_, j) => j + 1).filter(z => !slots.some((_, i) => zoneOf(i) === z))
    : []
  const coolersToSave = slots.map((a, i) => ({ unit_id: a, zone_id: zoneOf(i) }))

  // Fallos de agua: agrupados por zona ("Sin agua en la zona X: evaporativos 03 y 04")
  const evoNum = u => String(u - FIRST + 1).padStart(2, '0')
  const joinList = arr => arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} ${tt('and_word')} ${arr[arr.length - 1]}`
  const failGroups = (() => {
    const g = {}
    waterFails.forEach(f => { if (!g[f.zone_id]) g[f.zone_id] = []; g[f.zone_id].push(f.unit_id) })
    return Object.keys(g).map(Number).sort((a, b) => a - b).map(z => ({ zone: z, units: g[z].sort((a, b) => a - b) }))
  })()

  // Guardar el progreso cada vez que cambia algo
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        step, lang, numZones, zones, numCoolers, coolerZones, foundCoolers, foundSensors, sensorRoles, purging, waterFails
      }))
    } catch {}
  }, [step, lang, numZones, zones, numCoolers, coolerZones, foundCoolers, foundSensors, sensorRoles, purging, waterFails])

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

  const post = async (endpoint, body = {}) => {
    try {
      const r = await fetch(`${API_URL}/setup/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      return await r.json()
    } catch { return {} }
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

  // Pone una placa en la dirección de su evaporativo y vuelve a escanear
  const assignBoard = async (from, to) => {
    setAssigning(true); setAssignMsg('')
    try {
      const r = await fetch(`${API_URL}/imd/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      })
      const d = await r.json()
      if (!r.ok) setAssignMsg(d.error || 'Error')
      else {
        await new Promise(res => setTimeout(res, 3000))   // la placa guarda la dirección
        setStep(3); scan()                                // volver a escanear
      }
    } catch { setAssignMsg('Sin respuesta del controlador') }
    setAssigning(false)
  }

  // Espera a que termine la purga en TODAS las zonas, y decide: fallo de agua o resumen
  const waitPurgeEnd = async () => {
    const TOTAL = 361
    let elapsed = 0
    const timer = setInterval(() => {
      elapsed++
      setPurgeProgress(p => Math.max(p, Math.min(99, Math.round((elapsed / TOTAL) * 100))))
    }, 1000)

    await new Promise(resolve => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/zones`)
          const zs = await res.json()
          if (zs.length && zs.every(z => z.prewet_in_progress === 'no')) {
            clearInterval(interval)
            resolve()
          }
        } catch {}
      }, 2000)
    })

    clearInterval(timer)
    setPurgeProgress(100)
    try {
      const s = await (await fetch(`${API_URL}/setup/status`)).json()
      const fails = Array.isArray(s.water_fails) && s.water_fails.length > 0
        ? s.water_fails
        : (s.water_fail ? [{ unit_id: s.water_fail, zone_id: 1 }] : [])      // por si el backend solo envía uno
      if (fails.length > 0) { setPurging(false); setWaterFails(fails); return }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
    setPurging(false)
    setStep(8)
  }

  const purge = async () => {
    setWaterFails([])
    setPurging(true)
    setPurgeProgress(0)
    await post('language', { lang })
    await post('zones', { num_zones: numZones, zones })
    await post('coolers', { zone_id: 1, num_coolers: numCoolers, coolers: coolersToSave })
    await post('sensors', { sensors: foundSensors.map(s => ({ unit_id: s.unit_id, role: sensorRoles[s.unit_id] || 'INT' })) })
    if (pendingWaits.current) {
      for (const w of pendingWaits.current)
        await post('water_waits', w)
      pendingWaits.current = null
    }
    await fetch(`${API_URL}/setup/purge`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    }).catch(err => console.error('Error purga:', err))
    await waitPurgeEnd()
  }

  // Un par de esperas por cada evaporativo que ha fallado
  const openWaits = () => {
    const init = {}
    waterFails.forEach(f => { init[f.unit_id] = { prewet: WAIT_DEFAULT.prewet, run: WAIT_DEFAULT.run } })
    setWaitEdits(init)
    setEditWaits(true)
  }

  const setWait = (unit, key, val) => setWaitEdits(prev => ({ ...prev, [unit]: { ...prev[unit], [key]: val } }))

  const saveWaitsAndPurge = () => {
    pendingWaits.current = waterFails.map(f => {
      const w = waitEdits[f.unit_id] || WAIT_DEFAULT
      return {
        unit_id: f.unit_id,
        prewet_wait: w.prewet === WAIT_DEFAULT.prewet ? 0 : w.prewet,
        run_wait: w.run === WAIT_DEFAULT.run ? 0 : w.run,
      }
    })
    setEditWaits(false)
    purge()
  }

  // Si la página se recargó en mitad de la purga: volver a la pantalla de espera
  useEffect(() => {
    if (saved.purging) {
      setStep(7)
      setPurging(true)
      waitPurgeEnd()
    }
  }, [])

  const newInstall = () => {
    clearSaved()
    setWaterFails([])
    setFoundCoolers([]); setFoundSensors([]); setSensorRoles({}); setCoolerZones({})
    setEditWaits(false); pendingWaits.current = null
    setStep(0)
  }

  const confirm = async () => {
    await post('language', { lang })
    await post('zones', { num_zones: numZones, zones })
    await post('coolers', { zone_id: 1, num_coolers: numCoolers, coolers: coolersToSave })
    await post('sensors', { sensors: foundSensors.map(s => ({ unit_id: s.unit_id, role: sensorRoles[s.unit_id] || 'INT' })) })
    await post('confirm', {})
    // Pasar a la pantalla normal cuando el backend confirme que la instalación está hecha
    try {
      const s = await (await fetch(`${API_URL}/setup/status`)).json()
      if (s.setup_required) return            // el backend no la ha dado por buena: quedarse en el asistente
    } catch {}
    clearSaved()
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

        {/* PASO 2 — Coolers (y, con varias zonas, la zona de cada uno) */}
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

            {multi && (
              <div className="mb-4">
                <p className="text-white/50 text-xs mb-2 text-center">{tt('coolers_zones_hint')}</p>
                <div className="max-h-48 overflow-y-auto pr-1">
                  {slots.map((addr, i) => (
                    <div key={addr} className="flex items-center justify-between py-1.5">
                      <span className="text-white font-bold text-sm">{t.fridge} {String(i + 1).padStart(2, '0')}</span>
                      <select value={zoneOf(i)} onChange={e => setCoolerZone(i, Number(e.target.value))}
                        className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white text-sm">
                        {zones.map((z, j) => (
                          <option key={j} value={j + 1} className="bg-[#0a1118]">{zoneName(j + 1)}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                {emptyZones.length > 0 && (
                  <p className="text-red-300 text-xs text-center mt-2 font-bold">
                    {tt('zone_empty').replace('{n}', zoneName(emptyZones[0]))}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Btn label={t.back} onClick={() => setStep(1)} />
              <Btn label={t.next} disabled={emptyZones.length > 0} onClick={() => setStep(3)} />
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

        {/* PASO 5 — Resultado scan + asignación de direcciones */}
        {step === 5 && (<>
          <Header title={t.title} subtitle={t.result_sub} />
          <div className="p-6">
            {slots.map((addr, i) => {
              const ok = okBoards.some(c => c.unit_id === addr)
              return <Row key={addr} label={`${t.fridge} ${String(i + 1).padStart(2, '0')}${multi ? ` · ${zoneName(zoneOf(i))}` : ''}`}
                          value={ok ? `✔ ${tt('configured')}` : tt('pending')} />
            })}

            {newBoards.length > 0 && nextSlot && (
              <div className="my-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/40">
                <p className="text-yellow-300 font-bold text-sm mb-2">{tt('new_board')} (Addr {newBoards[0].unit_id})</p>
                {newBoards.length > 1 && <p className="text-red-300 text-xs mb-2">{tt('one_at_a_time')}</p>}
                <Btn full disabled={assigning || newBoards.length > 1}
                  label={assigning ? tt('assigning') : `${tt('assign_as')} ${String(nextSlot - FIRST + 1).padStart(2, '0')}`}
                  onClick={() => assignBoard(newBoards[0].unit_id, nextSlot)} />
              </div>
            )}
            {!allReady && newBoards.length === 0 && (
              <p className="text-yellow-300 text-sm my-3 text-center font-bold">{tt('connect_next')}</p>
            )}
            {assignMsg && <p className="text-red-400 text-sm my-2 text-center">{assignMsg}</p>}

            {foundSensors.map((s, i) => (
              <Row key={s.unit_id} label={`${t.sensor} ${String(i + 1).padStart(2, '0')}`} value={`Addr ${s.unit_id}`} />
            ))}
            {foundCoolers.length === 0 && foundSensors.length === 0 && (
              <p className="text-white/30 text-center py-4 font-bold">{t.no_devices}</p>
            )}
            <div className="flex justify-between mt-6">
              <Btn label={t.back} onClick={() => setStep(3)} />
              <Btn label={t.retry} disabled={assigning} onClick={() => { setStep(3); setTimeout(scan, 100) }} />
              <Btn label={t.ok} disabled={!allReady || assigning} onClick={() => setStep(foundSensors.length > 0 || multi ? 6 : 7)} />
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
            {/* Con varias zonas, cada una necesita su sensor interior: esa asignación está pendiente, y el asistente no continúa a medias */}
            {multi && (
              <p className="text-yellow-300 text-xs text-center my-3 font-bold">{tt('multi_zone_sensors_pending')}</p>
            )}
            <div className="flex justify-between mt-4">
              <Btn label={t.back} onClick={() => setStep(5)} />
              <Btn label={t.next} disabled={multi} onClick={() => setStep(7)} />
            </div>
          </div>
        </>)}

        {/* PASO 7 — Purga */}
        {step === 7 && !purging && waterFails.length === 0 && (<>
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

        {/* PASO 7 — Fallo: no llega agua */}
        {step === 7 && !purging && waterFails.length > 0 && (<>
          <Header title={t.title} subtitle={tt('water_fail_title')} />
          <div className="p-6 text-center">
            <p className="text-red-400 text-5xl mb-3">✘</p>
            {failGroups.map(g => (
              <p key={g.zone} className="text-white font-bold mb-1">
                {tt(g.units.length > 1 ? 'water_fail_zone_many' : 'water_fail_zone_one')
                  .replace('{z}', zoneName(g.zone))
                  .replace('{e}', joinList(g.units.map(evoNum)))}
              </p>
            ))}
            <p className="text-white/60 text-sm mt-2 mb-8">{tt('water_fail_hint')}</p>
            {!editWaits ? (
              <div className="flex flex-col gap-3">
                <Btn full label={tt('water_repeat')} onClick={purge} />
                <Btn full label={tt('water_edit')} onClick={openWaits} />
                <Btn full label={tt('new_install')} onClick={newInstall} />
              </div>
            ) : (
              <div className="text-left">
                <p className="text-white/60 text-xs mb-4">{tt('wait_hint')}</p>
                <div className="max-h-56 overflow-y-auto pr-1">
                  {waterFails.map(f => (
                    <div key={f.unit_id} className="mb-3 pb-2 border-b border-white/10">
                      <p className="text-yellow-300 font-bold text-xs mb-2">{t.fridge} {evoNum(f.unit_id)} · {zoneName(f.zone_id)}</p>
                      {[
                        { key: 'prewet', label: tt('wait_prewet'), options: WAIT_OPTIONS.prewet },
                        { key: 'run',    label: tt('wait_run'),    options: WAIT_OPTIONS.run },
                      ].map(({ key, label, options }) => (
                        <label key={key} className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-white/80 text-sm">{label}</span>
                          <select value={waitEdits[f.unit_id]?.[key] ?? WAIT_DEFAULT[key]}
                            onChange={e => setWait(f.unit_id, key, Number(e.target.value))}
                            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white">
                            {options.map(o => <option key={o} value={o} className="bg-[#0a1118]">{o} s</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3 mt-5">
                  <Btn full label={tt('wait_save')} onClick={saveWaitsAndPurge} />
                  <Btn full label={tt('wait_back')} onClick={() => setEditWaits(false)} />
                </div>
              </div>
            )}
          </div>
        </>)}

        {/* PASO 8 — Confirmar */}
        {step === 8 && (<>
          <Header title={t.title} subtitle={t.confirm_sub} />
          <div className="p-6">
            <Row label={t.lang_label} value={lang.toUpperCase()} />
            <Row label={t.zones_label} value={numZones} />
            {multi && zones.map((z, j) => (
              <Row key={j} label={`  · ${zoneName(j + 1)}`}
                   value={slots.map((_, i) => i).filter(i => zoneOf(i) === j + 1).map(i => String(i + 1).padStart(2, '0')).join(', ') || '—'} />
            ))}
            <Row label={t.coolers_label} value={numCoolers} />
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
