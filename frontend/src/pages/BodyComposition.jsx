// pages/BodyComposition.jsx — Body Composition Tracker

import { useState } from 'react'
import axios from 'axios'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'

const api = axios.create({ baseURL: '/api' })

function StatBox({ label, value, unit, color, sub }) {
  return (
    <div style={{ background:`${color}08`, border:`1px solid ${color}25`, borderRadius:14, padding:'14px 12px', textAlign:'center' }}>
      <div style={{ color, fontFamily:'var(--font-head)', fontSize:24, fontWeight:900, lineHeight:1 }}>{value}</div>
      {unit && <div style={{ color:'var(--muted)', fontSize:10, marginTop:3 }}>{unit}</div>}
      <div style={{ color:'var(--muted2)', fontSize:10, marginTop:5 }}>{label}</div>
      {sub && <div style={{ color, fontSize:10, marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function BodyBar({ label, pct, color, value, ideal }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ color:'var(--text2)', fontSize:12 }}>{label}</span>
        <span style={{ color, fontFamily:'var(--font-head)', fontSize:12, fontWeight:700 }}>{value}
          {ideal && <span style={{ color:'var(--muted)', fontSize:10, marginLeft:6 }}>Ideal: {ideal}</span>}
        </span>
      </div>
      <div style={{ height:8, background:'rgba(255,255,255,0.07)', borderRadius:999, overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:999, boxShadow:`0 0 8px ${color}66`, transition:'width 1.2s cubic-bezier(.4,0,.2,1)' }}/>
      </div>
    </div>
  )
}

export default function BodyComposition({ deviceId, profile, showToast }) {
  const [form, setForm] = useState({
    weight: profile?.weight || '',
    neck:   '', waist: '', hip: '', gender: 'male'
  })
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const f = k => v => setForm(p=>({...p,[k]:v}))

  const analyze = async () => {
    if (!form.weight) { showToast('⚠️ Weight is required!'); return }
    setLoading(true)
    try {
      const res = await api.post('/advanced/body-composition', {
        device_id: deviceId,
        weight:    Number(form.weight),
        neck:      form.neck  ? Number(form.neck)  : null,
        waist:     form.waist ? Number(form.waist) : null,
        hip:       form.hip   ? Number(form.hip)   : null,
        gender:    form.gender,
      })
      setResult(res.data)
      showToast('✅ Body composition analyzed!')
    } catch (e) {
      showToast('⚠️ Analysis failed. Check backend.')
    } finally { setLoading(false) }
  }

  const bmiColor = bmi => bmi<18.5?'var(--blue)':bmi<25?'var(--green)':bmi<30?'var(--orange)':'#ef4444'
  const fatColor = (pct, gender) => {
    const hi = gender==='male' ? 25 : 32
    return pct > hi+10?'#ef4444':pct>hi?'var(--orange)':pct<(gender==='male'?6:14)?'var(--blue)':'var(--green)'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      
      <div className="glass fade-up" style={{ padding:28, borderTop:'2px solid var(--blue)' }}>
        <SectionTitle icon="⚖️" color="var(--blue)">Body Composition Analyzer</SectionTitle>
        <div style={{ color:'var(--muted)', fontSize:12, marginBottom:20, lineHeight:1.7 }}>
          Enter your measurements for an accurate body composition analysis using the <strong style={{color:'var(--text)'}}></strong>. .
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <GlassSelect label="Gender" value={form.gender} onChange={f('gender')} options={['male','female']}/>
          <GlassInput label="Weight (kg) *" type="number" value={form.weight} onChange={f('weight')} placeholder="70"/>
          <GlassInput label="Neck circumference (cm)" type="number" value={form.neck} onChange={f('neck')} placeholder="38 — optional"/>
          <GlassInput label="Waist circumference (cm)" type="number" value={form.waist} onChange={f('waist')} placeholder="80 — optional"/>
          {form.gender==='female' && (
            <GlassInput label="Hip circumference (cm)" type="number" value={form.hip} onChange={f('hip')} placeholder="95 — optional" style={{ gridColumn:'span 2' }}/>
          )}
        </div>

        <div style={{ marginTop:8, color:'var(--dim)', fontSize:11 }}>
          💡 
        </div>

        <div style={{ marginTop:18 }}>
          <button onClick={analyze} disabled={loading} style={{ width:"100%",background:loading?"rgba(255,255,255,0.05)":"rgba(56,189,248,0.18)",border:loading?"1.5px solid rgba(255,255,255,0.08)":"1.5px solid rgba(56,189,248,0.6)",borderRadius:12,padding:"14px",color:"#38bdf8",fontWeight:900,fontSize:14,cursor:loading?"wait":"pointer",fontFamily:"'Orbitron',monospace",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"none",minHeight:50,marginTop:6,opacity:loading?0.7:1 }}><span style={{fontSize:18}}>{loading?"⏳":"🔬"}</span><span style={{color:loading?"#6b7f96":"#38bdf8"}}>{loading?"ANALYZING...":"ANALYZE BODY"}</span></button>
        </div>
      </div>

      
      {result && (
        <>
          
          <div className="glass fade-up" style={{ padding:24, borderTop:`2px solid ${bmiColor(result.bmi)}` }}>
            <SectionTitle icon="📊" color="var(--text)">Analysis Results</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
              <StatBox label="BMI" value={result.bmi} color={bmiColor(result.bmi)} sub={result.bmi_category}/>
              <StatBox label="Body Fat" value={`${result.body_fat_pct}%`} color={fatColor(result.body_fat_pct, form.gender)} sub={result.fat_category}/>
              <StatBox label="Lean Mass" value={`${result.lean_mass_kg}`} unit="kg" color="var(--teal)" sub="Muscle + Bone + Water"/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              <StatBox label="Fat Mass" value={`${result.body_fat_kg}`} unit="kg" color="var(--orange)"/>
              <StatBox label="Water %" value={`${result.water_weight_pct}%`} color="var(--blue)" sub="Body Water Est."/>
              <StatBox label="Visceral Fat" value={result.visceral_estimate.split(' ')[0]} color={result.visceral_estimate.includes('High')?'#ef4444':'var(--green)'} sub={result.visceral_estimate}/>
            </div>
          </div>

          
          <div className="glass fade-up delay-1" style={{ padding:24, borderTop:'2px solid var(--violet)' }}>
            <SectionTitle icon="🏋️" color="var(--violet)">Body Breakdown</SectionTitle>
            <BodyBar label="Body Fat %" pct={result.body_fat_pct} color={fatColor(result.body_fat_pct,form.gender)} value={`${result.body_fat_pct}%`} ideal={form.gender==='male'?'10–20%':'18–28%'}/>
            <BodyBar label="Lean Mass %" pct={100-result.body_fat_pct} color="var(--teal)" value={`${(100-result.body_fat_pct).toFixed(1)}%`} ideal={form.gender==='male'?'80–90%':'72–82%'}/>
            <BodyBar label="Water Content" pct={result.water_weight_pct} color="var(--blue)" value={`${result.water_weight_pct}%`} ideal="60–70%"/>

            
            <div style={{ marginTop:18, background:'rgba(0,255,231,0.06)', border:'1px solid rgba(0,255,231,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:16 }}>
              <span style={{ fontSize:24 }}>🎯</span>
              <div>
                <div style={{ color:'var(--teal)', fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, marginBottom:4 }}>IDEAL WEIGHT RANGE</div>
                <div style={{ color:'var(--text)', fontSize:16, fontWeight:700 }}>{result.ideal_weight_low} — {result.ideal_weight_high} kg</div>
                <div style={{ color:'var(--muted)', fontSize:11, marginTop:2 }}>Based on Devine formula for your height</div>
              </div>
              {form.weight > result.ideal_weight_high && (
                <Badge color="var(--orange)">↓ {(Number(form.weight)-result.ideal_weight_high).toFixed(1)} kg to lose</Badge>
              )}
              {form.weight < result.ideal_weight_low && (
                <Badge color="var(--blue)">↑ {(result.ideal_weight_low-Number(form.weight)).toFixed(1)} kg to gain</Badge>
              )}
              {form.weight >= result.ideal_weight_low && form.weight <= result.ideal_weight_high && (
                <Badge color="var(--green)">✅ In ideal range</Badge>
              )}
            </div>
          </div>

          
          <div className="glass fade-up delay-2" style={{ padding:24, borderTop:'2px solid var(--orange)' }}>
            <SectionTitle icon="🔥" color="var(--orange)">Calorie Targets</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              <StatBox label="BMR (at rest)" value={result.bmr.toLocaleString()} unit="kcal/day" color="var(--blue)" sub="Base metabolism"/>
              <StatBox label="TDEE (active)" value={result.tdee.toLocaleString()} unit="kcal/day" color="var(--teal)" sub="Maintenance"/>
              <StatBox label="For Weight Loss" value={result.to_lose_500.toLocaleString()} unit="kcal/day" color="var(--green)" sub="–0.5 kg/week"/>
            </div>
            <div style={{ marginTop:12, background:'rgba(251,146,60,0.06)', border:'1px solid rgba(251,146,60,0.2)', borderRadius:12, padding:'12px 16px', color:'var(--muted)', fontSize:12, lineHeight:1.7 }}>
              🔥 <strong style={{color:'var(--text)'}}>BMR</strong> = calories you burn doing nothing (Mifflin-StJeor formula) &nbsp;·&nbsp;
              <strong style={{color:'var(--text)'}}>TDEE</strong> = total daily burn with moderate activity &nbsp;·&nbsp;
              Eat {result.to_lose_500} kcal/day to lose 0.5 kg/week safely.
            </div>
          </div>

          
          <div className="glass fade-up delay-3" style={{ padding:24, borderTop:'2px solid var(--green)' }}>
            <SectionTitle icon="💡" color="var(--green)">Personalized Tips</SectionTitle>
            {result.tips.map((tip,i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems:'flex-start' }}>
                <span style={{ color:'var(--green)', fontSize:16, flexShrink:0 }}>→</span>
                <span style={{ color:'var(--text2)', fontSize:13 }}>{tip}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
