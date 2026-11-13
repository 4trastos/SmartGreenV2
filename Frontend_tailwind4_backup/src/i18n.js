// Idioma de la instalación, común a todas las pantallas.
// Este archivo solo sabe QUÉ idioma está activo. Cada pantalla tiene su propio diccionario de textos.
import { useState, useEffect } from 'react'
import { API_URL } from './config.js'

// El orden es el del índice que guarda el backend en config "language" (0 = es)
export const LANGS = ['es', 'en', 'pt', 'ca', 'fr', 'it']
export const LANG_NAMES = { es: 'Español', en: 'English', pt: 'Português', ca: 'Català', fr: 'Français', it: 'Italiano' }
export const LOCALES = { es: 'es-ES', en: 'en-GB', pt: 'pt-PT', ca: 'ca-ES', fr: 'fr-FR', it: 'it-IT' }

let current = 'es'
let loading = false
const listeners = new Set()

function setCurrent(lang) {
  current = lang
  listeners.forEach(fn => fn(lang))
}

// El valor guardado puede ser el índice (0 a 5) o el código ('fr')
function fromValue(v) {
  if (v === undefined || v === null || v === '') return 'es'
  const s = String(v).toLowerCase()
  if (LANGS.includes(s)) return s
  const n = Number(s)
  return Number.isInteger(n) && LANGS[n] ? LANGS[n] : 'es'
}

// Lee el idioma de la base de datos (una sola vez mientras no falle)
async function loadLang() {
  if (loading) return
  loading = true
  try {
    const arr = await (await fetch(`${API_URL}/config`)).json()
    setCurrent(fromValue(arr.find(c => c.key === 'language')?.value))
  } catch {
    loading = false             // si falla, la siguiente pantalla que se abra lo reintenta
  }
}

// Vuelve a leer el idioma de la base de datos (por ejemplo, al terminar el setup, que lo acaba de guardar)
export function reloadLang() {
  loading = false
  return loadLang()
}

// Uso en una pantalla:  const lang = useLang()
// Cuando se cambia el idioma, todas las pantallas abiertas se actualizan a la vez
export function useLang() {
  const [lang, setLang] = useState(current)
  useEffect(() => {
    listeners.add(setLang)
    setLang(current)
    loadLang()
    return () => { listeners.delete(setLang) }
  }, [])
  return lang
}

// Cambia el idioma (lo usa el IMD). Usa la misma ruta que el setup
export async function saveLang(lang) {
  const r = await fetch(`${API_URL}/setup/language`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang })
  })
  if (!r.ok) throw new Error('No se pudo guardar el idioma')
  setCurrent(lang)
}

// Texto de una pantalla en el idioma activo; si falta, en español
export const translate = (T, lang, key) => T[lang]?.[key] ?? T.es?.[key] ?? key
