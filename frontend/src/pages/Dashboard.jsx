// pages/Dashboard.jsx — Stylish dashboard with neon rings

import CircleProgress from '../components/CircleProgress'
import StatCard from '../components/StatCard'
import WeekBar from '../components/WeekBar'
import { Btn, Badge, SectionTitle } from '../components/GlassInput'

const today = new Date().toISOString().split('T')[0]
const last7  = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split('T')[0] })

const MOOD_DATA = [
  { emoji:'😭', label:'Very Sad',  color:'#60a5fa' },
  { emoji:'😔', label:'Sad',       color:'#a78bfa' },
  { emoji:'😐', label:'Neutral',   color:'#fbbf24' },
  { emoji:'😊', label:'Happy',     color:'#34d399' },
  { emoji:'🤩', label:'Excited',   color:'#f472b6' },
]

export default function Dashboard({ activities, nutrition, sleepLogs, waterToday, goals, mood, setMood, addWater, showToast }) {
  const todayActs  = activities.filter(l=>l.date===today)
  const todaySteps = todayActs.reduce((s,l)=>s+(l.steps||0),0)
  const todayCals  = todayActs.reduce((s,l)=>s+(l.calories||0),0)
  const todayExerc = todayActs.reduce((s,l)=>s+(l.duration||0),0)
  const todayNut   = nutrition.filter(n=>n.date===today)
  const todayCalIn = todayNut.reduce((s,n)=>s+(n.calories||0),0)
  const todaySleep = sleepLogs.find(s=>s.date===today)

  const weekSteps = last7.map(d=>activities.filter(l=>l.date===d).reduce((s,l)=>s+(l.steps||0),0))
  const weekCals  = last7.map(d=>activities.filter(l=>l.date===d).reduce((s,l)=>s+(l.calories||0),0))
  const weekSleep = last7.map(d=>{ const sl=sleepLogs.find(s=>s.date===d); return sl?.duration||0 })
  const weekWater = last7.map((_,i)=>i===6?waterToday:0)

  const RINGS = [
    { value:todaySteps, max:goals.steps, color:'var(--teal)', label:'Steps', unit:`/${goals.steps}` },
    { value:todayCals, max:goals.calories, color:'var(--pink)', label:'Burned', unit:'kcal' },
    { value:todayCalIn, max:goals.calories, color:'var(--blue)', label:'Intake', unit:'kcal' },
    { value:waterToday, max:goals.water, color:'var(--green)', label:'Water', unit:`/${goals.water}L` },
    { value:todayExerc, max:goals.exercise, color:'var(--orange)', label:'Exercise', unit:'min' },
    { value:todaySleep?.duration||0, max:goals.sleep, color:'var(--violet)', label:'Sleep', unit:'hrs' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Mood Bar */}
      <div className="glass fade-up" style={{ padding:'18px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <span style={{ color:'var(--muted2)', fontSize:10, letterSpacing:2, textTransform:'uppercase', fontFamily:'var(--font-head)' }}>Today's Mood</span>
        <div style={{ display:'flex', gap:8 }}>
          {MOOD_DATA.map((m,i) => (
            <button key={i} onClick={() => { setMood(i); showToast(`Mood: ${m.label}`) }}
              style={{
                fontSize:26, background: mood===i ? `${m.color}22` : 'transparent',
                border:`2px solid ${mood===i ? m.color : 'transparent'}`,
                borderRadius:12, padding:'6px 10px', cursor:'pointer',
                transition:'all 0.2s',
                transform: mood===i ? 'scale(1.25)' : 'scale(1)',
                boxShadow: mood===i ? `0 0 16px ${m.color}66` : 'none'
              }}>{m.emoji}
            </button>
          ))}
        </div>
        {mood!==null && <Badge color={MOOD_DATA[mood].color}>{MOOD_DATA[mood].label}</Badge>}
        <div style={{ marginLeft:'auto', color:'var(--muted)', fontSize:11, fontFamily:'var(--font-head)' }}>
          {new Date().toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric'})}
        </div>
      </div>

      {/* Rings panel */}
      <div className="glass fade-up delay-1 glow-teal scan-effect" style={{ padding:'28px 24px', position:'relative' }}>
        <SectionTitle icon="⭕" color="var(--teal)">Activity Rings</SectionTitle>
        <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:20 }}>
          {RINGS.map((r,i) => (
            <div key={i} style={{ animation:`fadeUp 0.5s cubic-bezier(.2,.8,.2,1) ${0.1+i*0.08}s both` }}>
              <CircleProgress {...r} size={96} stroke={8} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:14 }}>
        {[
          { icon:'🦶', label:'Steps', value:todaySteps.toLocaleString(), color:'var(--teal)', sub:`Goal: ${goals.steps.toLocaleString()}`, delay:0 },
          { icon:'🔥', label:'Cal Out', value:todayCals, unit:'kcal', color:'var(--pink)', delay:0.06 },
          { icon:'🍽️', label:'Cal In', value:todayCalIn, unit:'kcal', color:'var(--blue)', delay:0.12 },
          { icon:'💧', label:'Water', value:waterToday, unit:'L', color:'var(--green)', sub:`Goal: ${goals.water}L`, delay:0.18 },
          { icon:'🏃', label:'Exercise', value:todayExerc, unit:'min', color:'var(--orange)', delay:0.24 },
          { icon:'😴', label:'Sleep', value:todaySleep?.duration||0, unit:'hrs', color:'var(--violet)', delay:0.30 },
        ].map(p => <StatCard key={p.label} {...p}/>)}
      </div>

      {/* Water quick add */}
      <div className="glass fade-up delay-2" style={{ padding:'20px 24px' }}>
        <SectionTitle icon="💧" color="var(--green)">Quick Water Log</SectionTitle>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {[0.25, 0.5, 1, 1.5].map(v => (
            <Btn key={v} color="var(--green)" variant="outline"
              onClick={() => { addWater(v); showToast(`+${v}L added! 💧`) }}>+{v}L</Btn>
          ))}
          {/* Water visual */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
            <div style={{
              width:44, height:44, borderRadius:'50%', overflow:'hidden',
              background:`linear-gradient(180deg, var(--teal)44, var(--teal)22)`,
              border:'2px solid var(--teal)44',
              display:'flex', alignItems:'center', justifyContent:'center',
              animation:'wave 3s ease-in-out infinite',
              fontSize:22
            }}>💧</div>
            <div>
              <div style={{ color:'var(--teal)', fontFamily:'var(--font-head)', fontSize:22, fontWeight:900 }}>{waterToday}L</div>
              <div style={{ color:'var(--muted)', fontSize:10 }}>{Math.round(waterToday/goals.water*100)}% of goal</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ flex:1, minWidth:100, height:6, background:'rgba(255,255,255,0.06)', borderRadius:999 }}>
            <div className="progress-bar" style={{
              height:'100%', borderRadius:999,
              background:'linear-gradient(90deg, var(--teal), var(--blue))',
              boxShadow:'0 0 8px var(--teal)66',
              width:`${Math.min(waterToday/goals.water*100,100)}%`
            }}/>
          </div>
        </div>
      </div>

      {/* Week charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {[
          { data:weekSteps, label:'Weekly Steps', color:'var(--teal)' },
          { data:weekSleep, label:'Sleep (hrs)', color:'var(--violet)' },
          { data:weekCals,  label:'Cal Burned', color:'var(--pink)' },
          { data:weekWater, label:'Water (L)', color:'var(--green)' },
        ].map((w,i) => (
          <div key={w.label} className="glass fade-up" style={{ padding:'20px', animationDelay:`${0.1+i*0.07}s` }}>
            <WeekBar data={w.data} label={w.label} color={w.color} />
          </div>
        ))}
      </div>

      {/* Today's activity list */}
      {todayActs.length > 0 && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="🏃" color="var(--teal)">Today's Activities</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {todayActs.map(l => (
              <div key={l.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                background:'rgba(255,255,255,0.03)', borderRadius:14,
                padding:'14px 18px', border:'1px solid rgba(255,255,255,0.05)',
                transition:'all 0.2s'
              }}>
                <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                  <div style={{
                    width:40, height:40, borderRadius:12,
                    background:'rgba(0,255,231,0.1)', border:'1px solid rgba(0,255,231,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20
                  }}>
                    {{'Running':'🏃','Cycling':'🚴','Swimming':'🏊','Yoga':'🧘','Gym':'💪','Meditation':'🧠','HIIT':'⚡','Walking':'🚶'}[l.type]||'🏃'}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontFamily:'var(--font-head)', fontSize:13 }}>{l.type}</div>
                    <div style={{ color:'var(--muted2)', fontSize:12, marginTop:2 }}>{l.duration} min {l.notes?`· ${l.notes}`:''}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                  {l.calories>0 && <div style={{ textAlign:'right' }}>
                    <div style={{ color:'var(--pink)', fontWeight:900, fontFamily:'var(--font-head)', fontSize:15 }}>{l.calories}</div>
                    <div style={{ color:'var(--muted)', fontSize:10 }}>kcal</div>
                  </div>}
                  {l.steps>0 && <div style={{ textAlign:'right' }}>
                    <div style={{ color:'var(--teal)', fontWeight:900, fontFamily:'var(--font-head)', fontSize:15 }}>{Number(l.steps).toLocaleString()}</div>
                    <div style={{ color:'var(--muted)', fontSize:10 }}>steps</div>
                  </div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
