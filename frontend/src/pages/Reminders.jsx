// pages/Reminders.jsx — Full PWA-powered reminder system

import { useState, useEffect } from 'react'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'

const PRESETS = [
  { title:'💧 Morning Water',     message:'Drink a glass of water as soon as you wake up!',            time:'06:30', category:'hydration', days:[0,1,2,3,4,5,6] },
  { title:'🏃 Morning Walk',      message:'Get ready for a 30 min walk!',        time:'07:00', category:'exercise',  days:[1,2,3,4,5] },
  { title:'🌅 Breakfast Log',     message:'Log your breakfast and eat healthy!',      time:'08:30', category:'nutrition', days:[0,1,2,3,4,5,6] },
  { title:'💊 Mid-Morning Water', message:'Time to drink water — take a glass!',         time:'10:30', category:'hydration', days:[0,1,2,3,4,5,6] },
  { title:'☀️ Lunch Reminder',    message:'Eat a healthy lunch and take care.',          time:'13:00', category:'nutrition', days:[0,1,2,3,4,5,6] },
  { title:'🧘 Afternoon Stretch', message:'Do a 5-minute stretch or deep breathing.',     time:'15:00', category:'exercise',  days:[1,2,3,4,5] },
  { title:'💧 Evening Water',     message:'Do not forget the evening water!',                time:'17:00', category:'hydration', days:[0,1,2,3,4,5,6] },
  { title:'🏋️ Gym Time',         message:'It is time to work out - get ready!',   time:'17:30', category:'exercise',  days:[1,3,5] },
  { title:'🌙 Dinner Log',        message:'Track your dinner and see the calories.',     time:'20:00', category:'nutrition', days:[0,1,2,3,4,5,6] },
  { title:'📊 Daily Check',       message:'What is todays activity log?',          time:'21:00', category:'tracking',  days:[0,1,2,3,4,5,6] },
  { title:'😴 Wind Down',         message:'Turn off the screen for sleep!',           time:'22:00', category:'sleep',     days:[0,1,2,3,4,5,6] },
  { title:'🌙 Bedtime',           message:'Sleep on time — 8 hours of sleep is needed!',time:'22:30', category:'sleep',     days:[0,1,2,3,4,5,6] },
]

const CAT_COLOR = { hydration:'var(--green)', exercise:'var(--teal)', nutrition:'var(--orange)', sleep:'var(--violet)', tracking:'var(--blue)' }
const CAT_ICON  = { hydration:'💧', exercise:'🏃', nutrition:'🍽️', sleep:'😴', tracking:'📊' }
const DAY_SHORT = ['S','M','T','W','T','F','S']
const DAY_FULL  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Reminders({
  reminders, permission, requestPermission,
  addReminder, toggleReminder, deleteReminder, snoozeReminder, playBeep,
  syncRemindersToSW, swReady, installPrompt, installed, installApp,
  showToast
}) {
  const [view, setView] = useState('mine')
  const [form, setForm] = useState({
    title:'', message:'', time:'08:00', category:'exercise',
    days:[0,1,2,3,4,5,6], sound:true
  })
  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  const toggleDay = d => setForm(p => ({
    ...p,
    days: p.days.includes(d) ? p.days.filter(x=>x!==d) : [...p.days, d].sort((a,b)=>a-b)
  }))

  // Sync reminders to SW whenever they change
  useEffect(() => {
    if (swReady && syncRemindersToSW) syncRemindersToSW(reminders)
  }, [reminders, swReady])

  const handlePermission = async () => {
    const r = await requestPermission()
    if (r === 'granted') {
      showToast('✅ Notifications ON! Now, even if the app is closed, you will get a reminder.')
      if (swReady && syncRemindersToSW) syncRemindersToSW(reminders)
    } else {
      showToast('⚠️ Allow notifications in browser settings')
    }
  }

  const handleAdd = () => {
    if (!form.title || !form.time)   { showToast('⚠️ Title and time required!'); return }
    if (form.days.length === 0)      { showToast('⚠️ Select at least 1 day!'); return }
    addReminder(form)
    setForm({ title:'', message:'', time:'08:00', category:'exercise', days:[0,1,2,3,4,5,6], sound:true })
    setView('mine')
    showToast('✅ Reminder has been set!')
  }

  const handlePreset = p => {
    if (permission !== 'granted') { showToast('⚠️ Enable notifications first!'); return }
    if (reminders.some(r => r.title === p.title)) { showToast('⚠️ This is already added!'); return }
    addReminder(p)
    showToast(`✅ "${p.title}" It has been added!`)
  }

  const timeUntil = (timeStr, days) => {
    const [h,m]    = timeStr.split(':').map(Number)
    const now      = new Date()
    const todayDay = now.getDay()
    for (let i = 0; i < 7; i++) {
      const checkDay = (todayDay + i) % 7
      if (!days || days.includes(checkDay)) {
        const fire = new Date()
        fire.setDate(fire.getDate() + i)
        fire.setHours(h, m, 0, 0)
        if (fire > now) {
          const diff = fire - now
          const hrs  = Math.floor(diff / 3600000)
          const mins = Math.floor((diff % 3600000) / 60000)
          return i === 0 ? (hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`) : `${DAY_FULL[checkDay]} ${timeStr}`
        }
      }
    }
    return 'Scheduled'
  }

  const enabledCount = reminders.filter(r => r.enabled).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── PWA Install Banner ── */}
      {!installed && installPrompt && (
        <div className="glass fade-up" style={{ padding:'16px 22px', borderTop:'2px solid var(--blue)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:32 }}>📲</span>
            <div>
              <div style={{ fontFamily:'var(--font-head)', color:'var(--blue)', fontWeight:700, fontSize:13 }}>Install the app</div>
              <div style={{ color:'var(--muted2)', fontSize:12, marginTop:3 }}>Install on the phone — the reminder will come even if the app is closed!</div>
            </div>
          </div>
          <Btn onClick={async () => {
            const ok = await installApp()
            if (ok) showToast('✅ App has been installed! Now the background reminder will work.')
          }} color="var(--blue)" icon="📲">Install App</Btn>
        </div>
      )}

      {installed && (
        <div className="glass fade-up" style={{ padding:'12px 20px', borderTop:'2px solid var(--green)', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <span style={{ color:'var(--green)', fontFamily:'var(--font-head)', fontSize:12 }}>APP INSTALLED — Background reminders are working</span>
        </div>
      )}

      {/* ── Notification Permission ── */}
      {permission !== 'granted' && (
        <div className="glass fade-up" style={{ padding:'18px 22px', borderTop:'2px solid var(--orange)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <span style={{ fontSize:36 }}>🔔</span>
            <div>
              <div style={{ fontFamily:'var(--font-head)', color:'var(--orange)', fontWeight:700, fontSize:13 }}>STEP 1 — ALLOW NOTIFICATIONS</div>
              <div style={{ color:'var(--muted2)', fontSize:12, marginTop:4 }}>
                Press the button → In the browser popup <strong style={{ color:'var(--text)' }}>"Allow"</strong> click
              </div>
            </div>
          </div>
          <Btn onClick={handlePermission} color="var(--orange)" icon="🔔">Allow Notifications</Btn>
        </div>
      )}

      {/* ── How It Works ── */}
      {permission === 'granted' && (
        <div className="glass fade-up" style={{ padding:'16px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:14 }}>
            <Badge color="var(--green)">✅ Notifications ON</Badge>
            <Badge color={swReady ? 'var(--teal)' : 'var(--muted)'}>{swReady ? '✅ Background SW Active' : '⏳ SW Loading...'}</Badge>
            <Badge color="var(--blue)">{enabledCount} active</Badge>
            {installed && <Badge color="var(--violet)">📲 PWA Installed</Badge>}
            <div style={{ marginLeft:'auto' }}>
              <Btn onClick={() => { playBeep(520, 0.4); showToast('🔊 Sound test!') }} color="var(--violet)" variant="outline" icon="🔊">Test Sound</Btn>
            </div>
          </div>

          {/* How reminders reach you */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { icon:'📱', title:'App Open', desc:'When the tab is active → a reminder will come', color:'var(--teal)', ok:true },
              { icon:'🔕', title:'Then close', desc:'The Service Worker works in the background', color:'var(--blue)', ok: swReady },
              { icon:'📲', title:'App Install Done', desc:'Install on phone → 100% background support', color:'var(--green)', ok: installed },
            ].map(s => (
              <div key={s.title} style={{ background:`${s.color}08`, border:`1px solid ${s.color}${s.ok?'30':'15'}`, borderRadius:14, padding:'14px', textAlign:'center', opacity: s.ok ? 1 : 0.5 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{s.icon}</div>
                <div style={{ color: s.ok ? s.color : 'var(--muted)', fontFamily:'var(--font-head)', fontSize:11, fontWeight:700 }}>{s.title}</div>
                <div style={{ color:'var(--muted)', fontSize:10, marginTop:4 }}>{s.desc}</div>
                <div style={{ marginTop:8 }}>
                  <Badge color={s.ok ? s.color : 'var(--muted)'}>{s.ok ? '✅ Works' : '⚠️ Limited'}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Install instructions if not installed */}
          {!installed && !installPrompt && (
            <div style={{ marginTop:14, background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:12, padding:'12px 16px' }}>
              <div style={{ color:'var(--blue)', fontFamily:'var(--font-head)', fontSize:11, marginBottom:8 }}>📲 TO INSTALL ON PHONE:</div>
              <div style={{ color:'var(--muted2)', fontSize:12, lineHeight:1.8 }}>
                <strong style={{ color:'var(--text)' }}>Android Chrome:</strong> Menu (⋮) → "Add to Home Screen" → Install<br/>
                <strong style={{ color:'var(--text)' }}>iPhone Safari:</strong> Share (□↑) →"Add to Home Screen" → Add<br/>
                <strong style={{ color:'var(--text)' }}>Laptop Chrome:</strong> In the address bar 📥 icon → Install
              </div>
            </div>
          )}

          {/* Tab buttons */}
          <div style={{ display:'flex', gap:2, marginTop:14, background:'rgba(255,255,255,0.03)', borderRadius:12, padding:4 }}>
            {[
              { id:'mine',    label:'📋 My Reminders', count: reminders.length },
              { id:'presets', label:'⚡ Presets',       count: PRESETS.length },
              { id:'add',     label:'➕ Custom',         count: null },
            ].map(t => (
              <button key={t.id} onClick={() => setView(t.id)} style={{
                flex:1, padding:'9px', borderRadius:9, cursor:'pointer', border:'none',
                background: view===t.id ? 'rgba(0,255,231,0.12)' : 'transparent',
                color: view===t.id ? 'var(--teal)' : 'var(--muted)',
                fontFamily:'var(--font-head)', fontSize:11, fontWeight: view===t.id ? 700 : 400,
                transition:'all 0.2s',
                boxShadow: view===t.id ? 'inset 0 0 0 1px rgba(0,255,231,0.2)' : 'none'
              }}>
                {t.label}{t.count !== null ? ` (${t.count})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── PRESETS ── */}
      {view === 'presets' && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="⚡" color="var(--teal)">Quick Add — Ek Click Mein</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {PRESETS.map((p, i) => {
              const color   = CAT_COLOR[p.category]
              const already = reminders.some(r => r.title === p.title)
              return (
                <button key={i} onClick={() => !already && handlePreset(p)} style={{
                  background: already ? 'rgba(255,255,255,0.02)' : `${color}08`,
                  border: `1px solid ${already ? 'rgba(255,255,255,0.06)' : color+'33'}`,
                  borderRadius:14, padding:'14px 16px', cursor: already?'default':'pointer',
                  display:'flex', alignItems:'center', gap:12, textAlign:'left',
                  opacity: already ? 0.5 : 1, transition:'all 0.2s'
                }}
                  onMouseOver={e => !already && (e.currentTarget.style.background=`${color}14`)}
                  onMouseOut={e =>  !already && (e.currentTarget.style.background=`${color}08`)}
                >
                  <div style={{ width:42,height:42,borderRadius:10,background:`${color}18`,border:`1px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>
                    {CAT_ICON[p.category]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color: already?'var(--muted)':color, fontFamily:'var(--font-head)', fontSize:12, fontWeight:700 }}>
                      {p.title} {already && '✓'}
                    </div>
                    <div style={{ color:'var(--muted)', fontSize:11, marginTop:2 }}>
                      {p.time} · {(p.days||[]).map(d => DAY_SHORT[d]).join(' ')}
                    </div>
                    <div style={{ color:'var(--muted)', fontSize:10, marginTop:3 }}>{p.message.slice(0,40)}</div>
                  </div>
                  {!already && <span style={{ color, fontSize:22, flexShrink:0 }}>+</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CUSTOM ADD ── */}
      {view === 'add' && (
        <div className="glass fade-up" style={{ padding:28 }}>
          <SectionTitle icon="➕" color="var(--blue)">Make a custom reminder</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <GlassInput label="Title" value={form.title} onChange={f('title')} placeholder="e.g. 💊 Medicine Time" style={{ gridColumn:'span 2' }} />
            <GlassInput label="Message" value={form.message} onChange={f('message')} placeholder="Description of the reminder..." style={{ gridColumn:'span 2' }} />
            <GlassInput label="Time" type="time" value={form.time} onChange={f('time')} />
            <GlassSelect label="Category" value={form.category} onChange={f('category')} options={['exercise','hydration','nutrition','sleep','tracking']} />
          </div>

          {/* Days picker */}
          <div style={{ marginTop:18 }}>
            <div style={{ color:'var(--muted2)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:10 }}>Repeat Days</div>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              {DAY_FULL.map((day, i) => (
                <button key={i} onClick={() => toggleDay(i)} style={{
                  width:44, height:44, borderRadius:10, cursor:'pointer', border:'none',
                  background: form.days.includes(i) ? CAT_COLOR[form.category] : 'rgba(255,255,255,0.05)',
                  color: form.days.includes(i) ? '#030712' : 'var(--muted)',
                  fontFamily:'var(--font-head)', fontSize:11, fontWeight:700,
                  boxShadow: form.days.includes(i) ? `0 0 12px ${CAT_COLOR[form.category]}66` : 'none',
                  transition:'all 0.2s'
                }}>{day.slice(0,2)}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { label:'Weekdays', days:[1,2,3,4,5] },
                { label:'Weekend',  days:[0,6] },
                { label:'Every Day',  days:[0,1,2,3,4,5,6] },
              ].map(q => (
                <button key={q.label} onClick={() => setForm(p=>({...p,days:q.days}))} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'5px 14px', color:'var(--muted2)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-head)' }}>{q.label}</button>
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:16, background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'12px 16px' }}>
            <span style={{ fontSize:18 }}>🔊</span>
            <div>
              <div style={{ color:'var(--text)', fontSize:13 }}>Sound Alert</div>
              <div style={{ color:'var(--muted)', fontSize:11 }}>A beep sound will play with the notification</div>
            </div>
            <div onClick={() => f('sound')(!form.sound)} style={{ marginLeft:'auto', width:44, height:26, borderRadius:999, cursor:'pointer', background: form.sound ? 'var(--teal)' : 'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.3s', boxShadow: form.sound ? '0 0 12px rgba(0,255,231,0.5)' : 'none' }}>
              <div style={{ position:'absolute', top:4, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.3s', left: form.sound?23:4 }}/>
            </div>
          </div>

          <div style={{ marginTop:20 }}>
            <Btn onClick={handleAdd} color="var(--blue)" icon="🔔">Add Reminder</Btn>
          </div>
        </div>
      )}

      {/* ── MY REMINDERS ── */}
      {view === 'mine' && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="📋" color="var(--muted2)">My Reminders ({reminders.length})</SectionTitle>
          {reminders.length === 0 ? (
            <div style={{ textAlign:'center', padding:48 }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔕</div>
              <div style={{ color:'var(--muted)', fontFamily:'var(--font-head)', letterSpacing:2, fontSize:12 }}>No reminder</div>
              <div style={{ color:'var(--muted)', fontSize:12, marginTop:8 }}>Add presets from above or make a custom one</div>
              <div style={{ marginTop:20 }}>
                <Btn onClick={() => setView('presets')} color="var(--teal)" icon="⚡">Look at the presets</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...reminders].sort((a,b) => a.time.localeCompare(b.time)).map(r => {
                const color = CAT_COLOR[r.category] || 'var(--teal)'
                return (
                  <div key={r.id} style={{
                    background: r.enabled ? `${color}06` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${r.enabled ? color+'28' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius:16, padding:'16px 18px', opacity: r.enabled ? 1 : 0.45, transition:'all 0.3s'
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {/* Toggle switch */}
                      <div onClick={() => toggleReminder(r.id)} style={{ width:44,height:26,borderRadius:999,cursor:'pointer',flexShrink:0, background: r.enabled ? color : 'rgba(255,255,255,0.1)', position:'relative', transition:'all 0.3s', boxShadow: r.enabled ? `0 0 16px ${color}66` : 'none' }}>
                        <div style={{ position:'absolute', top:4, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.3s', left:r.enabled?23:4 }}/>
                      </div>

                      {/* Icon */}
                      <div style={{ width:40,height:40,borderRadius:10,background:`${color}18`,border:`1px solid ${color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0 }}>
                        {CAT_ICON[r.category]||'🔔'}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <span style={{ fontWeight:700, fontFamily:'var(--font-head)', fontSize:13 }}>{r.title}</span>
                          <Badge color={color}>{r.category}</Badge>
                          {r.sound !== false && <Badge color="var(--violet)">🔊</Badge>}
                        </div>
                        {r.message && <div style={{ color:'var(--muted)', fontSize:12, marginTop:3 }}>{r.message}</div>}
                        <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
                          {(r.days||[0,1,2,3,4,5,6]).map(d => (
                            <span key={d} style={{ background:`${color}18`, color, border:`1px solid ${color}30`, borderRadius:6, padding:'1px 8px', fontSize:10, fontFamily:'var(--font-head)' }}>
                              {DAY_FULL[d]}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Time + countdown */}
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ color, fontFamily:'var(--font-head)', fontWeight:900, fontSize:22 }}>{r.time}</div>
                        {r.enabled && (
                          <div style={{ color:'var(--muted)', fontSize:10, marginTop:2 }}>in {timeUntil(r.time, r.days)}</div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', flexDirection:'column', gap:5, flexShrink:0 }}>
                        <button onClick={() => { snoozeReminder(r.id, 10); showToast('💤 Snoozed for 10 minutes!') }} title="Snooze 10 min" style={{ background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.25)', color:'var(--violet)', cursor:'pointer', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'all 0.2s' }}>💤</button>
                        <button onClick={() => { deleteReminder(r.id); showToast('🗑️ Deleted!') }} title="Delete" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', cursor:'pointer', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, transition:'all 0.2s' }}>✕</button>
                      </div>
                    </div>
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
