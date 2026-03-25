// hooks/useMLData.js — Fetches ML results from Python FastAPI backend

import { useState, useEffect, useCallback } from 'react'
import { getMLInsights } from '../api/api'

export function useMLData(days = 14) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getMLInsights(days)
      setData(result)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Could not connect to ML backend. Make sure the Python server is running.')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refresh: fetch }
}
