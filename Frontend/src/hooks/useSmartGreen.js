import { useState, useEffect } from 'react'

const WS_URL = 'ws://localhost:8081'
const API_URL = 'http://localhost:8080/api'

export function useSmartGreen() {
  const [data, setData] = useState({
    coolers: [],
    sensors: [],
    zones: [],
    status: null
  })
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('WebSocket conectado')
      setConnected(true)
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'update')
        setData({
          coolers: msg.coolers || [],
          sensors: msg.sensors || [],
          zones: msg.zones || [],
          status: msg.status || null
        })
    }

    ws.onclose = () => {
      console.log('WebSocket desconectado')
      setConnected(false)
    }

    return () => ws.close()
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
