// hooks/usePWA.js — PWA registration, install prompt, SW communication

import { useState, useEffect, useRef } from 'react'

export function usePWA() {
  const [swReady,       setSwReady]       = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed,     setInstalled]     = useState(false)
  const [updateReady,   setUpdateReady]   = useState(false)
  const swRef = useRef(null)

  // Register Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        swRef.current = reg
        setSwReady(true)
        console.log('✅ Service Worker registered')

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true)
            }
          })
        })
      })
      .catch(err => console.error('SW registration failed:', err))

    // Listen for SW messages
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'REMINDERS_SCHEDULED') {
        console.log(`✅ ${e.data.count} reminders scheduled in SW`)
      }
    })

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
    }
  }, [])

  // Capture install prompt (Chrome/Edge/Android)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setInstallPrompt(null) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Install app
  const installApp = async () => {
    if (!installPrompt) return false
    const result = await installPrompt.prompt()
    if (result.outcome === 'accepted') {
      setInstalled(true)
      setInstallPrompt(null)
      return true
    }
    return false
  }

  // Send reminders to Service Worker (so it works when tab is hidden)
  const syncRemindersToSW = (reminders) => {
    if (!swReady || !navigator.serviceWorker.controller) return
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_REMINDERS',
      reminders
    })
  }

  // Apply SW update
  const applyUpdate = () => {
    swRef.current?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }

  return { swReady, installPrompt, installed, updateReady, installApp, syncRemindersToSW, applyUpdate }
}
