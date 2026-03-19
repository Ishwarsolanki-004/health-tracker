import { useState } from 'react'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'
import StatCard from '../components/StatCard'

const today = new Date().toISOString().split('T')[0]
const MEALS = ['Breakfast','Lunch','Dinner','Snack']
const MEAL_ICONS = { Breakfast:'🌅', Lunch:'☀️', Dinner:'🌙', Snack:'🍿' }

export default function Nutrition({ nutrition = [], onAdd, onDelete, showToast }) {
  const [form, setForm] = useState({
    meal:'Breakfast', item:'', calories:'', protein:'', carbs:'', fat:'', date:today
  })
  const f = k => v => setForm(p => ({ ...p, [k]: v }))

  const todayNut   = nutrition.filter(n => n.date === today)
  const todayCalIn = todayNut.reduce((s, n) => s + (Number(n.calories) || 0), 0)
  const todayProt  = +todayNut.reduce((s, n) => s + (Number(n.protein) || 0), 0).toFixed(1)
  const todayCarbs = +todayNut.reduce((s, n) => s + (Number(n.carbs) || 0), 0).toFixed(1)
  const todayFat   = +todayNut.reduce((s, n) => s + (Number(n.fat) || 0), 0).toFixed(1)
  const totalMacro = (todayProt + todayCarbs + todayFat) || 1

  const submit = async () => {
    if (!form.item || !form.calories) { showToast('⚠️ Item & calories required!'); return }
    await onAdd({
      ...form,
      calories: Number(form.calories),
      protein:  Number(form.protein) || 0,
      carbs:    Number(form.carbs) || 0,
      fat:      Number(form.fat) || 0,
    })
    setForm({ meal:'Breakfast', item:'', calories:'', protein:'', carbs:'', fat:'', date:today })
    showToast('✅ Meal logged!')
  }

  const macros = [
    { val: todayProt,  color: 'var(--green)',  label: 'P' },
    { val: todayCarbs, color: 'var(--orange)', label: 'C' },
    { val: todayFat,   color: 'var(--pink)',   label: 'F' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Today macros */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <StatCard icon="🔥" label="Calories" value={todayCalIn} unit="kcal" color="var(--blue)"   delay={0}    />
        <StatCard icon="🥩" label="Protein"  value={todayProt}  unit="g"   color="var(--green)"  delay={0.06} />
        <StatCard icon="🍞" label="Carbs"    value={todayCarbs} unit="g"   color="var(--orange)" delay={0.12} />
        <StatCard icon="🧈" label="Fat"      value={todayFat}   unit="g"   color="var(--pink)"   delay={0.18} />
      </div>

      {/* Macro split bar */}
      <div className="glass fade-up" style={{ padding:'20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
          <span style={{ color:'var(--blue)', fontFamily:'var(--font-head)', fontSize:13, fontWeight:700, letterSpacing:1 }}>📊 MACRO SPLIT TODAY</span>
          <div style={{ flex:1, height:1, background:'linear-gradient(90deg,var(--blue)30,transparent)' }} />
          <div style={{ display:'flex', gap:12 }}>
            {macros.map(m => (
              <span key={m.label} style={{ color:m.color, fontSize:11, fontFamily:'var(--font-head)', fontWeight:700 }}>
                {m.label} {Math.round((m.val/totalMacro)*100)}%
              </span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', height:14, borderRadius:999, overflow:'hidden', gap:2 }}>
          {macros.map(m => (
            <div key={m.label} style={{
              width: `${(m.val / totalMacro) * 100}%`,
              minWidth: m.val > 0 ? 4 : 0,
              height: '100%',
              background: m.color,
              boxShadow: `0 0 8px ${m.color}66`,
              transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
              borderRadius: 999,
            }} />
          ))}
        </div>
      </div>

      {/* Log meal form */}
      <div className="glass fade-up delay-1" style={{ padding:28 }}>
        <SectionTitle icon="🍴" color="var(--blue)">Log Meal</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <GlassSelect label="Meal Type" value={form.meal} onChange={f('meal')} options={MEALS} />
          <GlassInput  label="Date" type="date" value={form.date} onChange={f('date')} />
          <GlassInput
            label="Food Item" value={form.item} onChange={f('item')}
            placeholder="e.g. Dal Rice, Roti Sabzi"
            style={{ gridColumn:'span 2' }}
          />
          <GlassInput label="Calories"    type="number" value={form.calories} onChange={f('calories')} placeholder="350" />
          <GlassInput label="Protein (g)" type="number" value={form.protein}  onChange={f('protein')}  placeholder="25"  />
          <GlassInput label="Carbs (g)"   type="number" value={form.carbs}    onChange={f('carbs')}    placeholder="45"  />
          <GlassInput label="Fat (g)"     type="number" value={form.fat}      onChange={f('fat')}      placeholder="12"  />
        </div>
        <div style={{ marginTop:20 }}>
          <Btn onClick={submit} color="var(--blue)" icon={MEAL_ICONS[form.meal]}>
            Log {form.meal}
          </Btn>
        </div>
      </div>

      {/* History */}
      <div className="glass fade-up delay-2" style={{ padding:24 }}>
        <SectionTitle icon="📋" color="var(--muted2)">
          Meal History ({nutrition.length})
        </SectionTitle>

        {nutrition.length === 0 ? (
          <div style={{
            color:'var(--muted)', textAlign:'center', padding:48,
            fontFamily:'var(--font-head)', letterSpacing:2, fontSize:12
          }}>NO MEALS LOGGED YET</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:380, overflowY:'auto' }}>
            {nutrition.map(n => (
              <div key={n.id} className="glass-sm" style={{
                display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 16px'
              }}>
                <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontSize:18 }}>{MEAL_ICONS[n.meal] || '🍽️'}</span>
                  <Badge color="var(--blue)">{n.meal}</Badge>
                  <span style={{ fontWeight:700 }}>{n.item}</span>
                  <span style={{ color:'var(--muted2)', fontSize:11, fontFamily:'var(--font-head)' }}>{n.date}</span>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center', flexShrink:0 }}>
                  <span style={{ color:'var(--blue)', fontFamily:'var(--font-head)', fontWeight:700 }}>{n.calories} kcal</span>
                  {Number(n.protein) > 0 && <span style={{ color:'var(--green)',  fontSize:12 }}>P:{n.protein}g</span>}
                  {Number(n.carbs)   > 0 && <span style={{ color:'var(--orange)', fontSize:12 }}>C:{n.carbs}g</span>}
                  {Number(n.fat)     > 0 && <span style={{ color:'var(--pink)',   fontSize:12 }}>F:{n.fat}g</span>}
                  <button onClick={() => onDelete(n.id)} style={{
                    background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
                    color:'#ef4444', cursor:'pointer', borderRadius:8,
                    width:28, height:28, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:13, transition:'all 0.2s'
                  }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
