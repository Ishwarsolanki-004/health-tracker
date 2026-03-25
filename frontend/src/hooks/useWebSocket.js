// hooks/useWebSocket.js — WebSocket with graceful fallback (no spam reconnects)

import { useState, useEffect, useRef, useCallback } from 'react'

export function useWebSocket(deviceId) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const wsRef        = useRef(null)
  const attemptsRef  = useRef(0)
  const MAX_ATTEMPTS = 2   // stop after 2 failed tries — WS is optional

  const connect = useCallback(() => {
    if (!deviceId) return
    if (attemptsRef.current >= MAX_ATTEMPTS) return   // give up silently

    try {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const host  = import.meta.env.VITE_WS_HOST || 'localhost:8000'
      const ws    = new WebSocket(`${proto}://${host}/ws/${deviceId}`)

      ws.onopen = () => {
        setConnected(true)
        attemptsRef.current = 0
      }
      ws.onmessage = (e) => {
        try { setLastEvent(JSON.parse(e.data)) } catch {}
      }
      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
      }
      ws.onerror = () => {
        attemptsRef.current++
        ws.close()
      }
      wsRef.current = ws
    } catch {
      // WS not available — silently skip (app works fine without it)
    }
  }, [deviceId])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  return { connected, lastEvent, send }
}
