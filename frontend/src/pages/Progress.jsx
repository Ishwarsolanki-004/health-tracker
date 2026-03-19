import WeekBar from '../components/WeekBar'
import StatCard from '../components/StatCard'
import { SectionTitle } from '../components/GlassInput'

const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split('T')[0] })

export default function Progress({ activities, sleepLogs, nutrition }) {
  const weekSteps = last7.map(d=>activities.filter(l=>l.date===d).reduce((s,l)=>s+(l.steps||0),0))
  const weekCals  = last7.map(d=>activities.filter(l=>l.date===d).reduce((s,l)=>s+(l.calories||0),0))
  const weekSleep = last7.map(d=>{ const sl=sleepLogs.find(s=>s.date===d); return sl?.duration||0 })

  const charts = [
    { data:weekSteps, label:'Daily Steps',    color:'var(--teal)' },
    { data:weekSleep, label:'Sleep (hrs)',     color:'var(--violet)' },
    { data:weekCals,  label:'Calories Burned', color:'var(--pink)' },
  ]

  const totalSteps = activities.reduce((s,l)=>s+(l.steps||0),0)
  const totalCals  = activities.reduce((s,l)=>s+(l.calories||0),0)
  const totalExerc = activities.reduce((s,l)=>s+(l.duration||0),0)
  const avgSleep   = sleepLogs.length?(sleepLogs.reduce((s,l)=>s+(l.duration||0),0)/sleepLogs.length).toFixed(1):0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div className="glass fade-up" style={{ padding:28 }}>
        <SectionTitle icon="📈" color="var(--teal)">7-Day Progress</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {charts.map((w,i) => (
            <div key={w.label} className="glass-sm" style={{ padding:20, animationDelay:`${i*0.1}s` }}>
              <WeekBar data={w.data} label={w.label} color={w.color} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:12 }}>
                <span style={{ color:'var(--muted)', fontSize:11 }}>
                  Avg: <span style={{ color:w.color, fontFamily:'var(--font-head)' }}>{(w.data.reduce((a,b)=>a+b,0)/7).toFixed(0)}</span>
                </span>
                <span style={{ color:'var(--muted)', fontSize:11 }}>
                  Best: <span style={{ color:w.color, fontFamily:'var(--font-head)' }}>{Math.max(...w.data).toFixed(0)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass fade-up delay-1" style={{ padding:28 }}>
        <SectionTitle icon="🏆" color="var(--orange)">All-Time Records</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          <StatCard icon="🦶" label="Total Steps"    value={`${(totalSteps/1000).toFixed(1)}K`}  color="var(--teal)"   delay={0} />
          <StatCard icon="🔥" label="Total Burned"   value={totalCals}  unit="kcal"               color="var(--pink)"   delay={0.08} />
          <StatCard icon="⏱️" label="Total Exercise" value={totalExerc} unit="min"                color="var(--orange)" delay={0.16} />
          <StatCard icon="🍽️" label="Meals Logged"   value={nutrition.length}                     color="var(--blue)"   delay={0.24} />
          <StatCard icon="😴" label="Avg Sleep"      value={avgSleep}   unit="hrs/night"          color="var(--violet)" delay={0.32} />
          <StatCard icon="🏃" label="Activities"     value={activities.length}                    color="var(--green)"  delay={0.40} />
        </div>
      </div>

      {/* Personal Bests */}
      {activities.length > 0 && (
        <div className="glass fade-up delay-2" style={{ padding:28 }}>
          <SectionTitle icon="⚡" color="var(--pink)">Personal Bests</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { label:'Most Steps in a Day',  value:Math.max(...last7.map(d=>activities.filter(l=>l.date===d).reduce((s,l)=>s+(l.steps||0),0))).toLocaleString(), color:'var(--teal)', unit:'steps' },
              { label:'Most Calories Burned', value:Math.max(...last7.map(d=>activities.filter(l=>l.date===d).reduce((s,l)=>s+(l.calories||0),0))), color:'var(--pink)', unit:'kcal' },
              { label:'Longest Session',      value:Math.max(...activities.map(l=>l.duration||0)), color:'var(--orange)', unit:'min' },
            ].map(b => (
              <div key={b.label} style={{
                background:`${b.color}08`, border:`1px solid ${b.color}22`,
                borderRadius:16, padding:'18px 20px', textAlign:'center'
              }}>
                <div style={{ color:b.color, fontFamily:'var(--font-head)', fontSize:26, fontWeight:900, textShadow:`0 0 20px ${b.color}88` }}>{b.value}</div>
                <div style={{ color:'var(--muted2)', fontSize:10, marginTop:2 }}>{b.unit}</div>
                <div style={{ color:'var(--muted)', fontSize:10, marginTop:6, letterSpacing:0.5 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
