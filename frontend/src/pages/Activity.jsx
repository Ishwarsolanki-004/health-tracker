// pages/Activity.jsx — With auto-calorie calc + live step counter sensor

import { useState, useEffect } from 'react'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'
import { calcCalories, calcSteps, ACTIVITY_MET, useStepCounter } from '../hooks/useSensors'

const today = new Date().toISOString().split('T')[0]
const ACTIVITY_LIST = ['Running','Walking','Cycling','Swimming','Yoga','Gym','HIIT','Meditation','Sports','Other']
const ACT_ICONS = { Running:'🏃',Walking:'🚶',Cycling:'🚴',Swimming:'🏊',Yoga:'🧘',Gym:'💪',HIIT:'⚡',Meditation:'🧠',Sports:'⚽',Other:'🏋️' }
const ACT_DESC  = {
  Running:    'High intensity cardio',
  Walking:    'Low impact, great for daily health',
  Cycling:    'Great cardio, easy on joints',
  Swimming:   'Full body workout',
  Yoga:       'Flexibility & mindfulness',
  Gym:        'Strength training',
  HIIT:       'Maximum fat burn',
  Meditation: 'Mental wellness',
  Sports:     'Team/individual sport',
  Other:      'Custom activity',
}

const DEFAULT_WEIGHT = 70

export default function Activity({ activities, onAdd, onDelete, showToast, userWeight }) {
  const weight = userWeight || DEFAULT_WEIGHT

  const [form, setForm] = useState({
    type:'Walking', duration:'', calories:'', steps:'', notes:'', date:today
  })
  const [autoCalc, setAutoCalc] = useState(true)
  const [preview, setPreview]   = useState({ calories: 0, steps: 0 })

  // Sensor step counter
  const { steps: sensorSteps, active: sensorActive, supported: sensorSupported,
          error: sensorError, startCounting, stopCounting, reset: resetSensor } = useStepCounter()

  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  // Auto-calculate whenever type/duration changes
  useEffect(() => {
    if (!form.duration || !autoCalc) return
    const dur = Number(form.duration)
    if (dur <= 0) return
    const cal   = calcCalories(form.type, dur, weight)
    const steps = calcSteps(form.type, dur)
    setPreview({ calories: cal, steps })
    setForm(p => ({
      ...p,
      calories: String(cal),
      steps:    String(steps),
    }))
  }, [form.type, form.duration, autoCalc, weight])

  // Sync sensor steps into form
  useEffect(() => {
    if (sensorActive && sensorSteps > 0) {
      setForm(p => ({ ...p, steps: String(sensorSteps) }))
      // Recalc calories from actual steps (walking ~0.04 kcal/step)
      const cal = Math.round(sensorSteps * 0.04)
      setForm(p => ({ ...p, calories: String(cal) }))
    }
  }, [sensorSteps, sensorActive])

  const handleStop = () => {
    stopCounting()
    showToast(`✅ Recorded ${sensorSteps} steps from sensor!`)
  }

  const submit = async () => {
    if (!form.duration) { showToast('⚠️ Duration required!'); return }
    if (sensorActive) stopCounting()
    await onAdd({
      ...form,
      duration: Number(form.duration),
      calories: Number(form.calories) || 0,
      steps:    Number(form.steps) || 0,
    })
    setForm({ type:'Walking', duration:'', calories:'', steps:'', notes:'', date:today })
    setPreview({ calories:0, steps:0 })
    resetSensor()
    showToast('✅ Activity logged!')
  }

  const calPerMin = form.duration > 0
    ? (Number(form.calories) / Number(form.duration)).toFixed(1)
    : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* ── Live Step Counter ── */}
      {sensorSupported && (
        <div className="glass fade-up" style={{
          padding:'20px 24px',
          border: sensorActive ? '1px solid rgba(0,255,231,0.3)' : '1px solid rgba(255,255,255,0.07)',
          boxShadow: sensorActive ? '0 0 30px rgba(0,255,231,0.1)' : 'none',
          transition: 'all 0.4s'
        }}>
          <SectionTitle icon="📱" color="var(--teal)">Live Step Counter (Phone Sensor)</SectionTitle>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            {/* Big step display */}
            <div style={{ textAlign:'center', minWidth:100 }}>
              <div style={{
                fontFamily:'var(--font-head)', fontSize:52, fontWeight:900, lineHeight:1,
                color: sensorActive ? 'var(--teal)' : 'var(--muted)',
                textShadow: sensorActive ? '0 0 30px var(--teal)' : 'none',
                transition: 'all 0.3s'
              }}>{sensorSteps}</div>
              <div style={{ color:'var(--muted)', fontSize:11, letterSpacing:2, marginTop:4 }}>STEPS</div>
            </div>

            {/* Animated pulse when active */}
            {sensorActive && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:40 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{
                      width:4, borderRadius:2,
                      background:'var(--teal)',
                      height: `${10 + Math.sin((Date.now()/300 + i) * 1.5) * 12 + 12}px`,
                      opacity:0.7,
                      animation:`wave${i} 0.5s ease-in-out infinite`,
                    }}/>
                  ))}
                </div>
                <div style={{ color:'var(--teal)', fontSize:11, fontFamily:'var(--font-head)', letterSpacing:1 }}>
                  ● RECORDING...
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {!sensorActive ? (
                <Btn onClick={startCounting} color="var(--teal)" icon="▶">Start Counting</Btn>
              ) : (
                <Btn onClick={handleStop} color="var(--pink)" icon="⬛">Stop & Save</Btn>
              )}
              {sensorSteps > 0 && !sensorActive && (
                <Btn onClick={resetSensor} color="var(--muted2)" variant="outline" icon="↺">Reset</Btn>
              )}
            </div>

            {sensorSteps > 0 && (
              <div style={{ display:'flex', gap:20, marginLeft:'auto', flexWrap:'wrap' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ color:'var(--orange)', fontFamily:'var(--font-head)', fontWeight:800, fontSize:18 }}>
                    {Math.round(sensorSteps * 0.04)}
                  </div>
                  <div style={{ color:'var(--muted)', fontSize:10 }}>kcal est.</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ color:'var(--blue)', fontFamily:'var(--font-head)', fontWeight:800, fontSize:18 }}>
                    {(sensorSteps * 0.762).toFixed(0)}m
                  </div>
                  <div style={{ color:'var(--muted)', fontSize:10 }}>distance</div>
                </div>
              </div>
            )}
          </div>
          {sensorError && (
            <div style={{ color:'var(--orange)', fontSize:12, marginTop:10, background:'rgba(251,146,60,0.08)', borderRadius:8, padding:'8px 12px' }}>
              ⚠️ {sensorError}
            </div>
          )}
          <div style={{ color:'var(--muted)', fontSize:11, marginTop:10 }}>
            💡 Phone ko pocket mein rakho aur chalte waqt Start dabao — accelerometer steps count karega
          </div>
        </div>
      )}

      {/* ── Activity Form ── */}
      <div className="glass fade-up delay-1" style={{ padding:28 }}>
        <SectionTitle icon="➕" color="var(--teal)">Log Activity</SectionTitle>

        {/* Activity type cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:20 }}>
          {ACTIVITY_LIST.map(act => (
            <button key={act} onClick={() => f('type')(act)} style={{
              background: form.type===act ? 'rgba(0,255,231,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${form.type===act ? 'rgba(0,255,231,0.4)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius:12, padding:'10px 6px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              transition:'all 0.2s',
              boxShadow: form.type===act ? '0 0 16px rgba(0,255,231,0.15)' : 'none',
            }}>
              <span style={{ fontSize:22 }}>{ACT_ICONS[act]}</span>
              <span style={{
                fontSize:9, color: form.type===act ? 'var(--teal)' : 'var(--muted)',
                fontFamily:'var(--font-head)', letterSpacing:0.5, textAlign:'center'
              }}>{act}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <GlassInput label="Date" type="date" value={form.date} onChange={f('date')} />
          <GlassInput label="Duration (minutes)" type="number" value={form.duration} onChange={f('duration')} placeholder="30" min="1" />
          <GlassInput label="Notes (optional)" value={form.notes} onChange={f('notes')} placeholder="Feeling great today!" />

          {/* Auto toggle */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            <label style={{ color:'var(--muted2)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'var(--font-head)' }}>
              Calorie Mode
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setAutoCalc(true)} style={{
                flex:1, padding:'10px', borderRadius:10, cursor:'pointer',
                background: autoCalc ? 'rgba(0,255,231,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${autoCalc ? 'rgba(0,255,231,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: autoCalc ? 'var(--teal)' : 'var(--muted)',
                fontSize:11, fontFamily:'var(--font-head)', transition:'all 0.2s'
              }}>⚡ AUTO</button>
              <button onClick={() => setAutoCalc(false)} style={{
                flex:1, padding:'10px', borderRadius:10, cursor:'pointer',
                background: !autoCalc ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${!autoCalc ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                color: !autoCalc ? 'var(--violet)' : 'var(--muted)',
                fontSize:11, fontFamily:'var(--font-head)', transition:'all 0.2s'
              }}>✏️ MANUAL</button>
            </div>
          </div>
        </div>

        {/* Manual inputs only when auto is OFF */}
        {!autoCalc && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:16 }}>
            <GlassInput label="Calories Burned" type="number" value={form.calories} onChange={f('calories')} placeholder="200" />
            <GlassInput label="Steps" type="number" value={form.steps} onChange={f('steps')} placeholder="5000" />
          </div>
        )}

        {/* ── Live Preview Card ── */}
        {form.duration > 0 && (
          <div style={{
            marginTop:20,
            background:'rgba(0,255,231,0.04)',
            border:'1px solid rgba(0,255,231,0.15)',
            borderRadius:16, padding:'18px 20px',
            display:'grid', gridTemplateColumns:'auto 1fr auto', gap:16, alignItems:'center'
          }}>
            {/* Icon + name */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:52, height:52, borderRadius:14,
                background:'rgba(0,255,231,0.1)', border:'1px solid rgba(0,255,231,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:28
              }}>{ACT_ICONS[form.type]}</div>
              <span style={{ color:'var(--teal)', fontSize:10, fontFamily:'var(--font-head)' }}>{form.type}</span>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { icon:'🔥', label:'Calories Burned', value:form.calories||0, unit:'kcal', color:'var(--pink)' },
                { icon:'🦶', label:'Steps',           value:Number(form.steps||0).toLocaleString(), unit:'steps', color:'var(--teal)' },
                { icon:'⚡', label:'Cal/min',         value:calPerMin, unit:'/min', color:'var(--orange)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center', background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 8px' }}>
                  <div style={{ fontSize:18 }}>{s.icon}</div>
                  <div style={{ color:s.color, fontFamily:'var(--font-head)', fontSize:18, fontWeight:800 }}>{s.value}</div>
                  <div style={{ color:'var(--muted)', fontSize:9 }}>{s.unit}</div>
                  <div style={{ color:'var(--muted2)', fontSize:9, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* MET info */}
            <div style={{ textAlign:'center' }}>
              <div style={{
                background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.3)',
                borderRadius:12, padding:'8px 14px'
              }}>
                <div style={{ color:'var(--orange)', fontFamily:'var(--font-head)', fontSize:20, fontWeight:800 }}>
                  {ACTIVITY_MET[form.type]}
                </div>
                <div style={{ color:'var(--muted)', fontSize:9 }}>MET value</div>
              </div>
              {autoCalc && <div style={{ color:'var(--muted)', fontSize:9, marginTop:6 }}>Auto-calculated<br/>for {weight}kg</div>}
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ marginTop:12, color:'var(--muted)', fontSize:12, fontStyle:'italic' }}>
          💡 {ACT_DESC[form.type]}
          {autoCalc && form.duration > 0 && ` · ${ACTIVITY_MET[form.type]} MET × ${weight}kg × ${(form.duration/60).toFixed(2)}h`}
        </div>

        <div style={{ marginTop:20 }}>
          <Btn onClick={submit} color="var(--teal)" icon={ACT_ICONS[form.type]}>Log {form.type}</Btn>
        </div>
      </div>

      {/* ── History ── */}
      <div className="glass fade-up delay-2" style={{ padding:24 }}>
        <SectionTitle icon="📋" color="var(--muted2)">History ({activities.length})</SectionTitle>
        {activities.length === 0 ? (
          <div style={{ color:'var(--muted)', textAlign:'center', padding:48, fontFamily:'var(--font-head)', letterSpacing:2, fontSize:12 }}>
            NO ACTIVITIES YET
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:420, overflowY:'auto' }}>
            {activities.map(l => {
              const cal = l.calories || calcCalories(l.type, l.duration, weight)
              return (
                <div key={l.id} className="glass-sm" style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px'
                }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <div style={{
                      width:36, height:36, borderRadius:10,
                      background:'rgba(0,255,231,0.08)', border:'1px solid rgba(0,255,231,0.15)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:18
                    }}>{ACT_ICONS[l.type]||'🏃'}</div>
                    <div>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <Badge color="var(--teal)">{l.type}</Badge>
                        <span style={{ color:'var(--muted2)', fontSize:12, fontFamily:'var(--font-head)' }}>{l.date}</span>
                      </div>
                      <div style={{ color:'var(--muted)', fontSize:12, marginTop:3 }}>
                        {l.duration} min {l.notes ? `· ${l.notes}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ color:'var(--pink)', fontFamily:'var(--font-head)', fontWeight:800 }}>{cal} kcal</div>
                      {l.steps > 0 && <div style={{ color:'var(--teal)', fontSize:11 }}>{Number(l.steps).toLocaleString()} steps</div>}
                    </div>
                    <button onClick={() => onDelete(l.id)} style={{
                      background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                      color:'#ef4444', cursor:'pointer', borderRadius:8,
                      width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13
                    }}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
