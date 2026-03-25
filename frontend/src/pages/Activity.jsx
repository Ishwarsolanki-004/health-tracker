import { useState } from 'react'
import { GlassInput, Badge, SectionTitle } from '../components/GlassInput'
import { useStepCounter } from '../hooks/useStepCounter'

const today = new Date().toISOString().split('T')[0]

const ACTIVITIES = [
  { type:'Running',    icon:'🏃', met:9.8,  spm:160 },
  { type:'Walking',    icon:'🚶', met:3.5,  spm:100 },
  { type:'Cycling',    icon:'🚴', met:7.5,  spm:0   },
  { type:'Swimming',   icon:'🏊', met:8.0,  spm:0   },
  { type:'Yoga',       icon:'🧘', met:3.0,  spm:0   },
  { type:'Gym',        icon:'💪', met:6.0,  spm:50  },
  { type:'HIIT',       icon:'⚡', met:12.0, spm:120 },
  { type:'Meditation', icon:'🧠', met:1.5,  spm:0   },
  { type:'Sports',     icon:'⚽', met:8.0,  spm:80  },
  { type:'Other',      icon:'🎯', met:5.0,  spm:60  },
]

export default function Activity({ activities, onAdd, onDelete, showToast, userWeight, deviceId }) {
  const [actType,  setActType]  = useState('Walking')
  const [duration, setDuration] = useState('30')
  const [date,     setDate]     = useState(today)
  const [notes,    setNotes]    = useState('')

  const { steps, active, lastSaved, reset, forceSave } = useStepCounter(deviceId)

  const act     = ACTIVITIES.find(a => a.type === actType) || ACTIVITIES[1]
  const autoCal = Math.round(act.met * (userWeight || 70) * ((Number(duration)||0) / 60))
  const estSteps= Math.round(act.spm * (Number(duration)||0))

  const handleLog = async () => {
    if (!actType || !duration) { showToast('⚠️ Select activity & duration!'); return }
    const finalSteps = steps > 0 ? steps : estSteps
    await onAdd({ type: actType, duration: Number(duration), calories: autoCal, steps: finalSteps, notes, date })
    showToast(`✅ ${actType} logged!`)
    setNotes('')
    reset()
  }

  const todayActs = activities.filter(a => a.date === today && a.notes !== 'auto-step-count')
  const autoEntry = activities.find(a => a.date === today && a.notes === 'auto-step-count')
  const totalSteps= todayActs.reduce((s,a)=>s+(a.steps||0),0) + (autoEntry?.steps||0)
  const totalCals = todayActs.reduce((s,a)=>s+(a.calories||0),0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      
      <div className="glass fade-up" style={{ padding:20, borderTop:'2px solid #00ffe7' }}>
        <SectionTitle icon="🦶" color="var(--teal)">Step Counter</SectionTitle>

        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', marginBottom:14 }}>
          <div style={{ textAlign:'center', minWidth:90 }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:52, fontWeight:900, color:'#00ffe7', lineHeight:1, textShadow:'0 0 24px rgba(0,255,231,0.4)' }}>
              {steps.toLocaleString()}
            </div>
            <div style={{ color:'#94a3b8', fontSize:10, marginTop:4, letterSpacing:1 }}>STEPS</div>
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
              background: active?'rgba(34,211,165,0.1)':'rgba(255,255,255,0.04)',
              border:`1px solid ${active?'rgba(34,211,165,0.4)':'rgba(255,255,255,0.1)'}`,
              borderRadius:12
            }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:active?'#22d3a5':'#475569', boxShadow:active?'0 0 8px #22d3a5':'none', animation:active?'pulse 1s infinite':'none', flexShrink:0 }}/>
              <span style={{ color:active?'#22d3a5':'#94a3b8', fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:active?700:400 }}>
                {active ? 'ACTIVE' : 'STANDBY'}
              </span>
              {lastSaved && <span style={{ marginLeft:'auto', color:'#475569', fontSize:9 }}>saved {lastSaved}</span>}
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:12 }}>
          {[
            { label:'Steps',    value:steps.toLocaleString(),              color:'#00ffe7' },
            { label:'Calories', value:Math.round(steps*0.04)+' kcal',     color:'#fb923c' },
            { label:'Distance', value:(steps*0.00075).toFixed(2)+' km',   color:'#38bdf8' },
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px', textAlign:'center' }}>
              <div style={{ color:s.color, fontFamily:"'Orbitron',monospace", fontSize:15, fontWeight:900 }}>{s.value}</div>
              <div style={{ color:'#94a3b8', fontSize:9, marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          {steps > 0 && (
            <button onClick={()=>{ forceSave(); showToast('✅ Steps saved!') }}
              style={{ flex:1, background:'rgba(34,211,165,0.15)', border:'1.5px solid rgba(34,211,165,0.5)', borderRadius:10, padding:'10px', color:'#22d3a5', fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, cursor:'pointer', minHeight:'auto' }}>
              💾 Save
            </button>
          )}
          {steps > 0 && (
            <button onClick={()=>{ reset(); showToast('Steps reset') }}
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', color:'#ef4444', fontFamily:"'Orbitron',monospace", fontSize:11, cursor:'pointer', minHeight:'auto' }}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      
      <div className="glass fade-up delay-1" style={{ padding:22, borderTop:'2px solid #fb923c' }}>
        <SectionTitle icon="➕" color="var(--orange)">Log Activity</SectionTitle>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:16 }}>
          {ACTIVITIES.map(a => (
            <button key={a.type} onClick={()=>setActType(a.type)} style={{
              background: actType===a.type?'rgba(251,146,60,0.18)':'rgba(255,255,255,0.04)',
              border:`2px solid ${actType===a.type?'#fb923c':'rgba(255,255,255,0.1)'}`,
              borderRadius:12, padding:'10px 4px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:5,
              transition:'all 0.18s', minHeight:'auto',
            }}>
              <span style={{ fontSize:20 }}>{a.icon}</span>
              <span style={{ fontSize:9, color:actType===a.type?'#fb923c':'#94a3b8', fontFamily:"'Orbitron',monospace", fontWeight:actType===a.type?700:400 }}>{a.type}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <GlassInput label="Date" type="date" value={date} onChange={setDate}/>
          <GlassInput label="Duration (min)" type="number" value={duration} onChange={setDuration} min="1"/>
        </div>
        <GlassInput label="Notes" value={notes} onChange={setNotes} placeholder="Optional" style={{ marginBottom:14 }}/>

        <div style={{ background:'rgba(251,146,60,0.08)', border:'1px solid rgba(251,146,60,0.2)', borderRadius:12, padding:'12px 16px', display:'flex', justifyContent:'space-around', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#fb923c', fontFamily:"'Orbitron',monospace", fontSize:24, fontWeight:900 }}>{autoCal}</div>
            <div style={{ color:'#94a3b8', fontSize:10 }}>kcal</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontSize:24, fontWeight:900 }}>
              {steps>0 ? steps.toLocaleString() : estSteps.toLocaleString()}
            </div>
            <div style={{ color:'#94a3b8', fontSize:10 }}>steps</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#a78bfa', fontFamily:"'Orbitron',monospace", fontSize:24, fontWeight:900 }}>{duration||0}</div>
            <div style={{ color:'#94a3b8', fontSize:10 }}>min</div>
          </div>
        </div>

        <button onClick={handleLog} style={{
          width:'100%', background:'rgba(251,146,60,0.18)', border:'1.5px solid rgba(251,146,60,0.6)', borderRadius:10,
          padding:'12px', color:'#fb923c', fontWeight:700, fontSize:12,
          cursor:'pointer', fontFamily:"'Orbitron',monospace",
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          boxShadow:'none', minHeight:46,
        }}>
          <span style={{ fontSize:18 }}>🏃</span>
          <span>LOG {actType.toUpperCase()}</span>
        </button>
      </div>

      
      <div className="glass fade-up delay-2" style={{ padding:20 }}>
        <SectionTitle icon="📋" color="var(--teal)">Today</SectionTitle>
        <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
          <div><span style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:20 }}>{totalSteps.toLocaleString()}</span><span style={{ color:'#94a3b8', fontSize:11, marginLeft:4 }}>steps</span></div>
          <div><span style={{ color:'#fb923c', fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:20 }}>{totalCals}</span><span style={{ color:'#94a3b8', fontSize:11, marginLeft:4 }}>kcal</span></div>
        </div>

        {autoEntry?.steps > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(0,255,231,0.06)', border:'1px solid rgba(0,255,231,0.2)', borderRadius:12, padding:'11px 14px', marginBottom:8 }}>
            <span style={{ fontSize:22 }}>🦶</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, color:'#f1f5f9' }}>Walk</div>
              <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>{today}</div>
            </div>
            <span style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:700 }}>{autoEntry.steps.toLocaleString()} steps</span>
            <Badge color="var(--teal)">AUTO</Badge>
          </div>
        )}

        {todayActs.length === 0 && !autoEntry && (
          <div style={{ color:'#94a3b8', textAlign:'center', padding:24, fontFamily:"'Orbitron',monospace", fontSize:11 }}>NO ACTIVITIES YET</div>
        )}

        {todayActs.map(a => (
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'11px 14px', marginBottom:8 }}>
            <span style={{ fontSize:22 }}>{ACTIVITIES.find(x=>x.type===a.type)?.icon||'🏃'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, color:'#f1f5f9' }}>{a.type}</div>
              <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>{a.duration} min{a.notes&&a.notes!=='auto-step-count'?` · ${a.notes}`:''}</div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              {a.calories>0 && <span style={{ color:'#fb923c', fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700 }}>{a.calories} kcal</span>}
              {a.steps>0   && <span style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontSize:11 }}>{Number(a.steps).toLocaleString()} steps</span>}
              <button onClick={()=>{ onDelete(a.id); showToast('Deleted') }} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:8, width:28, height:28, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, minHeight:'auto', padding:0 }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
