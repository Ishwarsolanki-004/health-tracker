// hooks/useSensors.js — Mobile sensor integration
// Accelerometer for step counting, no external library needed

import { useState, useEffect, useRef, useCallback } from 'react'

// MET values (Metabolic Equivalent) per activity
// Calories = MET × weight(kg) × duration(hours)
export const ACTIVITY_MET = {
  Walking:    3.5,
  Running:    9.8,
  Cycling:    7.5,
  Swimming:   8.0,
  Yoga:       3.0,
  Gym:        6.0,
  HIIT:      12.0,
  Meditation: 1.5,
  Sports:     8.0,
  Other:      5.0,
}

// Auto-calculate calories burned
export function calcCalories(activityType, durationMinutes, weightKg = 70) {
  const met = ACTIVITY_MET[activityType] || 5.0
  const hours = durationMinutes / 60
  return Math.round(met * weightKg * hours)
}

// Rough steps estimate from duration
export const STEPS_PER_MIN = {
  Walking:    100,
  Running:    160,
  Cycling:    0,
  Swimming:   0,
  Yoga:       0,
  Gym:        30,
  HIIT:       120,
  Meditation: 0,
  Sports:     90,
  Other:      60,
}

export function calcSteps(activityType, durationMinutes) {
  return (STEPS_PER_MIN[activityType] || 0) * durationMinutes
}

// ── STEP COUNTER via Accelerometer ──────────────────────────
export function useStepCounter() {
  const [steps, setSteps]         = useState(0)
  const [active, setActive]       = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError]         = useState(null)

  const lastMag      = useRef(0)
  const stepBuffer   = useRef([])
  const lastStepTime = useRef(0)
  const sensorRef    = useRef(null)

  useEffect(() => {
    // Check if DeviceMotion is available (mobile browsers)
    if (typeof DeviceMotionEvent !== 'undefined') {
      setSupported(true)
    }
    return () => stopCounting()
  }, [])

  const startCounting = useCallback(async () => {
    setError(null)
    setSteps(0)

    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission()
        if (permission !== 'granted') {
          setError('Motion permission denied. Allow in browser settings.')
          return
        }
      } catch (e) {
        setError('Could not get motion permission.')
        return
      }
    }

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return

      const magnitude = Math.sqrt(
        (acc.x || 0) ** 2 +
        (acc.y || 0) ** 2 +
        (acc.z || 0) ** 2
      )

      // Smooth with rolling buffer of 5 samples
      stepBuffer.current.push(magnitude)
      if (stepBuffer.current.length > 5) stepBuffer.current.shift()
      const smoothed = stepBuffer.current.reduce((a, b) => a + b, 0) / stepBuffer.current.length

      // Detect step: peak crossing threshold
      const THRESHOLD = 12.5
      const MIN_STEP_INTERVAL = 300 // ms

      const now = Date.now()
      if (
        smoothed > THRESHOLD &&
        lastMag.current <= THRESHOLD &&
        now - lastStepTime.current > MIN_STEP_INTERVAL
      ) {
        setSteps(s => s + 1)
        lastStepTime.current = now
      }
      lastMag.current = smoothed
    }

    window.addEventListener('devicemotion', handleMotion)
    sensorRef.current = handleMotion
    setActive(true)
  }, [])

  const stopCounting = useCallback(() => {
    if (sensorRef.current) {
      window.removeEventListener('devicemotion', sensorRef.current)
      sensorRef.current = null
    }
    setActive(false)
  }, [])

  const reset = useCallback(() => {
    setSteps(0)
    stepBuffer.current = []
    lastStepTime.current = 0
  }, [])

  return { steps, active, supported, error, startCounting, stopCounting, reset }
}

// ── REMINDER SYSTEM ─────────────────────────────────────────
export function useReminders() {
  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ht_reminders') || '[]') } catch { return [] }
  })
  const [permission, setPermission] = useState(Notification?.permission || 'default')
  const timerRefs = useRef({})

  useEffect(() => {
    localStorage.setItem('ht_reminders', JSON.stringify(reminders))
  }, [reminders])

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }

  const scheduleAll = useCallback((rems) => {
    // Clear existing timers
    Object.values(timerRefs.current).forEach(clearTimeout)
    timerRefs.current = {}

    rems.filter(r => r.enabled).forEach(r => {
      const [h, m] = r.time.split(':').map(Number)
      const now = new Date()
      const fire = new Date()
      fire.setHours(h, m, 0, 0)
      if (fire <= now) fire.setDate(fire.getDate() + 1) // next day

      const delay = fire - now
      timerRefs.current[r.id] = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(`⚡ VitalTrack: ${r.title}`, {
            body: r.message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          })
        }
        // Re-schedule for next day
        scheduleAll(rems)
      }, delay)
    })
  }, [])

  useEffect(() => {
    if (permission === 'granted') scheduleAll(reminders)
    return () => Object.values(timerRefs.current).forEach(clearTimeout)
  }, [reminders, permission, scheduleAll])

  const addReminder = (reminder) => {
    const newRem = { ...reminder, id: Date.now(), enabled: true }
    setReminders(prev => [...prev, newRem])
  }

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  return { reminders, permission, requestPermission, addReminder, toggleReminder, deleteReminder }
}
