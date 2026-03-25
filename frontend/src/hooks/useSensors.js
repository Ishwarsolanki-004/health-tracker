// hooks/useSensors.js
// ALL sensors: Mobile (Accelerometer, Gyro) + Laptop (Battery, Camera, Mic, Network, Geolocation, Ambient Light)

import { useState, useEffect, useRef, useCallback } from 'react'

// ── MET & Calorie Tables ─────────────────────────────────────
export const ACTIVITY_MET = {
  Walking:3.5, Running:9.8, Cycling:7.5, Swimming:8.0,
  Yoga:3.0, Gym:6.0, HIIT:12.0, Meditation:1.5, Sports:8.0, Other:5.0
}
export const STEPS_PER_MIN = {
  Walking:100, Running:160, Cycling:0, Swimming:0, Yoga:0,
  Gym:30, HIIT:120, Meditation:0, Sports:90, Other:60
}
export const calcCalories = (type, mins, kg=70) =>
  Math.round((ACTIVITY_MET[type]||5) * kg * (mins/60))
export const calcSteps = (type, mins) =>
  (STEPS_PER_MIN[type]||0) * mins

// ─────────────────────────────────────────────────────────────
// 1. STEP COUNTER — DeviceMotion (Mobile accelerometer)
// ─────────────────────────────────────────────────────────────
export function useStepCounter() {
  const [steps,     setSteps]     = useState(0)
  const [active,    setActive]    = useState(false)
  const [supported, setSupported] = useState(false)
  const [error,     setError]     = useState(null)
  const lastMag      = useRef(0)
  const stepBuffer   = useRef([])
  const lastStepTime = useRef(0)
  const handlerRef   = useRef(null)

  useEffect(() => {
    setSupported(typeof DeviceMotionEvent !== 'undefined')
    return () => { if (handlerRef.current) window.removeEventListener('devicemotion', handlerRef.current) }
  }, [])

  const startCounting = useCallback(async () => {
    setError(null); setSteps(0); stepBuffer.current = []; lastStepTime.current = 0
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      const p = await DeviceMotionEvent.requestPermission().catch(() => 'denied')
      if (p !== 'granted') { setError('Motion permission denied. iOS Settings > Safari > Motion & Orientation Access ON karo.'); return }
    }
    const handler = (e) => {
      const a = e.accelerationIncludingGravity; if (!a) return
      const mag = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2)
      stepBuffer.current.push(mag)
      if (stepBuffer.current.length > 6) stepBuffer.current.shift()
      const smooth = stepBuffer.current.reduce((s,v)=>s+v,0) / stepBuffer.current.length
      const now = Date.now()
      if (smooth > 12.5 && lastMag.current <= 12.5 && now - lastStepTime.current > 280) {
        setSteps(s => s+1); lastStepTime.current = now
      }
      lastMag.current = smooth
    }
    window.addEventListener('devicemotion', handler)
    handlerRef.current = handler; setActive(true)
  }, [])

  const stopCounting = useCallback(() => {
    if (handlerRef.current) { window.removeEventListener('devicemotion', handlerRef.current); handlerRef.current = null }
    setActive(false)
  }, [])

  const reset = useCallback(() => { setSteps(0); stepBuffer.current = []; lastStepTime.current = 0 }, [])
  return { steps, active, supported, error, startCounting, stopCounting, reset }
}

// ─────────────────────────────────────────────────────────────
// 2. GYROSCOPE — DeviceOrientation (Mobile tilt/rotation)
// ─────────────────────────────────────────────────────────────
export function useGyroscope() {
  const [data,      setData]      = useState({ alpha:0, beta:0, gamma:0 })
  const [active,    setActive]    = useState(false)
  const [supported, setSupported] = useState(false)
  const handlerRef = useRef(null)

  useEffect(() => {
    setSupported(typeof DeviceOrientationEvent !== 'undefined')
    return () => { if (handlerRef.current) window.removeEventListener('deviceorientation', handlerRef.current) }
  }, [])

  const start = useCallback(async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      const p = await DeviceOrientationEvent.requestPermission().catch(() => 'denied')
      if (p !== 'granted') return
    }
    const h = (e) => setData({ alpha: +(e.alpha||0).toFixed(1), beta: +(e.beta||0).toFixed(1), gamma: +(e.gamma||0).toFixed(1) })
    window.addEventListener('deviceorientation', h)
    handlerRef.current = h; setActive(true)
  }, [])

  const stop = useCallback(() => {
    if (handlerRef.current) { window.removeEventListener('deviceorientation', handlerRef.current); handlerRef.current = null }
    setActive(false)
  }, [])

  return { data, active, supported, start, stop }
}

// ─────────────────────────────────────────────────────────────
// 3. BATTERY — Battery API (Laptop + some Android)
// ─────────────────────────────────────────────────────────────
export function useBattery() {
  const [battery,   setBattery]   = useState(null)
  const [supported, setSupported] = useState(false)
  const battRef = useRef(null)

  useEffect(() => {
    if (!navigator.getBattery) { setSupported(false); return }
    setSupported(true)
    navigator.getBattery().then(bat => {
      battRef.current = bat
      const update = () => setBattery({
        level:    Math.round(bat.level * 100),
        charging: bat.charging,
        chargingTime:    bat.chargingTime === Infinity ? null : Math.round(bat.chargingTime/60),
        dischargingTime: bat.dischargingTime === Infinity ? null : Math.round(bat.dischargingTime/60),
      })
      update()
      bat.addEventListener('levelchange',       update)
      bat.addEventListener('chargingchange',    update)
      bat.addEventListener('chargingtimechange',update)
      bat.addEventListener('dischargingtimechange', update)
    }).catch(() => setSupported(false))
    return () => {
      if (battRef.current) {
        ['levelchange','chargingchange','chargingtimechange','dischargingtimechange']
          .forEach(e => battRef.current.removeEventListener(e, () => {}))
      }
    }
  }, [])

  return { battery, supported }
}

// ─────────────────────────────────────────────────────────────
// 4. GEOLOCATION — GPS (Mobile + Laptop WiFi-based)
// ─────────────────────────────────────────────────────────────
export function useGeolocation() {
  const [location,  setLocation]  = useState(null)
  const [error,     setError]     = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [supported, setSupported] = useState('geolocation' in navigator)
  const watchRef = useRef(null)

  const getOnce = useCallback(() => {
    if (!supported) { setError('Geolocation not supported'); return }
    setLoading(true); setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat:      pos.coords.latitude.toFixed(5),
          lng:      pos.coords.longitude.toFixed(5),
          accuracy: Math.round(pos.coords.accuracy),
          altitude: pos.coords.altitude ? pos.coords.altitude.toFixed(1) : null,
          speed:    pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : null, // m/s → km/h
        })
        setLoading(false)
      },
      (err) => { setError(err.message); setLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [supported])

  const startTracking = useCallback(() => {
    if (!supported) return
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => setLocation({
        lat:      pos.coords.latitude.toFixed(5),
        lng:      pos.coords.longitude.toFixed(5),
        accuracy: Math.round(pos.coords.accuracy),
        speed:    pos.coords.speed ? (pos.coords.speed * 3.6).toFixed(1) : '0',
      }),
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    )
  }, [supported])

  const stopTracking = useCallback(() => {
    if (watchRef.current) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null }
  }, [])

  useEffect(() => () => stopTracking(), [stopTracking])
  return { location, error, loading, supported, getOnce, startTracking, stopTracking }
}

// ─────────────────────────────────────────────────────────────
// 5. NETWORK — Connection API (speed, type, online status)
// ─────────────────────────────────────────────────────────────
export function useNetwork() {
  const getInfo = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    return {
      online:      navigator.onLine,
      type:        conn?.type        || 'unknown',
      effectiveType: conn?.effectiveType || 'unknown',
      downlink:    conn?.downlink    || null,   // Mbps
      rtt:         conn?.rtt         || null,   // ms
      saveData:    conn?.saveData    || false,
    }
  }
  const [network, setNetwork] = useState(getInfo)

  useEffect(() => {
    const update = () => setNetwork(getInfo())
    window.addEventListener('online',  update)
    window.addEventListener('offline', update)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    conn?.addEventListener('change', update)
    return () => {
      window.removeEventListener('online',  update)
      window.removeEventListener('offline', update)
      conn?.removeEventListener('change', update)
    }
  }, [])

  return network
}

// ─────────────────────────────────────────────────────────────
// 6. CAMERA + MIC — MediaDevices (enumerate, test)
// ─────────────────────────────────────────────────────────────
export function useMediaDevices() {
  const [devices,   setDevices]   = useState([])
  const [camOn,     setCamOn]     = useState(false)
  const [micLevel,  setMicLevel]  = useState(0)
  const [micOn,     setMicOn]     = useState(false)
  const [error,     setError]     = useState(null)
  const streamRef   = useRef(null)
  const analyserRef = useRef(null)
  const animRef     = useRef(null)

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devs => setDevices(devs)).catch(()=>{})
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true })
      streamRef.current = stream; setCamOn(true); setError(null)
      return stream
    } catch(e) { setError('Camera: ' + e.message) }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getVideoTracks().forEach(t => t.stop())
    setCamOn(false)
  }, [])

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true })
      const ctx    = new AudioContext()
      const src    = ctx.createMediaStreamSource(stream)
      const anal   = ctx.createAnalyser()
      anal.fftSize = 256
      src.connect(anal)
      analyserRef.current = anal
      streamRef.current   = stream
      setMicOn(true); setError(null)
      const tick = () => {
        const buf = new Uint8Array(anal.frequencyBinCount)
        anal.getByteFrequencyData(buf)
        const avg = buf.reduce((s,v)=>s+v,0)/buf.length
        setMicLevel(Math.round(avg))
        animRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch(e) { setError('Mic: ' + e.message) }
  }, [])

  const stopMic = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getAudioTracks().forEach(t => t.stop())
    setMicOn(false); setMicLevel(0)
  }, [])

  const cameras = devices.filter(d => d.kind === 'videoinput')
  const mics    = devices.filter(d => d.kind === 'audioinput')

  return { cameras, mics, camOn, micOn, micLevel, error, startCamera, stopCamera, startMic, stopMic }
}

// ─────────────────────────────────────────────────────────────
// 7. AMBIENT LIGHT — AmbientLightSensor API (experimental, Chrome/Edge)
// ─────────────────────────────────────────────────────────────
export function useAmbientLight() {
  const [lux,       setLux]       = useState(null)
  const [supported, setSupported] = useState(false)
  const sensorRef = useRef(null)

  useEffect(() => {
    if (!('AmbientLightSensor' in window)) { setSupported(false); return }
    setSupported(true)
    try {
      const sensor = new window.AmbientLightSensor()
      sensor.addEventListener('reading', () => setLux(Math.round(sensor.illuminance)))
      sensor.addEventListener('error',   () => setSupported(false))
      sensor.start()
      sensorRef.current = sensor
    } catch { setSupported(false) }
    return () => sensorRef.current?.stop()
  }, [])

  const label = lux === null ? '—' : lux < 50 ? 'Dark' : lux < 300 ? 'Dim' : lux < 1000 ? 'Normal' : 'Bright'
  return { lux, supported, label }
}

// ─────────────────────────────────────────────────────────────
// 8. SCREEN — Screen orientation, size, fullscreen
// ─────────────────────────────────────────────────────────────
export function useScreen() {
  const get = () => ({
    width:  window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth,
    orientation: screen.orientation?.type || 'unknown',
    pixelRatio:  window.devicePixelRatio,
    innerW: window.innerWidth,
    innerH: window.innerHeight,
  })
  const [info, setInfo] = useState(get)
  useEffect(() => {
    const u = () => setInfo(get())
    window.addEventListener('resize',  u)
    screen.orientation?.addEventListener('change', u)
    return () => { window.removeEventListener('resize', u); screen.orientation?.removeEventListener('change', u) }
  }, [])
  return info
}

// ─────────────────────────────────────────────────────────────
// 9. REMINDER SYSTEM — with repeat days, snooze, sound
// ─────────────────────────────────────────────────────────────
export function useReminders() {
  const [reminders,  setReminders]  = useState(() => { try { return JSON.parse(localStorage.getItem('ht_reminders')||'[]') } catch { return [] } })
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'default'))
  const timerRefs = useRef({})

  useEffect(() => { localStorage.setItem('ht_reminders', JSON.stringify(reminders)) }, [reminders])

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'unsupported'
    const r = await Notification.requestPermission()
    setPermission(r); return r
  }

  // Play a gentle beep sound via Web Audio API
  const playBeep = useCallback((freq=440, duration=0.3) => {
    try {
      const ctx  = new AudioContext()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(); osc.stop(ctx.currentTime + duration)
    } catch {}
  }, [])

  const fireReminder = useCallback((r) => {
    if (Notification.permission === 'granted') {
      const n = new Notification(`⚡ VitalTrack · ${r.title}`, {
        body:  r.message || 'Time to take action!',
        icon:  '/favicon.ico',
        tag:   `reminder-${r.id}`,
        renotify: true,
      })
      n.onclick = () => window.focus()
    }
    if (r.sound !== false) playBeep(520, 0.4)
  }, [playBeep])

  const scheduleAll = useCallback((rems) => {
    Object.values(timerRefs.current).forEach(clearTimeout)
    timerRefs.current = {}
    const today = new Date().getDay() // 0=Sun..6=Sat

    rems.filter(r => r.enabled).forEach(r => {
      const [h, m] = r.time.split(':').map(Number)
      const now  = new Date()
      const fire = new Date()
      fire.setHours(h, m, 0, 0)

      // Repeat days check
      const days = r.days || [0,1,2,3,4,5,6] // default all days
      let daysAhead = 0
      for (let i = 0; i < 7; i++) {
        const checkDay = (today + i) % 7
        if (days.includes(checkDay)) {
          if (i === 0 && fire > now) { daysAhead = 0; break }
          if (i > 0)                 { daysAhead = i; break }
        }
      }
      fire.setDate(fire.getDate() + daysAhead)
      if (fire <= now) fire.setDate(fire.getDate() + 7) // fallback next week

      const delay = fire - now
      if (delay > 0 && delay < 7 * 24 * 3600 * 1000) {
        timerRefs.current[r.id] = setTimeout(() => {
          fireReminder(r)
          scheduleAll(rems) // reschedule
        }, delay)
      }
    })
  }, [fireReminder])

  useEffect(() => {
    if (permission === 'granted') scheduleAll(reminders)
    return () => Object.values(timerRefs.current).forEach(clearTimeout)
  }, [reminders, permission, scheduleAll])

  const addReminder    = (rem) => setReminders(p => [...p, { ...rem, id:Date.now(), enabled:true, days:rem.days||[0,1,2,3,4,5,6] }])
  const toggleReminder = (id)  => setReminders(p => p.map(r => r.id===id ? { ...r, enabled:!r.enabled } : r))
  const deleteReminder = (id)  => setReminders(p => p.filter(r => r.id!==id))
  const snoozeReminder = (id, mins=10) => {
    const snoozeTime = new Date(Date.now() + mins*60000)
    const hh = String(snoozeTime.getHours()).padStart(2,'0')
    const mm = String(snoozeTime.getMinutes()).padStart(2,'0')
    setReminders(p => p.map(r => r.id===id ? { ...r, time:`${hh}:${mm}` } : r))
  }

  return { reminders, permission, requestPermission, addReminder, toggleReminder, deleteReminder, snoozeReminder, playBeep }
}
