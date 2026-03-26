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

  const { steps, active, lastSaved, hasPermission, requestPermission, reset, forceSave } = useStepCounter(deviceId)

  const act      = ACTIVITIES.find(a => a.type === actType) || ACTIVITIES[1]
  const autoCal  = Math.round(act.met * (userWeight || 70) * ((Number(duration)||0) / 60))
  const estSteps = Math.round(act.spm * (Number(duration)||0))

  const handleLog = async () => {
    if (!duration) { showToast('⚠️ Enter duration!'); return }
    await onAdd({
      type: actType, duration: Number(duration),
      calories: autoCal,
      steps: steps > 0 ? steps : estSteps,
      notes, date,
    })
    showToast(`✅ ${actType} logged!`)
    setNotes(''); reset()
  }

  const todayActs  = activities.filter(a => a.date === today && a.notes !== 'auto-step-count')
  const autoEntry  = activities.find(a  => a.date === today && a.notes === 'auto-step-count')
  const totalSteps = todayActs.reduce((s,a)=>s+(a.steps||0),0) + (autoEntry?.steps||0)
  const totalCals  = todayActs.reduce((s,a)=>s+(a.calories||0),0)

  // Is this iOS (needs permission tap)?
  const needsPermission = typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function' &&
    !hasPermission

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

      {/* Step Counter */}
      <div className="glass fade-up" style={{ padding:16, borderTop:'2px solid #00ffe7' }}>
        <SectionTitle icon="🦶" color="var(--teal)">Step Counter</SectionTitle>

        {/* iOS Permission banner */}
        {needsPermission && (
          <button
            onClick={async () => {
              const ok = await requestPermission()
              if (ok) showToast('✅ Step counting started!')
              else showToast('⚠️ Permission denied')
            }}
            style={{
              width:'100%', background:'rgba(251,146,60,0.15)',
              border:'1.5px solid rgba(251,146,60,0.6)',
              borderRadius:10, padding:'12px',
              color:'#fb923c', fontWeight:700, fontSize:12,
              cursor:'pointer', fontFamily:"'Orbitron',monospace",
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              marginBottom:12, minHeight:46,
            }}
          >
            <span>👆</span><span>TAP TO ENABLE STEP COUNTER</span>
          </button>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          {/* Step number */}
          <div style={{ textAlign:'center', minWidth:80 }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:44, fontWeight:900, color:'#00ffe7', lineHeight:1 }}>
              {steps.toLocaleString()}
            </div>
            <div style={{ color:'#6b7f96', fontSize:9, marginTop:3, letterSpacing:1 }}>STEPS</div>
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, minWidth:0 }}>
            {/* Status */}
            <div style={{
              display:'flex', alignItems:'center', gap:8, padding:'9px 12px',
              background: active?'rgba(34,211,165,0.08)':'rgba(255,255,255,0.03)',
              border:`1px solid ${active?'rgba(34,211,165,0.3)':'rgba(255,255,255,0.08)'}`,
              borderRadius:10,
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: hasPermission ? (active?'#22d3a5':'#3d4f62') : '#fb923c',
                boxShadow: active?'0 0 6px #22d3a5':'none',
                animation: active?'pulse 1s infinite':'none',
              }}/>
              <span style={{ color: hasPermission?(active?'#22d3a5':'#6b7f96'):'#fb923c', fontFamily:"'Orbitron',monospace", fontSize:9 }}>
                {!hasPermission ? 'TAP TO START' : active ? 'COUNTING' : 'READY'}
              </span>
              {lastSaved && <span style={{ marginLeft:'auto', color:'#3d4f62', fontSize:8 }}>saved {lastSaved}</span>}
            </div>

            {/* Stat pills */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
              {[
                { l:'Cal',  v:Math.round(steps*0.04),            c:'#fb923c' },
                { l:'km',   v:(steps*0.00075).toFixed(2),        c:'#38bdf8' },
                { l:'min',  v:Math.round(steps/100),             c:'#a78bfa' },
              ].map(s=>(
                <div key={s.l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'7px 4px', textAlign:'center' }}>
                  <div style={{ color:s.c, fontFamily:"'Orbitron',monospace", fontSize:13, fontWeight:900 }}>{s.v}</div>
                  <div style={{ color:'#3d4f62', fontSize:8, marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        {steps > 0 && (
          <div style={{ display:'flex', gap:7, marginTop:10 }}>
            <button onClick={()=>{ forceSave(); showToast('✅ Saved!') }}
              style={{ flex:1, background:'rgba(34,211,165,0.15)', border:'1.5px solid rgba(34,211,165,0.5)', borderRadius:9, padding:'9px', color:'#22d3a5', fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:700, cursor:'pointer', minHeight:'auto' }}>
              💾 Save
            </button>
            <button onClick={()=>{ reset(); showToast('Reset') }}
              style={{ background:'rgba(239,68,68,0.1)', border:'1.5px solid rgba(239,68,68,0.3)', borderRadius:9, padding:'9px 13px', color:'#ef4444', fontFamily:"'Orbitron',monospace", fontSize:10, cursor:'pointer', minHeight:'auto' }}>
              ↺
            </button>
          </div>
        )}
      </div>

      {/* Log Activity */}
      <div className="glass fade-up delay-1" style={{ padding:16, borderTop:'2px solid #fb923c' }}>
        <SectionTitle icon="➕" color="var(--orange)">Log Activity</SectionTitle>

        {/* Activity grid — 5 cols on desktop, 5 on mobile */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:14 }}>
          {ACTIVITIES.map(a => (
            <button key={a.type} onClick={()=>setActType(a.type)} style={{
              background: actType===a.type?'rgba(251,146,60,0.15)':'rgba(255,255,255,0.03)',
              border:`1.5px solid ${actType===a.type?'rgba(251,146,60,0.6)':'rgba(255,255,255,0.08)'}`,
              borderRadius:10, padding:'9px 4px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              minHeight:'auto', transition:'all 0.15s',
            }}>
              <span style={{ fontSize:18 }}>{a.icon}</span>
              <span style={{ fontSize:8, color:actType===a.type?'#fb923c':'#6b7f96', fontFamily:"'Orbitron',monospace", fontWeight:actType===a.type?700:400, letterSpacing:0.3 }}>{a.type}</span>
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <GlassInput label="Date" type="date" value={date} onChange={setDate}/>
          <GlassInput label="Duration (min)" type="number" value={duration} onChange={setDuration} min="1"/>
        </div>
        <GlassInput label="Notes" value={notes} onChange={setNotes} placeholder="Optional" style={{ marginBottom:12 }}/>

        {/* Preview */}
        <div style={{ display:'flex', justifyContent:'space-around', background:'rgba(251,146,60,0.07)', border:'1px solid rgba(251,146,60,0.18)', borderRadius:10, padding:'11px', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          {[
            { v:autoCal, l:'kcal', c:'#fb923c' },
            { v:steps>0?steps.toLocaleString():estSteps.toLocaleString(), l:steps>0?'live steps':'est. steps', c:'#00ffe7' },
            { v:duration||0, l:'min', c:'#a78bfa' },
          ].map(s=>(
            <div key={s.l} style={{ textAlign:'center' }}>
              <div style={{ color:s.c, fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:900 }}>{s.v}</div>
              <div style={{ color:'#6b7f96', fontSize:9 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <button onClick={handleLog} style={{
          width:'100%', background:'rgba(251,146,60,0.15)',
          border:'1.5px solid rgba(251,146,60,0.6)',
          borderRadius:10, padding:'12px', color:'#fb923c',
          fontWeight:700, fontSize:12, cursor:'pointer',
          fontFamily:"'Orbitron',monospace",
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          minHeight:46,
        }}>
          <span>🏃</span><span>LOG {actType.toUpperCase()}</span>
        </button>
      </div>

      {/* Today */}
      <div className="glass fade-up delay-2" style={{ padding:16 }}>
        <SectionTitle icon="📋" color="var(--teal)">Today</SectionTitle>
        <div style={{ display:'flex', gap:14, marginBottom:10, flexWrap:'wrap' }}>
          <span style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:18 }}>{totalSteps.toLocaleString()} <span style={{ color:'#6b7f96', fontSize:11, fontWeight:400 }}>steps</span></span>
          <span style={{ color:'#fb923c', fontFamily:"'Orbitron',monospace", fontWeight:900, fontSize:18 }}>{totalCals} <span style={{ color:'#6b7f96', fontSize:11, fontWeight:400 }}>kcal</span></span>
        </div>

        {autoEntry?.steps > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(0,255,231,0.05)', border:'1px solid rgba(0,255,231,0.18)', borderRadius:10, padding:'10px 12px', marginBottom:7 }}>
            <span style={{ fontSize:18 }}>🦶</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:700, color:'#dde3ed' }}>Auto Walk</div>
              <div style={{ color:'#6b7f96', fontSize:10, marginTop:1 }}>{today}</div>
            </div>
            <span style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700, flexShrink:0 }}>{autoEntry.steps.toLocaleString()}</span>
            <Badge color="var(--teal)">AUTO</Badge>
          </div>
        )}

        {todayActs.length===0 && !autoEntry && (
          <div style={{ color:'#3d4f62', textAlign:'center', padding:20, fontFamily:"'Orbitron',monospace", fontSize:10 }}>NO ACTIVITIES YET</div>
        )}

        {todayActs.map(a=>(
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 12px', marginBottom:7 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{ACTIVITIES.find(x=>x.type===a.type)?.icon||'🏃'}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:10, fontWeight:700, color:'#dde3ed', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.type}</div>
              <div style={{ color:'#6b7f96', fontSize:10, marginTop:1 }}>{a.duration} min</div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
              {a.calories>0&&<span style={{ color:'#fb923c', fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700 }}>{a.calories}</span>}
              {a.steps>0&&<span style={{ color:'#00ffe7', fontFamily:"'Orbitron',monospace", fontSize:10 }}>{Number(a.steps).toLocaleString()}</span>}
              <button onClick={()=>{onDelete(a.id);showToast('Deleted')}} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', borderRadius:7, width:26, height:26, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'auto', padding:0 }}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
