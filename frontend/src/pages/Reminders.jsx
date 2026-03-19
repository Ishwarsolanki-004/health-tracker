// pages/Reminders.jsx — Smart reminder system with browser notifications

import { useState } from 'react'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'

const PRESET_REMINDERS = [
  { title:'💧 Drink Water',     message:'Time to hydrate! Drink a glass of water.', time:'09:00', category:'hydration' },
  { title:'🏃 Morning Walk',    message:'Start your day with a 30 min walk!',       time:'07:00', category:'exercise' },
  { title:'🍎 Healthy Lunch',   message:'Log your lunch and eat something nutritious!', time:'13:00', category:'nutrition' },
  { title:'🧘 Stretch Break',   message:'Take 5 mins to stretch your body.',         time:'15:00', category:'exercise' },
  { title:'😴 Sleep Reminder',  message:'Wind down — bedtime in 30 minutes!',        time:'22:30', category:'sleep' },
  { title:'💊 Evening Water',   message:"Don't forget your evening water intake!",   time:'18:00', category:'hydration' },
  { title:'📊 Log Today\'s Data', message:'Update your health log before the day ends!', time:'20:00', category:'tracking' },
  { title:'🏋️ Workout Time',   message:'Time to hit the gym or do your workout!',   time:'17:30', category:'exercise' },
]

const CATEGORY_COLORS = {
  hydration: 'var(--green)',
  exercise:  'var(--teal)',
  nutrition: 'var(--orange)',
  sleep:     'var(--violet)',
  tracking:  'var(--blue)',
}

const CATEGORY_ICONS = {
  hydration: '💧',
  exercise:  '🏃',
  nutrition: '🍎',
  sleep:     '😴',
  tracking:  '📊',
}

export default function Reminders({ reminders, permission, requestPermission, addReminder, toggleReminder, deleteReminder, showToast }) {
  const [form, setForm] = useState({ title:'', message:'', time:'08:00', category:'exercise' })
  const [tab, setTab] = useState('list') // 'list' | 'add'
  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  const handlePermission = async () => {
    const result = await requestPermission()
    if (result === 'granted') showToast('✅ Notifications enabled!')
    else showToast('⚠️ Permission denied. Enable in browser settings.')
  }

  const handleAdd = () => {
    if (!form.title || !form.time) { showToast('⚠️ Title & time required!'); return }
    addReminder(form)
    setForm({ title:'', message:'', time:'08:00', category:'exercise' })
    setTab('list')
    showToast('✅ Reminder added!')
  }

  const handlePreset = (preset) => {
    if (permission !== 'granted') {
      showToast('⚠️ Enable notifications first!')
      return
    }
    addReminder({ title:preset.title, message:preset.message, time:preset.time, category:preset.category })
    showToast(`✅ "${preset.title}" added!`)
  }

  const timeUntil = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    const now = new Date()
    const fire = new Date()
    fire.setHours(h, m, 0, 0)
    if (fire <= now) fire.setDate(fire.getDate() + 1)
    const diff = fire - now
    const hrs = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  const enabledCount = reminders.filter(r => r.enabled).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* ── Notification Permission Banner ── */}
      {permission !== 'granted' && (
        <div className="fade-up" style={{
          background:'rgba(251,146,60,0.08)',
          border:'1px solid rgba(251,146,60,0.3)',
          borderRadius:16, padding:'18px 22px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap'
        }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <span style={{ fontSize:32 }}>🔔</span>
            <div>
              <div style={{ fontFamily:'var(--font-head)', color:'var(--orange)', fontWeight:700, fontSize:14 }}>
                Enable Notifications
              </div>
              <div style={{ color:'var(--muted2)', fontSize:12, marginTop:3 }}>
                Reminders ko kaam karne ke liye browser notifications allow karo
              </div>
            </div>
          </div>
          <Btn onClick={handlePermission} color="var(--orange)" icon="🔔">Allow Notifications</Btn>
        </div>
      )}

      {permission === 'granted' && (
        <div className="glass fade-up" style={{
          padding:'16px 22px', display:'flex', gap:20, alignItems:'center',
          borderTop:'1px solid rgba(16,185,129,0.3)'
        }}>
          <span style={{ fontSize:24 }}>✅</span>
          <div>
            <div style={{ color:'var(--green)', fontFamily:'var(--font-head)', fontWeight:700 }}>Notifications Active</div>
            <div style={{ color:'var(--muted)', fontSize:12 }}>{enabledCount} reminder{enabledCount!==1?'s':''} scheduled</div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:12 }}>
            <button onClick={() => setTab('list')} style={{
              background: tab==='list'?'rgba(0,255,231,0.12)':'rgba(255,255,255,0.03)',
              border:`1px solid ${tab==='list'?'rgba(0,255,231,0.3)':'rgba(255,255,255,0.07)'}`,
              color: tab==='list'?'var(--teal)':'var(--muted)',
              borderRadius:10, padding:'8px 16px', cursor:'pointer',
              fontFamily:'var(--font-head)', fontSize:11
            }}>📋 My Reminders</button>
            <button onClick={() => setTab('add')} style={{
              background: tab==='add'?'rgba(0,255,231,0.12)':'rgba(255,255,255,0.03)',
              border:`1px solid ${tab==='add'?'rgba(0,255,231,0.3)':'rgba(255,255,255,0.07)'}`,
              color: tab==='add'?'var(--teal)':'var(--muted)',
              borderRadius:10, padding:'8px 16px', cursor:'pointer',
              fontFamily:'var(--font-head)', fontSize:11
            }}>➕ Add New</button>
          </div>
        </div>
      )}

      {/* ── Preset Reminders ── */}
      <div className="glass fade-up delay-1" style={{ padding:24 }}>
        <SectionTitle icon="⚡" color="var(--teal)">Quick Add Presets</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {PRESET_REMINDERS.map((p, i) => {
            const color = CATEGORY_COLORS[p.category]
            const already = reminders.some(r => r.title === p.title)
            return (
              <button key={i} onClick={() => !already && handlePreset(p)} style={{
                background: already ? 'rgba(255,255,255,0.02)' : `${color}08`,
                border: `1px solid ${already ? 'rgba(255,255,255,0.06)' : color+'30'}`,
                borderRadius:14, padding:'14px 16px', cursor: already ? 'default' : 'pointer',
                display:'flex', alignItems:'center', gap:12, textAlign:'left',
                transition:'all 0.2s', opacity: already ? 0.5 : 1
              }}
                onMouseOver={e => !already && (e.currentTarget.style.background = `${color}14`)}
                onMouseOut={e => !already && (e.currentTarget.style.background = `${color}08`)}
              >
                <div style={{
                  width:38, height:38, borderRadius:10,
                  background:`${color}18`, border:`1px solid ${color}30`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0
                }}>{CATEGORY_ICONS[p.category]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color: already ? 'var(--muted)' : color, fontFamily:'var(--font-head)', fontSize:12, fontWeight:700 }}>
                    {p.title} {already && '✓'}
                  </div>
                  <div style={{ color:'var(--muted)', fontSize:11, marginTop:2 }}>{p.time} · {p.message.slice(0,32)}...</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Add Custom Reminder ── */}
      {(tab === 'add' || permission !== 'granted') && (
        <div className="glass fade-up delay-2" style={{ padding:28 }}>
          <SectionTitle icon="➕" color="var(--blue)">Custom Reminder</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <GlassInput label="Title" value={form.title} onChange={f('title')} placeholder="e.g. Drink Water 💧" style={{ gridColumn:'span 2' }} />
            <GlassInput label="Message" value={form.message} onChange={f('message')} placeholder="Reminder message..." style={{ gridColumn:'span 2' }} />
            <GlassInput label="Time" type="time" value={form.time} onChange={f('time')} />
            <GlassSelect label="Category" value={form.category} onChange={f('category')}
              options={['exercise','hydration','nutrition','sleep','tracking']} />
          </div>
          <div style={{ marginTop:20 }}>
            <Btn onClick={handleAdd} color="var(--blue)" icon="🔔">Add Reminder</Btn>
          </div>
        </div>
      )}

      {/* ── My Reminders List ── */}
      {(tab === 'list' || reminders.length > 0) && (
        <div className="glass fade-up delay-3" style={{ padding:24 }}>
          <SectionTitle icon="📋" color="var(--muted2)">My Reminders ({reminders.length})</SectionTitle>
          {reminders.length === 0 ? (
            <div style={{ color:'var(--muted)', textAlign:'center', padding:40, fontFamily:'var(--font-head)', letterSpacing:2, fontSize:12 }}>
              NO REMINDERS YET · ADD FROM PRESETS ABOVE
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {reminders.map(r => {
                const color = CATEGORY_COLORS[r.category] || 'var(--teal)'
                return (
                  <div key={r.id} style={{
                    display:'flex', alignItems:'center', gap:14,
                    background: r.enabled ? `${color}06` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${r.enabled ? color+'25' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius:14, padding:'14px 18px',
                    opacity: r.enabled ? 1 : 0.5, transition:'all 0.3s'
                  }}>
                    {/* Toggle switch */}
                    <div onClick={() => toggleReminder(r.id)} style={{
                      width:42, height:24, borderRadius:999, cursor:'pointer',
                      background: r.enabled ? color : 'rgba(255,255,255,0.1)',
                      position:'relative', transition:'background 0.3s', flexShrink:0,
                      boxShadow: r.enabled ? `0 0 12px ${color}66` : 'none'
                    }}>
                      <div style={{
                        position:'absolute', top:3, width:18, height:18, borderRadius:'50%',
                        background:'#fff', transition:'left 0.3s',
                        left: r.enabled ? 21 : 3
                      }}/>
                    </div>

                    {/* Icon */}
                    <div style={{
                      width:36, height:36, borderRadius:10,
                      background:`${color}18`, border:`1px solid ${color}30`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, flexShrink:0
                    }}>{CATEGORY_ICONS[r.category]||'🔔'}</div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:700, fontFamily:'var(--font-head)', fontSize:13 }}>{r.title}</span>
                        <Badge color={color}>{r.category}</Badge>
                      </div>
                      <div style={{ color:'var(--muted)', fontSize:12, marginTop:3 }}>{r.message}</div>
                    </div>

                    {/* Time + countdown */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ color, fontFamily:'var(--font-head)', fontWeight:800, fontSize:16 }}>{r.time}</div>
                      {r.enabled && (
                        <div style={{ color:'var(--muted)', fontSize:10, marginTop:2 }}>in {timeUntil(r.time)}</div>
                      )}
                    </div>

                    {/* Delete */}
                    <button onClick={() => deleteReminder(r.id)} style={{
                      background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                      color:'#ef4444', cursor:'pointer', borderRadius:8,
                      width:28, height:28, display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:13, flexShrink:0
                    }}>✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
