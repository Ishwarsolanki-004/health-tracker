// hooks/useUser.js — Multi-user management without login
// Each browser gets a unique device_id (UUID) stored in localStorage

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function useUser() {
  const [currentUser,  setCurrentUser]  = useState(null)
  const [allUsers,     setAllUsers]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showSwitcher, setShowSwitcher] = useState(false)

  // Get or create device_id for this browser
  const getDeviceId = () => {
    let id = localStorage.getItem('vt_device_id')
    if (!id) { id = generateUUID(); localStorage.setItem('vt_device_id', id) }
    return id
  }

  const loadUser = useCallback(async () => {
    const deviceId = getDeviceId()
    try {
      const res = await api.post('/users/', { device_id: deviceId, name: 'User' })
      setCurrentUser(res.data)
    } catch (e) {
      console.error('Failed to load user:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAllUsers = useCallback(async () => {
    try {
      const res = await api.get('/users/')
      setAllUsers(res.data)
    } catch {}
  }, [])

  useEffect(() => { loadUser(); loadAllUsers() }, [])

  const switchUser = useCallback((deviceId) => {
    localStorage.setItem('vt_device_id', deviceId)
    window.location.reload()
  }, [])

  const createNewUser = useCallback(async (name, avatar = '👤') => {
    const newId = generateUUID()
    await api.post('/users/', { device_id: newId, name, avatar })
    localStorage.setItem('vt_device_id', newId)
    window.location.reload()
  }, [])

  const updateUser = useCallback(async (updates) => {
    if (!currentUser) return
    const res = await api.put(`/users/${currentUser.device_id}`, updates)
    setCurrentUser(res.data)
  }, [currentUser])

  const deleteUser = useCallback(async (deviceId) => {
    await api.delete(`/users/${deviceId}`)
    if (currentUser?.device_id === deviceId) {
      localStorage.removeItem('vt_device_id')
      window.location.reload()
    } else {
      loadAllUsers()
    }
  }, [currentUser, loadAllUsers])

  const deviceId = getDeviceId()

  return {
    currentUser, allUsers, loading, showSwitcher,
    setShowSwitcher, switchUser, createNewUser,
    updateUser, deleteUser, deviceId, reload: loadUser
  }
}
