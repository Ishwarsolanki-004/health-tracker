// hooks/useStepCounter.js
// Auto step counting — works in foreground AND background
// No start/stop needed. Steps auto-save every 60s via SW.

import { useState, useEffect, useRef, useCallback } from 'react'

const THRESHOLD    = 10     // motion delta to count as step
const MIN_GAP_MS   = 300    // min ms between steps
const SAVE_EVERY   = 60000  // auto-save every 60 seconds
const STORAGE_KEY  = 'vt_steps_today'
const DATE_KEY     = 'vt_steps_date'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function useStepCounter(deviceId) {
  const [steps,      setSteps]      = useState(() => {
    // Restore from localStorage if same day
    const saved = localStorage.getItem(STORAGE_KEY)
    const date  = localStorage.getItem(DATE_KEY)
    return (date === todayStr() && saved) ? Number(saved) : 0
  })
  const [active,     setActive]     = useState(false)
  const [lastSaved,  setLastSaved]  = useState(null)
  const [permission, setPermission] = useState('unknown')

  const stepRef      = useRef(steps)
  const lastMagRef   = useRef(null)
  const lastTimeRef  = useRef(0)
  const saveTimerRef = useRef(null)

  // Keep ref in sync
  useEffect(() => { stepRef.current = steps }, [steps])

  // Reset if new day
  useEffect(() => {
    const checkDay = setInterval(() => {
      if (localStorage.getItem(DATE_KEY) !== todayStr()) {
        stepRef.current = 0
        setSteps(0)
        localStorage.setItem(DATE_KEY,    todayStr())
        localStorage.setItem(STORAGE_KEY, '0')
      }
    }, 60000)
    return () => clearInterval(checkDay)
  }, [])

  // ── Step detection ────────────────────────────────────────
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity
    if (!acc) return
    const mag = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2)
    const now = Date.now()

    if (lastMagRef.current !== null) {
      const diff = Math.abs(mag - lastMagRef.current)
      if (diff > THRESHOLD && (now - lastTimeRef.current) > MIN_GAP_MS) {
        stepRef.current += 1
        lastTimeRef.current = now
        setSteps(stepRef.current)
        setActive(true)

        // Persist to localStorage immediately
        localStorage.setItem(STORAGE_KEY, String(stepRef.current))
        localStorage.setItem(DATE_KEY,    todayStr())

        // Tell Service Worker
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'STEP_UPDATE',
            data: { steps: stepRef.current }
          })
        }
      }
    }
    lastMagRef.current = mag
  }, [])

  // ── Start listening ───────────────────────────────────────
  useEffect(() => {
    const start = () => {
      window.addEventListener('devicemotion', handleMotion, { passive: true })
      setPermission('granted')
    }

    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      // iOS 13+ needs permission
      DeviceMotionEvent.requestPermission()
        .then(p => { if (p === 'granted') start(); else setPermission('denied') })
        .catch(() => setPermission('denied'))
    } else {
      // Android + Desktop — no permission needed
      start()
    }

    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [handleMotion])

  // ── Auto-save to backend every 60s ───────────────────────
  const saveToBackend = useCallback(async () => {
    if (!deviceId || stepRef.current < 1) return
    try {
      const res = await fetch('/api/activities/steps-auto', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          steps:     stepRef.current,
          date:      todayStr(),
          type:      'Walking',
          duration:  Math.max(1, Math.round(stepRef.current / 100)),
          calories:  Math.max(1, Math.round(stepRef.current * 0.04)),
        })
      })
      if (res.ok) {
        const d = await res.json()
        setLastSaved(new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }))
      }
    } catch {
      // Offline — steps safe in localStorage, will sync later
    }
  }, [deviceId])

  useEffect(() => {
    if (!deviceId) return
    const timer = setInterval(saveToBackend, SAVE_EVERY)
    return () => clearInterval(timer)
  }, [deviceId, saveToBackend])

  // ── Init Service Worker with device_id ───────────────────
  useEffect(() => {
    if (!deviceId) return
    const init = () => {
      navigator.serviceWorker?.controller?.postMessage({
        type: 'INIT',
        data: { deviceId, savedSteps: stepRef.current }
      })
    }
    if (navigator.serviceWorker?.controller) {
      init()
    } else {
      navigator.serviceWorker?.addEventListener('controllerchange', init)
    }
  }, [deviceId])

  // ── Listen for SW save confirmations ─────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'STEPS_SAVED') {
        setLastSaved(new Date().toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' }))
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  const reset = useCallback(() => {
    stepRef.current = 0
    setSteps(0)
    setActive(false)
    lastMagRef.current = null
    localStorage.setItem(STORAGE_KEY, '0')
    localStorage.setItem(DATE_KEY, todayStr())
    navigator.serviceWorker?.controller?.postMessage({ type: 'RESET_STEPS' })
  }, [])

  const forceSave = useCallback(() => saveToBackend(), [saveToBackend])

  return { steps, active, lastSaved, permission, reset, forceSave }
}
