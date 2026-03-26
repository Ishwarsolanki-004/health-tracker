import { useState, useEffect, useRef, useCallback } from 'react'

const THRESHOLD   = 8
const MIN_GAP_MS  = 250
const STORAGE_KEY = 'vt_steps_today'
const DATE_KEY    = 'vt_steps_date'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getSavedSteps() {
  const date  = localStorage.getItem(DATE_KEY)
  const steps = localStorage.getItem(STORAGE_KEY)
  return date === todayStr() ? Number(steps || 0) : 0
}

export function useStepCounter(deviceId) {
  const [steps,     setSteps]     = useState(getSavedSteps)
  const [active,    setActive]    = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [hasPermission, setHasPermission] = useState(false)

  const stepRef     = useRef(getSavedSteps())
  const lastMagRef  = useRef(null)
  const lastTimeRef = useRef(0)
  const saveTimerRef= useRef(null)
  const listeningRef= useRef(false)

  // Reset daily
  useEffect(() => {
    if (localStorage.getItem(DATE_KEY) !== todayStr()) {
      stepRef.current = 0
      setSteps(0)
      localStorage.setItem(DATE_KEY, todayStr())
      localStorage.setItem(STORAGE_KEY, '0')
    }
  }, [])

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity || e.acceleration
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
        localStorage.setItem(STORAGE_KEY, String(stepRef.current))
        localStorage.setItem(DATE_KEY, todayStr())
        // Debounced backend save
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveToBackend(), 30000)
      }
    }
    lastMagRef.current = mag
  }, [])

  const startListening = useCallback(() => {
    if (listeningRef.current) return
    window.addEventListener('devicemotion', handleMotion, { passive: true })
    listeningRef.current = true
    setHasPermission(true)
  }, [handleMotion])

  // Request iOS permission on user gesture
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const res = await DeviceMotionEvent.requestPermission()
        if (res === 'granted') startListening()
        return res === 'granted'
      } catch { return false }
    } else {
      startListening()
      return true
    }
  }, [startListening])

  // Auto-start on Android/Desktop (no permission needed)
  useEffect(() => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission !== 'function') {
      startListening()
    }
    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      clearTimeout(saveTimerRef.current)
    }
  }, [startListening, handleMotion])

  const saveToBackend = useCallback(async () => {
    if (!deviceId || stepRef.current < 1) return
    try {
      await fetch('/api/activities/steps-auto', {
        method: 'POST',
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
      setLastSaved(new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}))
    } catch {}
  }, [deviceId])

  // Auto-save every 60s
  useEffect(() => {
    if (!deviceId) return
    const t = setInterval(saveToBackend, 60000)
    return () => clearInterval(t)
  }, [deviceId, saveToBackend])

  const reset = useCallback(() => {
    stepRef.current = 0; lastMagRef.current = null
    setSteps(0); setActive(false)
    localStorage.setItem(STORAGE_KEY, '0')
    localStorage.setItem(DATE_KEY, todayStr())
  }, [])

  const forceSave = useCallback(() => saveToBackend(), [saveToBackend])

  return { steps, active, lastSaved, hasPermission, requestPermission, reset, forceSave }
}
