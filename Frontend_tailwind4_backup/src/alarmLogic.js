// Cálculo de las alarmas ACTIVAS a partir del estado actual de coolers y sensores.
// Lo usan la pantalla de Alarmas y el contador de la cabecera (App.jsx), así que siempre coinciden.
// Devuelve códigos y números, no textos: cada pantalla los traduce a su idioma.
//
//   level:  'critical' (acción inmediata) · 'warning' (revisar pronto) · 'info' (informativo, no cuenta como alarma)
//   since:  segundos (hora del servidor) desde cuándo, o null si no se sabe
//   unit:   evaporativo o sensor al que se refiere (0 = sistema)

const RANK = { critical: 0, warning: 1, info: 2 }
const ts = v => (Number(v) > 0 ? Number(v) : null)

export function getActiveAlarms(data) {
  const out = []
  const busLost = Number(data.status?.bus_lost) === 1

  // ── Sistema ──
  if (data.status && !data.status.modbus_connected)
    out.push({ id: 'no_modbus', code: 'no_modbus', level: 'critical', unit: 0, since: null })
  if (busLost)                                                  // cae todo el bus: un solo aviso, no uno por equipo
    out.push({ id: 'bus_lost', code: 'bus_lost', level: 'critical', unit: 0, since: ts(data.status.bus_lost_since) })

  // ── Evaporativos ──
  for (const c of data.coolers || []) {
    const u = c.unit_id
    const broken = Number(c.broken_cooler) === 1
    const water = Number(c.water_stop)

    if (broken)
      out.push({ id: `broken_${u}`, code: 'broken', level: 'critical', unit: u, since: ts(c.last_off) })
    else if (c.alarm_fault)
      out.push({ id: `fault_${u}`, code: 'fault', level: 'critical', unit: u, since: null })

    if (!broken && !busLost && (Number(c.comms_lost) === 1 || c.alarm_comms))
      out.push({ id: `comms_${u}`, code: 'comms', level: 'critical', unit: u, since: ts(c.comms_lost_since) })

    if (water === 1)
      out.push({ id: `water_stop_${u}`, code: 'water_stop', level: 'warning', unit: u, since: ts(c.water_stop_since) })
    else if (water === 2)
      out.push({ id: `water_back_${u}`, code: 'water_back', level: 'info', unit: u, since: ts(c.water_stop_since) })
    else if (c.alarm_water && c.salinity_us <= 10)
      out.push({ id: `no_water_${u}`, code: 'no_water', level: 'warning', unit: u, since: null })

    if (c.alarm_salinity)
      out.push({ id: `salinity_${u}`, code: 'salinity', level: 'warning', unit: u, since: null, value: Math.round(c.salinity_us || 0) })

    if (c.alarm_warranty)
      out.push({ id: `warranty_${u}`, code: 'warranty', level: 'info', unit: u, since: null })
    if (c.alarm_maint_closing)
      out.push({ id: `maint_c_${u}`, code: 'maint_closing', level: 'info', unit: u, since: null })
    if (c.alarm_maint_opening)
      out.push({ id: `maint_o_${u}`, code: 'maint_opening', level: 'info', unit: u, since: null })
  }

  // ── Sensores ── (sin señal es crítico: el sensor interior anula el modo AUTO)
  for (const s of data.sensors || []) {
    const kind = s.type === 'EXT' ? 'ext' : 'int'
    if (s.alarm_signal)
      // since = última lectura buena (0 = nunca se ha leído)
      out.push({ id: `sensor_${s.sensor_id}`, code: `sensor_lost_${kind}`, level: 'critical', unit: s.sensor_id, since: Number(s.last_read) || 0 })
    if (s.alarm_temp)
      out.push({ id: `temp_${s.sensor_id}`, code: `temp_${kind}`, level: 'warning', unit: s.sensor_id, since: null })
  }

  // Primero lo más grave; dentro de cada nivel, lo más reciente arriba
  return out.sort((a, b) => RANK[a.level] - RANK[b.level] || (b.since ?? 0) - (a.since ?? 0))
}

// Número que se muestra en la cabecera y en la barra lateral: críticos + avisos (lo informativo no cuenta)
export function countAlarms(data) {
  return getActiveAlarms(data).filter(a => a.level !== 'info').length
}
