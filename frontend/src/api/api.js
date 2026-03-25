// api/api.js — All API calls to FastAPI backend

import axios from 'axios'

const BASE = '/api'
const api  = axios.create({ baseURL: BASE })

// ── Activities ───────────────────────────────────────────────
export const getActivities  = (date) => api.get('/activities', { params: date ? { date } : {} }).then(r => r.data)
export const createActivity = (data) => api.post('/activities', data).then(r => r.data)
export const deleteActivity = (id)   => api.delete(`/activities/${id}`).then(r => r.data)

// ── Nutrition ────────────────────────────────────────────────
export const getNutrition    = (date) => api.get('/nutrition', { params: date ? { date } : {} }).then(r => r.data)
export const createNutrition = (data) => api.post('/nutrition', data).then(r => r.data)
export const deleteNutrition = (id)   => api.delete(`/nutrition/${id}`).then(r => r.data)

// ── Sleep ────────────────────────────────────────────────────
export const getSleep    = ()     => api.get('/sleep').then(r => r.data)
export const createSleep = (data) => api.post('/sleep', data).then(r => r.data)
export const deleteSleep = (id)   => api.delete(`/sleep/${id}`).then(r => r.data)

// ── Water ────────────────────────────────────────────────────
export const getWater  = (date)         => api.get(`/water/${date}`).then(r => r.data)
export const addWater  = (date, amount) => api.post('/water/add', null, { params: { date, amount } }).then(r => r.data)
export const setWater  = (data)         => api.post('/water', data).then(r => r.data)

// ── Goals ────────────────────────────────────────────────────
export const getGoals    = ()     => api.get('/goals').then(r => r.data)
export const updateGoals = (data) => api.put('/goals', data).then(r => r.data)

// ── Profile ──────────────────────────────────────────────────
export const getProfile    = ()     => api.get('/profile').then(r => r.data)
export const updateProfile = (data) => api.put('/profile', data).then(r => r.data)

// ── ML Endpoints ─────────────────────────────────────────────
/**
 * Full ML analysis — health score, predictions, anomalies,
 * calorie model, and recommendations.
 * @param {number} days - how many days of history to analyze (default 14)
 */
export const getMLInsights   = (days = 14) => api.get('/ml/insights', { params: { days } }).then(r => r.data)
export const getHealthScore  = ()          => api.get('/ml/health-score').then(r => r.data)
export const getPredictions  = (days = 14) => api.get('/ml/predictions', { params: { days } }).then(r => r.data)
export const getAnomalies    = ()          => api.get('/ml/anomalies').then(r => r.data)
