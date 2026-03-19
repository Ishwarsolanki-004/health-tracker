import { useState } from 'react'
import { GlassInput, Btn, SectionTitle } from '../components/GlassInput'

const today = new Date().toISOString().split('T')[0]
const bmiColor = b => b<18.5?'var(--blue)':b<25?'var(--green)':b<30?'var(--orange)':'#ef4444'
const bmiCat   = b => b<18.5?'Underweight':b<25?'Healthy':b<30?'Overweight':'Obese'

export default function Goals({ goals, onUpdateGoals, profile, onUpdateProfile, activities, sleepLogs, waterToday, showToast }) {
  const [editGoals,   setEditGoals]   = useState(false)
  const [editProfile, setEditProfile] = useState(false)
  const [tmpGoals,    setTmpGoals]    = useState(goals)
  const [tmpProfile,  setTmpProfile]  = useState(profile)

  const todayActs  = activities.filter(l=>l.date===today)
  const todaySteps = todayActs.reduce((s,l)=>s+(l.steps||0),0)
  const todayCals  = todayActs.reduce((s,l)=>s+(l.calories||0),0)
  const todayExerc = todayActs.reduce((s,l)=>s+(l.duration||0),0)
  const todaySleep = sleepLogs.find(s=>s.date===today)

  const bmi = profile.weight&&profile.height
    ? +(profile.weight/((profile.height/100)**2)).toFixed(1) : null

  const GOAL_ROWS = [
    { key:'steps',    label:'Daily Steps',     current:todaySteps,             color:'var(--teal)',   icon:'🦶' },
    { key:'calories', label:'Calories Burned', current:todayCals,              color:'var(--pink)',   icon:'🔥' },
    { key:'water',    label:'Water (L)',        current:waterToday,             color:'var(--green)',  icon:'💧' },
    { key:'sleep',    label:'Sleep (hrs)',      current:todaySleep?.duration||0, color:'var(--violet)', icon:'😴' },
    { key:'exercise', label:'Exercise (min)',   current:todayExerc,             color:'var(--orange)', icon:'🏃' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Goals */}
      <div className="glass fade-up" style={{ padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <SectionTitle icon="🎯" color="var(--teal)">Daily Goals</SectionTitle>
          {!editGoals
            ? <Btn onClick={()=>{setTmpGoals(goals);setEditGoals(true)}} color="var(--teal)" variant="outline">Edit Goals</Btn>
            : <div style={{ display:'flex', gap:10 }}>
                <Btn onClick={async()=>{ await onUpdateGoals(tmpGoals); setEditGoals(false); showToast('✅ Goals saved!') }} color="var(--green)">Save</Btn>
                <Btn onClick={()=>setEditGoals(false)} color="var(--muted2)" variant="outline">Cancel</Btn>
              </div>
          }
        </div>

        {editGoals ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {GOAL_ROWS.map(g => (
              <GlassInput key={g.key} label={`${g.icon} ${g.label}`} type="number"
                value={tmpGoals[g.key]||''}
                onChange={v=>setTmpGoals(p=>({...p,[g.key]:Number(v)}))} />
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {GOAL_ROWS.map(g => {
              const pct = Math.min(g.current/(goals[g.key]||1)*100,100)
              return (
                <div key={g.key}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{g.icon}</span>
                      <span style={{ fontSize:13, fontFamily:'var(--font-head)', letterSpacing:0.5 }}>{g.label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ color:g.color, fontFamily:'var(--font-head)', fontWeight:700, fontSize:14 }}>{g.current}</span>
                      <span style={{ color:'var(--muted)', fontSize:12 }}>/ {goals[g.key]}</span>
                      <div style={{
                        background:`${g.color}18`, border:`1px solid ${g.color}33`,
                        borderRadius:999, padding:'2px 8px',
                        color:g.color, fontSize:10, fontFamily:'var(--font-head)'
                      }}>{Math.round(pct)}%</div>
                    </div>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                    <div className="progress-bar" style={{
                      height:'100%', borderRadius:999,
                      background:`linear-gradient(90deg, ${g.color}cc, ${g.color})`,
                      boxShadow:`0 0 8px ${g.color}66`,
                      width:`${pct}%`
                    }}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="glass fade-up delay-1" style={{ padding:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <SectionTitle icon="👤" color="var(--blue)">Profile</SectionTitle>
          {!editProfile
            ? <Btn onClick={()=>{setTmpProfile(profile);setEditProfile(true)}} color="var(--blue)" variant="outline">Edit Profile</Btn>
            : <div style={{ display:'flex', gap:10 }}>
                <Btn onClick={async()=>{ await onUpdateProfile(tmpProfile); setEditProfile(false); showToast('✅ Profile saved!') }} color="var(--green)">Save</Btn>
                <Btn onClick={()=>setEditProfile(false)} color="var(--muted2)" variant="outline">Cancel</Btn>
              </div>
          }
        </div>

        {editProfile ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <GlassInput label="Name"        value={tmpProfile.name||''}   onChange={v=>setTmpProfile(p=>({...p,name:v}))} />
            <GlassInput label="Age"         type="number" value={tmpProfile.age||''}    onChange={v=>setTmpProfile(p=>({...p,age:Number(v)}))} />
            <GlassInput label="Weight (kg)" type="number" value={tmpProfile.weight||''} onChange={v=>setTmpProfile(p=>({...p,weight:Number(v)}))} />
            <GlassInput label="Height (cm)" type="number" value={tmpProfile.height||''} onChange={v=>setTmpProfile(p=>({...p,height:Number(v)}))} />
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {[['👤 Name',profile.name],['🎂 Age',`${profile.age} yrs`],['⚖️ Weight',`${profile.weight} kg`],['📏 Height',`${profile.height} cm`]].map(([l,v])=>(
              <div key={l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'14px 18px' }}>
                <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:6 }}>{l}</div>
                <div style={{ fontWeight:700, fontSize:16 }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* BMI display */}
        {bmi && (
          <div style={{
            display:'flex', gap:20, alignItems:'center', marginTop:10,
            background:`${bmiColor(bmi)}08`, border:`1px solid ${bmiColor(bmi)}22`,
            borderRadius:16, padding:'18px 24px'
          }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ color:bmiColor(bmi), fontFamily:'var(--font-head)', fontSize:36, fontWeight:900, textShadow:`0 0 24px ${bmiColor(bmi)}88` }}>{bmi}</div>
              <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1, textTransform:'uppercase' }}>BMI</div>
            </div>
            <div style={{ width:1, height:50, background:'rgba(255,255,255,0.08)' }}/>
            <div>
              <div style={{ color:bmiColor(bmi), fontFamily:'var(--font-head)', fontSize:18, fontWeight:700 }}>{bmiCat(bmi)}</div>
              <div style={{ color:'var(--muted2)', fontSize:13, marginTop:4 }}>
                {bmi<18.5 ? 'Consider increasing calorie intake.'
                 : bmi<25 ? '✅ You are in the healthy range!'
                 : bmi<30 ? 'More exercise & balanced diet recommended.'
                 : '🔴 Please consult a healthcare professional.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
