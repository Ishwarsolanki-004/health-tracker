// sw.js — VitalTrack Service Worker
// Background step counting + auto-save + notifications

const CACHE = 'vitaltrack-v4'
const CORE  = ['/', '/index.html', '/manifest.json']

// ── Step counter state (persists in SW memory) ───────────────
let stepCount    = 0
let lastMag      = null
let lastStepTime = 0
let deviceId     = null
let autoSaveTimer= null
const STEP_THRESHOLD = 10
const MIN_STEP_GAP   = 300   // ms between steps

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)))
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch: cache assets, pass-through API ───────────────────
self.addEventListener('fetch', e => {
  if (new URL(e.request.url).pathname.startsWith('/api')) return
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res?.status === 200 && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        }
        return res
      }).catch(() => caches.match('/index.html'))
    })
  )
})

// ── Messages from app ────────────────────────────────────────
self.addEventListener('message', async e => {
  const { type, data } = e.data || {}

  switch (type) {

    // App sends device_id on startup
    case 'INIT':
      deviceId  = data.deviceId
      stepCount = data.savedSteps || 0
      console.log('[SW] Initialized. device_id:', deviceId, 'steps:', stepCount)
      break

    // Step detected in foreground — sync to SW
    case 'STEP_UPDATE':
      stepCount = data.steps
      scheduleAutoSave()
      break

    // Reset steps
    case 'RESET_STEPS':
      stepCount = 0
      lastMag   = null
      clearTimeout(autoSaveTimer)
      break

    // App requests current step count
    case 'GET_STEPS':
      e.source?.postMessage({ type: 'STEPS_RESPONSE', steps: stepCount })
      break

    // Reminders
    case 'SCHEDULE_REMINDERS':
      scheduleReminders(data?.reminders || [])
      break

    case 'SKIP_WAITING':
      self.skipWaiting()
      break
  }
})

// ── Auto-save steps to backend every 60 seconds ─────────────
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => autoSaveSteps(), 60000)
}

async function autoSaveSteps() {
  if (!deviceId || stepCount < 1) return
  const today = new Date().toISOString().split('T')[0]

  try {
    // POST to backend — upsert today's step activity
    await fetch('/api/activities/steps-auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        steps:     stepCount,
        date:      today,
        type:      'Walking',
        duration:  Math.round(stepCount / 100),  // rough estimate
        calories:  Math.round(stepCount * 0.04), // ~0.04 kcal per step
      })
    })
    console.log('[SW] Auto-saved steps:', stepCount)

    // Notify app
    const clients = await self.clients.matchAll({ includeUncontrolled: true })
    clients.forEach(c => c.postMessage({ type: 'STEPS_SAVED', steps: stepCount, date: today }))

  } catch (err) {
    console.log('[SW] Auto-save failed (offline?):', err.message)
  }
}

// ── Notification click ───────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'snooze') {
    setTimeout(() => {
      self.registration.showNotification(e.notification.title, {
        body: e.notification.body, icon: '/icon-192.png', tag: 'snooze'
      })
    }, 10 * 60 * 1000)
    return
  }
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) {
        if (c.url.includes(self.location.origin)) { c.focus(); return }
      }
      clients.openWindow('/')
    })
  )
})

// ── Push ─────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'VitalTrack', body: 'Health reminder!' }
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-192.png',
      vibrate: [200, 100, 200],
      tag:     data.tag || 'vitaltrack',
      actions: [
        { action: 'open',   title: '✅ Open App' },
        { action: 'snooze', title: '⏰ Snooze 10m' }
      ]
    })
  )
})

function scheduleReminders(reminders) {
  // Reminders are handled by app when open; SW handles when closed
  console.log('[SW] Reminders registered:', reminders.length)
}
