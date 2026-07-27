import { useState, useEffect, useRef } from 'react'

// const WS_URL = 'ws://localhost:8081'
// const API_URL = 'http://localhost:8080/api'
const HOST = window.location.hostname
const WS_URL = `ws://${HOST}:8081`
const API_URL = `http://${HOST}:8080/api`

export function useSmartGreen() {
  const [data, setData] = useState({ coolers: [], sensors: [], zones: [], status: null })
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const retryRef = useRef(null)

  const connect = () => {
    // Si ya hay una conexión abierta, no crear otra
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
      return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket conectado')
      setConnected(true)
      // Limpiar retry si había uno pendiente
      if (retryRef.current)
      {
        clearTimeout(retryRef.current)
        retryRef.current = null
      }
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'update')
        setData({
          coolers: msg.coolers || [],
          sensors: msg.sensors || [],
          zones:   msg.zones   || [],
          status:  msg.status  || null
        })
    }

    ws.onclose = () => {
      console.log('WebSocket desconectado — reintentando en 3s...')
      setConnected(false)
      // Reintentar en 3 segundos
      retryRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()  // onclose se encarga del reintento
    }
  }

  useEffect(() => {
    connect()
    return () => {
      // Limpiar al desmontar
      if (retryRef.current)
        clearTimeout(retryRef.current)
      if (wsRef.current)
        wsRef.current.close()
    }
  }, [])

  const postApi = async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return res.json()
  }

  return { data, connected, postApi }
}



// import { useState, useEffect } from 'react'

// const WS_URL = 'ws://localhost:8081'
// const API_URL = 'http://localhost:8080/api'

// export function useSmartGreen() {
//   const [data, setData] = useState({
//     coolers: [],
//     sensors: [],
//     zones: [],
//     status: null
//   })
//   const [connected, setConnected] = useState(false)

//   useEffect(() => {
//     const ws = new WebSocket(WS_URL)

//     ws.onopen = () => {
//       console.log('WebSocket conectado')
//       setConnected(true)
//     }

//     ws.onmessage = (event) => {
//       const msg = JSON.parse(event.data)
//       if (msg.type === 'update')
//         setData({
//           coolers: msg.coolers || [],
//           sensors: msg.sensors || [],
//           zones: msg.zones || [],
//           status: msg.status || null
//         })
//     }

//     ws.onclose = () => {
//       console.log('WebSocket desconectado')
//       setConnected(false)
//     }

//     return () => ws.close()
//   }, [])

//   const postApi = async (endpoint, body) => {
//     const res = await fetch(`${API_URL}${endpoint}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(body)
//     })
//     return res.json()
//   }

//   return { data, connected, postApi }
// }