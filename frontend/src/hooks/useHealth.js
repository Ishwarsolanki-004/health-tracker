// hooks/useHealth.js — Custom React hooks for all health data

import { useState, useEffect, useCallback } from 'react'
import * as api from '../api/api'

const today = new Date().toISOString().split('T')[0]

export function useActivities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setActivities(await api.getActivities()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (data) => { await api.createActivity(data); load() }
  const remove = async (id) => { await api.deleteActivity(id); load() }

  return { activities, loading, add, remove, reload: load }
}

export function useNutrition() {
  const [nutrition, setNutrition] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await api.getNutrition()
      setNutrition(Array.isArray(data) ? data : [])
    }
    catch (e) { console.error(e); setNutrition([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (data) => { await api.createNutrition(data); load() }
  const remove = async (id) => { await api.deleteNutrition(id); load() }

  return { nutrition, loading, add, remove }
}

export function useSleep() {
  const [sleepLogs, setSleepLogs] = useState([])

  const load = useCallback(async () => {
    try { setSleepLogs(await api.getSleep()) }
    catch (e) { console.error(e) }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (data) => { await api.createSleep(data); load() }
  const remove = async (id) => { await api.deleteSleep(id); load() }

  return { sleepLogs, add, remove }
}

export function useWater() {
  const [waterToday, setWaterToday] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await api.getWater(today)
      setWaterToday(res?.amount || 0)
    } catch { setWaterToday(0) }
  }, [])

  useEffect(() => { load() }, [load])

  const add = async (amount) => {
    const res = await api.addWater(today, amount)
    setWaterToday(res.amount)
  }

  return { waterToday, add, reload: load }
}

export function useGoals() {
  const [goals, setGoals] = useState({ steps:10000, calories:2000, water:8, sleep:8, exercise:45 })

  useEffect(() => {
    api.getGoals().then(setGoals).catch(console.error)
  }, [])

  const update = async (data) => {
    const res = await api.updateGoals(data)
    setGoals(res)
  }

  return { goals, update }
}

export function useProfile() {
  const [profile, setProfile] = useState({ name:'User', age:25, weight:70, height:170, bmi:null })

  useEffect(() => {
    api.getProfile().then(setProfile).catch(console.error)
  }, [])

  const update = async (data) => {
    const res = await api.updateProfile(data)
    setProfile(res)
  }

  return { profile, update }
}


export function useReminders() {
  const [reminders, setReminders] = useState([])

  const load = useCallback(async () => {
    try {
      const data = await api.getReminders()
      setReminders(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e); setReminders([]) }
  }, [])

  useEffect(() => { load() }, [load])

  // Browser Notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Check reminders every minute and fire browser notification
  useEffect(() => {
    const check = () => {
      const now    = new Date()
      const hhmm   = now.toTimeString().slice(0, 5)           // "HH:MM"
      const dayMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
      const today  = dayMap[now.getDay()]

      reminders.forEach(r => {
        if (!r.is_active) return
        if (r.time !== hhmm) return
        const days = r.days ? r.days.split(',') : []
        if (!days.includes(today)) return

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⏰ ${r.title}`, {
            body: r.message || 'VitalTrack Pro reminder!',
            icon: '⚡',
          })
        }
      })
    }

    const interval = setInterval(check, 60000)  // every 60s
    check()                                       // also check immediately
    return () => clearInterval(interval)
  }, [reminders])

  const add    = async (data) => { await api.createReminder(data);  load() }
  const update = async (id, data) => { await api.updateReminder(id, data); load() }
  const toggle = async (id) => { await api.toggleReminder(id); load() }
  const remove = async (id) => { await api.deleteReminder(id);  load() }

  return { reminders, add, update, toggle, remove }
}
