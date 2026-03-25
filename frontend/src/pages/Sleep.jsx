import { useState } from 'react'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'

const today   = new Date().toISOString().split('T')[0]
const QUALITY = ['Excellent','Good','Fair','Poor','Very Poor']

function calcDuration(bed, wake) {
  if (!bed || !wake) return 0
  const [bh,bm] = bed.split(':').map(Number)
  const [wh,wm] = wake.split(':').map(Number)
  let diff = (wh*60+wm) - (bh*60+bm)
  if (diff < 0) diff += 1440
  return +(diff/60).toFixed(1)
}

function qualityInfo(hrs) {
  if (hrs >= 8) return { label:'Excellent 🌟', color:'#22d3a5' }
  if (hrs >= 7) return { label:'Good 👍',       color:'#00ffe7' }
  if (hrs >= 6) return { label:'Fair ⚠️',       color:'#fb923c' }
  return               { label:'Poor 😞',       color:'#ef4444' }
}

export default function Sleep({ sleepLogs, onAdd, onDelete, showToast }) {
  const [date,    setDate]    = useState(today)
  const [bedtime, setBedtime] = useState('')
  const [wakeup,  setWakeup]  = useState('')
  const [quality, setQuality] = useState('Good')

  const duration = calcDuration(bedtime, wakeup)
  const qi       = qualityInfo(duration)
  const last     = sleepLogs[0]
  const weekAvg  = sleepLogs.length
    ? +(sleepLogs.slice(0,7).reduce((s,l)=>s+(l.duration||0),0)/Math.min(sleepLogs.length,7)).toFixed(1) : 0

  const handleLog = async () => {
    if (!bedtime || !wakeup) { showToast('⚠️ Enter bedtime & wake up time!'); return }
    await onAdd({ bedtime, wakeup, quality, date })
    showToast(`✅ Sleep logged! ${duration} hrs — ${quality}`)
    setBedtime(''); setWakeup('')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          { icon:'😴', label:'Last Night', value:(last?.duration||0)+' hrs', color:'#a78bfa' },
          { icon:'⭐', label:'Quality',    value:last?.quality||'—',         color:'#00ffe7' },
          { icon:'📊', label:'Week Avg',   value:weekAvg+' hrs',             color:'#38bdf8' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding:'12px 10px', textAlign:'center', borderTop:`2px solid ${s.color}44` }}>
            <div style={{ fontSize:20, marginBottom:5 }}>{s.icon}</div>
            <div style={{ color:s.color, fontFamily:"'Orbitron',monospace", fontSize:14, fontWeight:900 }}>{s.value}</div>
            <div style={{ color:'#94a3b8', fontSize:10, marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      
      <div className="glass fade-up" style={{ padding:22, borderTop:'2px solid #a78bfa' }}>
        <SectionTitle icon="🌙" color="var(--violet)">Log Sleep</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <GlassInput label="Date"          type="date" value={date}    onChange={setDate}/>
          <GlassSelect label="Sleep Quality" value={quality} onChange={setQuality} options={QUALITY}/>
          <GlassInput label="Bedtime"  type="time" value={bedtime} onChange={setBedtime}/>
          <GlassInput label="Wake Up"  type="time" value={wakeup}  onChange={setWakeup}/>
        </div>

        {duration > 0 && (
          <div style={{ background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.35)', borderRadius:12, padding:14, textAlign:'center', marginBottom:14 }}>
            <div style={{ color:'#a78bfa', fontFamily:"'Orbitron',monospace", fontSize:34, fontWeight:900 }}>{duration} hrs</div>
            <div style={{ color:qi.color, fontSize:14, marginTop:4, fontWeight:700 }}>{qi.label}</div>
          </div>
        )}

        
        <button onClick={handleLog} style={{
          width:'100%',
          background:'rgba(167,139,250,0.15)',
          border:'1.5px solid rgba(167,139,250,0.55)',
          borderRadius:10, padding:'12px',
          color:'#a78bfa',
          fontWeight:700, fontSize:12,
          cursor:'pointer', fontFamily:"'Orbitron',monospace",
          display:'flex', alignItems:'center', justifyContent:'center', gap:7,
          boxShadow:'none', minHeight:46,
        }}>
          <span>🌙</span>
          <span>LOG SLEEP</span>
        </button>
      </div>

      
      <div className="glass fade-up delay-1" style={{ padding:20 }}>
        <SectionTitle icon="📈" color="var(--violet)">Sleep History ({sleepLogs.length})</SectionTitle>
        {sleepLogs.length === 0 ? (
          <div style={{ color:'#94a3b8', textAlign:'center', padding:28, fontFamily:"'Orbitron',monospace", fontSize:11 }}>NO SLEEP LOGGED YET</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {sleepLogs.slice(0,10).map(s => {
              const q = qualityInfo(s.duration||0)
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'11px 14px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ color:'#a78bfa', fontFamily:"'Orbitron',monospace", fontSize:15, fontWeight:900 }}>{s.duration||0} hrs</span>
                      <Badge color="var(--violet)">{s.quality}</Badge>
                    </div>
                    <div style={{ color:'#94a3b8', fontSize:11 }}>{s.date} · {s.bedtime} → {s.wakeup}</div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:999, marginTop:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min((s.duration||0)/8*100,100)}%`, background:'#a78bfa', borderRadius:999 }}/>
                    </div>
                  </div>
                  <button onClick={()=>{ onDelete(s.id); showToast('Deleted') }} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:8, width:28, height:28, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'auto', padding:0, flexShrink:0 }}>✕</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
