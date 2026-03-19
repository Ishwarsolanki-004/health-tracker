import { useState } from 'react'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'
import StatCard from '../components/StatCard'

const today = new Date().toISOString().split('T')[0]
const QUALITY = ['Excellent','Good','Fair','Poor']
const Q_COLORS = { Excellent:'var(--green)', Good:'var(--teal)', Fair:'var(--orange)', Poor:'#ef4444' }

export default function Sleep({ sleepLogs, onAdd, onDelete, showToast }) {
  const [form, setForm] = useState({ bedtime:'', wakeup:'', quality:'Good', date:today })
  const f = k => v => setForm(p=>({...p,[k]:v}))

  const todaySleep = sleepLogs.find(s=>s.date===today)
  const weekEntries = sleepLogs.slice(0,7)
  const weekAvg = weekEntries.length
    ? (weekEntries.reduce((s,l)=>s+(l.duration||0),0)/weekEntries.length).toFixed(1)
    : 0

  const previewDur = () => {
    if (!form.bedtime||!form.wakeup) return null
    const [bh,bm]=form.bedtime.split(':').map(Number)
    const [wh,wm]=form.wakeup.split(':').map(Number)
    let diff=(wh*60+wm)-(bh*60+bm)
    if(diff<0) diff+=1440
    return (diff/60).toFixed(1)
  }

  const submit = async () => {
    if (!form.bedtime||!form.wakeup) { showToast('⚠️ Bedtime & wakeup required!'); return }
    await onAdd(form)
    setForm({ bedtime:'', wakeup:'', quality:'Good', date:today })
    showToast('✅ Sleep logged!')
  }

  const dur = previewDur()

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <StatCard icon="😴" label="Last Night" value={todaySleep?.duration||0} unit="hrs" color="var(--violet)" delay={0} />
        <StatCard icon="⭐" label="Quality"    value={todaySleep?.quality||'—'}        color="var(--orange)"  delay={0.07} />
        <StatCard icon="📊" label="Week Avg"   value={weekAvg}               unit="hrs" color="var(--teal)"   delay={0.14} />
      </div>

      <div className="glass fade-up delay-1" style={{ padding:28 }}>
        <SectionTitle icon="🌙" color="var(--violet)">Log Sleep</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <GlassInput  label="Date" type="date" value={form.date} onChange={f('date')} />
          <GlassSelect label="Sleep Quality" value={form.quality} onChange={f('quality')} options={QUALITY} />
          <GlassInput  label="Bedtime" type="time" value={form.bedtime} onChange={f('bedtime')} />
          <GlassInput  label="Wake Up" type="time" value={form.wakeup}  onChange={f('wakeup')} />
        </div>

        {dur && (
          <div style={{
            marginTop:18, padding:'14px 20px',
            background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.25)',
            borderRadius:14, display:'flex', alignItems:'center', gap:16
          }}>
            <span style={{ fontSize:28 }}>🌙</span>
            <div>
              <div style={{ color:'var(--violet)', fontFamily:'var(--font-head)', fontSize:22, fontWeight:900 }}>{dur} hrs</div>
              <div style={{ color:'var(--muted)', fontSize:11 }}>
                {dur>=8?'✅ Excellent sleep!':dur>=7?'👍 Good sleep':dur>=6?'⚠️ Slightly short':'❌ Not enough rest'}
              </div>
            </div>
            <Badge color={Q_COLORS[form.quality]||'var(--teal)'}>{form.quality}</Badge>
          </div>
        )}
        <div style={{ marginTop:18 }}>
          <Btn onClick={submit} color="var(--violet)" icon="🌙">Log Sleep</Btn>
        </div>
      </div>

      <div className="glass fade-up delay-2" style={{ padding:24 }}>
        <SectionTitle icon="📋" color="var(--muted2)">Sleep History ({sleepLogs.length})</SectionTitle>
        {sleepLogs.length===0 ? (
          <div style={{ color:'var(--muted)', textAlign:'center', padding:48, fontFamily:'var(--font-head)', letterSpacing:2 }}>NO SLEEP LOGGED YET</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:340, overflowY:'auto' }}>
            {sleepLogs.map(s => (
              <div key={s.id} className="glass-sm" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 16px' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:20 }}>🌙</span>
                  <span style={{ color:'var(--muted2)', fontSize:12, fontFamily:'var(--font-head)' }}>{s.date}</span>
                  <span style={{ color:'var(--text)' }}>{s.bedtime} → {s.wakeup}</span>
                  <Badge color={Q_COLORS[s.quality]||'var(--teal)'}>{s.quality}</Badge>
                </div>
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ color:'var(--violet)', fontFamily:'var(--font-head)', fontWeight:900, fontSize:15 }}>{s.duration} hrs</span>
                  <button onClick={()=>onDelete(s.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', cursor:'pointer', borderRadius:8, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
