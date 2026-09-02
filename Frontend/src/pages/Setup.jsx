import { API_URL } from '../config.js'
import { useState, useEffect, useRef } from 'react'

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

export default function Setup({ onComplete, data }) {
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState('es')
  const [numZones, setNumZones] = useState(1)
  const [zones, setZones] = useState([{ name: 'Zona 1' }])
  const [numCoolers, setNumCoolers] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [foundCoolers, setFoundCoolers] = useState([])
  const [foundSensors, setFoundSensors] = useState([])
  const [sensorRoles, setSensorRoles] = useState({})
  const [purging, setPurging] = useState(false)
  const [prewetStarted, setPrewetStarted] = useState(false)
  const prewetStartedRef = useRef(false)

  // Detectar fin de purga via WebSocket
  useEffect(() => {
      if (!data?.zones) return
      const zone = data.zones?.[0]
      if (!zone) return

      if (prewetStartedRef.current && zone.prewet_in_progress === 'no')
      {
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

    const interval = setInterval(() => {
      setScanProgress(p => Math.min(p + 3, 95))
    }, 600)

    const r = await fetch(`${API_URL}/setup/scan`, { method: 'POST' })
    const d = await r.json()
    clearInterval(interval)
    setScanProgress(100)
    setFoundCoolers(d.coolers || [])
    setFoundSensors(d.sensors || [])

    const roles = {}
    ;(d.sensors || []).forEach((s, i) => {
      roles[s.unit_id] = i === 0 ? 'INT' : 'EXT'
    })
    setSensorRoles(roles)
    setScanning(false)
    setTimeout(() => setStep(5), 600)
  }

  const purge = async () => {
    prewetStartedRef.current = true  // ← activar ANTES de todo
    setPurging(true)

    // 1. Guardar configuración completa
    await post('language', { lang })
    await post('zones', { num_zones: numZones, zones })
    await post('coolers', {
        zone_id: 1,
        num_coolers: foundCoolers.length || numCoolers,
        coolers: foundCoolers
    })
    await post('sensors', {
        sensors: foundSensors.map(s => ({
            unit_id: s.unit_id,
            role: sensorRoles[s.unit_id] || 'INT'
        }))
    })

    // 2. Disparar purga física
    await fetch(`${API_URL}/setup/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    }).catch(err => console.error("Error en purga:", err))
  }

  const confirm = async () => {
    // Aseguramos que los sensores queden guardados por si el usuario saltó la purga (botón TARDE)
    await post('language', { lang })
    await post('zones', { num_zones: numZones, zones })
    await post('coolers', { 
      zone_id: 1, 
      num_coolers: foundCoolers.length || numCoolers,
      coolers: foundCoolers 
    })
    await post('sensors', { 
      sensors: foundSensors.map(s => ({
        unit_id: s.unit_id,
        role: sensorRoles[s.unit_id] || 'INT'
      }))
    })

    // Llamada final para cerrar el modo setup en el backend en C
    await post('confirm', {})
    onComplete()
  }

  return (
    <div className="flex h-screen w-screen bg-[#060c12] items-center justify-center"
      style={{ fontFamily: "'Arial', sans-serif" }}>
      <div className="w-[520px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0D1F35]">

        {/* PASO 0 — Idioma */}
        {step === 0 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="Selección de idioma" />
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
                <div key={l.code} onClick={() => setLang(l.code)}
                  className="flex items-center justify-between py-3 px-4 rounded-lg border-2 cursor-pointer hover:bg-white/5 transition-all"
                  style={{ borderColor: lang === l.code ? '#888' : '#333' }}>
                  <span className="font-bold text-white text-sm">{l.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 transition-all ${lang === l.code ? 'bg-gray-400 border-gray-300' : 'bg-transparent border-gray-600'}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Btn label="ACEPTAR" onClick={() => setStep(1)} />
            </div>
          </div>
        </>)}

        {/* PASO 1 — Zonas */}
        {step === 1 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="¿Cuántas zonas tiene la instalación?" />
          <div className="p-6">
            <div className="flex items-center justify-center gap-8 my-4">
              <button onClick={() => { if(numZones > 1) { setNumZones(n => n-1); setZones(z => z.slice(0,-1)) }}}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">−</button>
              <span className="text-white text-5xl font-black w-16 text-center">{numZones}</span>
              <button onClick={() => { if(numZones < 8) { setNumZones(n => n+1); setZones(z => [...z, {name:`Zona ${numZones+1}`}]) }}}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">+</button>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              {zones.map((z, i) => (
                <input key={i} value={z.name}
                  onChange={e => setZones(prev => prev.map((z, j) => j === i ? {...z, name: e.target.value} : z))}
                  className="bg-white/5 border-2 border-white/10 rounded-lg px-4 py-2 text-white font-bold text-center" />
              ))}
            </div>
            <div className="flex justify-between">
              <Btn label="VOLV" onClick={() => setStep(0)} />
              <Btn label="CONT" onClick={() => setStep(2)} />
            </div>
          </div>
        </>)}

        {/* PASO 2 — Coolers */}
        {step === 2 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="¿Cuántos climatizadores evaporativos?" />
          <div className="p-6">
            <div className="flex items-center justify-center gap-8 my-6">
              <button onClick={() => { if(numCoolers > 1) setNumCoolers(n => n-1) }}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">−</button>
              <span className="text-white text-5xl font-black w-16 text-center">{numCoolers}</span>
              <button onClick={() => { if(numCoolers < 20) setNumCoolers(n => n+1) }}
                className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 text-white text-2xl font-black cursor-pointer hover:bg-white/20">+</button>
            </div>
            <div className="flex justify-between">
              <Btn label="VOLV" onClick={() => setStep(1)} />
              <Btn label="CONT" onClick={() => setStep(3)} />
            </div>
          </div>
        </>)}

        {/* PASO 3 — Aviso scan */}
        {step === 3 && !scanning && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="Exploración del sistema" />
          <div className="p-6 text-center">
            <p className="text-red-400 font-black text-lg mb-3">¡IMPORTANTE!</p>
            <p className="text-white/70 font-bold mb-8">
              Asegúrese que los componentes estén conectados y encendidos.
            </p>
            <div className="flex justify-between">
              <Btn label="VOLV" onClick={() => setStep(2)} />
              <Btn label="CONT" onClick={scan} />
            </div>
          </div>
        </>)}

        {/* PASO 3 — Scan en progreso */}
        {step === 3 && scanning && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="Exploración sistema. Espere." />
          <div className="p-6">
            <Row label="EVAPORATIVOS" value={foundCoolers.length > 0 ? `${foundCoolers.length} ENCONTRADO` : 'EN CURSO'} />
            <Row label="SENSORES" value={foundSensors.length > 0 ? `${foundSensors.length} ENCONTRADO` : 'EN CURSO'} />
            <div className="flex justify-center my-6">
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
              <Btn label="STOP" onClick={() => { setScanning(false); setStep(3) }} />
            </div>
          </div>
        </>)}

        {/* PASO 5 — Resultado scan */}
        {step === 5 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="Se encontraron los siguientes en el sist:" />
          <div className="p-6">
            {foundCoolers.map((c, i) => (
              <Row key={c.unit_id}
                label={`EVAPORATIVOS ${String(i+1).padStart(2,'0')}`}
                value={c.model || `Addr #${c.unit_id}`} />
            ))}
            {foundSensors.map(s => (
              <Row key={s.unit_id}
                label={`SENSOR #${s.unit_id}`}
                value={`Addr ${s.unit_id}`} />
            ))}
            {foundCoolers.length === 0 && foundSensors.length === 0 && (
              <p className="text-white/30 text-center py-4 font-bold">No se encontraron equipos</p>
            )}
            <div className="flex justify-between mt-6">
              <Btn label="VOLV" onClick={() => setStep(3)} />
              <Btn label="REINT" onClick={() => { setStep(3); setTimeout(scan, 100) }} />
              <Btn label="ACEPTA" onClick={() => setStep(foundSensors.length > 0 ? 6 : 7)} />
            </div>
          </div>
        </>)}

        {/* PASO 6 — Asignar INT/EXT */}
        {step === 6 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="Asignar tipo de sensor" />
          <div className="p-6">
            <p className="text-white/40 text-sm mb-4 text-center">Indique si cada sensor es interior o exterior</p>
            {foundSensors.map(s => (
              <div key={s.unit_id} className="flex items-center justify-between mb-4">
                <span className="text-white font-bold text-sm">Sensor #{s.unit_id}</span>
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
              <Btn label="VOLV" onClick={() => setStep(5)} />
              <Btn label="CONT" onClick={() => setStep(7)} />
            </div>
          </div>
        </>)}

        {/* PASO 7 — Purga paneles */}
        {step === 7 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN"
            subtitle={purging ? "Ciclo de purga paneles. ESPERE" : "Ciclo de purga paneles"} />
          <div className="p-6 text-center">
            {!purging ? (<>
              <p className="text-white/80 font-bold mb-1">Purgue paneles si el evaporativo es nuevo.</p>
              <p className="text-white/50 text-sm mb-8">Esto puede tardar 10 minutos.</p>
              <div className="flex justify-between">
                <Btn label="TARDE" onClick={() => setStep(8)} />
                <Btn label="CONT" onClick={purge} />
              </div>
            </>) : (<>
              <p className="text-white/50 text-sm mb-6">Purgando paneles — espere...</p>
              <div className="flex justify-center my-4">
                <div className="w-20 h-20 rounded-full border-4 border-white/20 bg-white/5 flex items-center justify-center animate-pulse">
                  <span className="text-white/60 font-bold text-sm">Drain</span>
                </div>
              </div>
              <Btn label="STOP" onClick={() => { setPurging(false); setStep(8) }} />
            </>)}
          </div>
        </>)}

        {/* PASO 8 — Confirmar */}
        {step === 8 && (<>
          <Header title="ASISTENTE DE INSTALACIÓN" subtitle="Resumen de la instalación" />
          <div className="p-6">
            <Row label="Idioma" value={lang.toUpperCase()} />
            <Row label="Zonas" value={numZones} />
            <Row label="Evaporativos" value={foundCoolers.length || numCoolers} />
            <Row label="Sensores" value={foundSensors.length} />
            {foundSensors.map(s => (
              <Row key={s.unit_id} label={`  · Sensor #${s.unit_id}`} value={sensorRoles[s.unit_id] || '?'} />
            ))}
            <div className="flex justify-center mt-6">
              <Btn label="✓  CONFIRMAR INSTALACIÓN" onClick={confirm} full />
            </div>
          </div>
        </>)}
      </div>
    </div>
  )
}