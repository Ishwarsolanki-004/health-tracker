function hexToRgb(hex){const h=(hex||'#38bdf8').replace('#','');return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`}

import { useState } from 'react'
import { GlassInput, GlassSelect, Badge, SectionTitle } from '../components/GlassInput'

const today = new Date().toISOString().split('T')[0]
const MEALS  = ['Breakfast','Lunch','Dinner','Snack','Pre-Workout','Post-Workout']
const MEAL_IC= { Breakfast:'🌅', Lunch:'☀️', Dinner:'🌙', Snack:'🍎', 'Pre-Workout':'⚡', 'Post-Workout':'💪' }
const MEAL_COL={ Breakfast:'#fb923c', Lunch:'#38bdf8', Dinner:'#a78bfa', Snack:'#22d3a5', 'Pre-Workout':'#00ffe7', 'Post-Workout':'#ff2d78' }

export default function Nutrition({ nutrition, onAdd, onDelete, showToast }) {
  const [meal,    setMeal]    = useState('Breakfast')
  const [item,    setItem]    = useState('')
  const [calories,setCalories]= useState('')
  const [protein, setProtein] = useState('')
  const [carbs,   setCarbs]   = useState('')
  const [fat,     setFat]     = useState('')
  const [date,    setDate]    = useState(today)

  const mealColor = MEAL_COL[meal] || '#38bdf8'

  const handleLog = async () => {
    if (!item.trim())  { showToast('⚠️ Enter food item!'); return }
    if (!calories)     { showToast('⚠️ Enter calories!'); return }
    await onAdd({ meal, item:item.trim(), calories:Number(calories), protein:Number(protein)||0, carbs:Number(carbs)||0, fat:Number(fat)||0, date })
    showToast(`✅ ${meal} logged!`)
    setItem(''); setCalories(''); setProtein(''); setCarbs(''); setFat('')
  }

  const todayNut   = Array.isArray(nutrition) ? nutrition.filter(n=>n.date===today) : []
  const totalCal   = todayNut.reduce((s,n)=>s+(n.calories||0),0)
  const totalProt  = todayNut.reduce((s,n)=>s+(n.protein||0),0)
  const totalCarb  = todayNut.reduce((s,n)=>s+(n.carbs||0),0)
  const totalFat   = todayNut.reduce((s,n)=>s+(n.fat||0),0)
  const macroTotal = totalProt+totalCarb+totalFat||1

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      
      {todayNut.length>0 && (
        <div className="glass fade-up" style={{ padding:18, borderTop:'2px solid #38bdf8' }}>
          <SectionTitle icon="📊" color="var(--blue)">Today's Nutrition</SectionTitle>
          <div style={{ display:'flex', justifyContent:'space-around', marginBottom:10, flexWrap:'wrap', gap:8 }}>
            {[['Calories',totalCal,'kcal','#38bdf8'],['Protein',totalProt.toFixed(0),'g','#22d3a5'],['Carbs',totalCarb.toFixed(0),'g','#fb923c'],['Fat',totalFat.toFixed(0),'g','#ff2d78']].map(([l,v,u,c])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ color:c, fontFamily:"'Orbitron',monospace", fontSize:20, fontWeight:900 }}>{v}</div>
                <div style={{ color:'#94a3b8', fontSize:10 }}>{u} {l}</div>
              </div>
            ))}
          </div>
          <div style={{ height:8, borderRadius:999, overflow:'hidden', display:'flex' }}>
            <div style={{ width:`${totalProt/macroTotal*100}%`, background:'#22d3a5' }}/>
            <div style={{ width:`${totalCarb/macroTotal*100}%`, background:'#fb923c' }}/>
            <div style={{ width:`${totalFat/macroTotal*100}%`,  background:'#ff2d78' }}/>
          </div>
        </div>
      )}

      
      <div className="glass fade-up delay-1" style={{ padding:22, borderTop:`2px solid ${mealColor}` }}>
        <SectionTitle icon="🍽️" color="var(--blue)">Log Meal</SectionTitle>

        
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          {MEALS.map(m => (
            <button key={m} onClick={()=>setMeal(m)} style={{
              padding:'8px 12px', borderRadius:10,
              border: `2px solid ${meal===m ? MEAL_COL[m] : 'rgba(255,255,255,0.1)'}`,
              background: meal===m ? `${MEAL_COL[m]}22` : 'rgba(255,255,255,0.03)',
              color: meal===m ? MEAL_COL[m] : '#94a3b8',
              fontFamily:"'Orbitron',monospace", fontSize:9, cursor:'pointer',
              fontWeight: meal===m ? 700 : 400,
              display:'flex', alignItems:'center', gap:4, minHeight:'auto',
            }}>
              <span>{MEAL_IC[m]}</span>{m}
            </button>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <GlassInput label="Food Item"   value={item}    onChange={setItem}     placeholder="e.g. Dal Rice" style={{ gridColumn:'span 2' }}/>
          <GlassInput label="Calories"    type="number" value={calories} onChange={setCalories} placeholder="350"/>
          <GlassInput label="Date"        type="date"   value={date}     onChange={setDate}/>
          <GlassInput label="Protein (g)" type="number" value={protein}  onChange={setProtein}  placeholder="25"/>
          <GlassInput label="Carbs (g)"   type="number" value={carbs}    onChange={setCarbs}    placeholder="45"/>
          <GlassInput label="Fat (g)"     type="number" value={fat}      onChange={setFat}      placeholder="12" style={{ gridColumn:'span 2' }}/>
        </div>

        
        <button onClick={handleLog} style={{
          width:'100%', background:`rgba(${hexToRgb(mealColor)},0.18)`, border:`1.5px solid rgba(${hexToRgb(mealColor)},0.6)`, borderRadius:10, padding:'12px', color:mealColor, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'Orbitron',monospace", display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'none', minHeight:46,
        }}>
          <span style={{ fontSize:18 }}>{MEAL_IC[meal]}</span>
          <span>LOG {meal.toUpperCase()}</span>
        </button>
      </div>

      
      <div className="glass fade-up delay-2" style={{ padding:20 }}>
        <SectionTitle icon="📋" color="var(--blue)">Meal History ({nutrition?.length||0})</SectionTitle>
        {(!nutrition||nutrition.length===0) ? (
          <div style={{ color:'#94a3b8', textAlign:'center', padding:28, fontFamily:"'Orbitron',monospace", fontSize:11 }}>NO MEALS LOGGED YET</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(Array.isArray(nutrition)?nutrition:[]).slice(0,10).map(n=>(
              <div key={n.id} style={{ display:'flex', alignItems:'center', gap:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'11px 14px' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{MEAL_IC[n.meal]||'🍽️'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, color:'#f1f5f9' }}>{n.item}</div>
                  <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>{n.meal} · {n.date}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ color:'#38bdf8', fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:13 }}>{n.calories} kcal</div>
                  {n.protein>0&&<div style={{ color:'#94a3b8', fontSize:10 }}>P:{n.protein}g C:{n.carbs}g F:{n.fat}g</div>}
                </div>
                <button onClick={()=>{onDelete(n.id);showToast('Deleted')}} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:8, width:28, height:28, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, minHeight:'auto', padding:0 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
