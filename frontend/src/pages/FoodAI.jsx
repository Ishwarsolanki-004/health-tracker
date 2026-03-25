// pages/FoodAI.jsx — AI Food Recognition via camera/upload

import { useState, useRef } from 'react'
import { Btn, SectionTitle, Badge } from '../components/GlassInput'
import axios from 'axios'

const MACRO_COLORS = { protein:'var(--green)', carbs:'var(--orange)', fat:'var(--pink)' }

export default function FoodAI({ onLog, showToast }) {
  const [preview,  setPreview]  = useState(null)
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [meal,     setMeal]     = useState('Lunch')
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target.result)
    reader.readAsDataURL(file)
    setResult(null)
  }

  const analyze = async (file) => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await axios.post('/api/food-ai/analyze', form, { headers: { 'Content-Type':'multipart/form-data' } })
      setResult(res.data)
      showToast(`🤖 ${res.data.food_name} detected!`)
    } catch (e) {
      showToast('⚠️ Could not analyze image. Try a clearer photo.')
    } finally { setLoading(false) }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    handleFile(file)
    analyze(file)
  }

  const logMeal = async () => {
    if (!result) return
    try {
      await axios.post('/api/nutrition', {
        meal,
        item:     result.food_name,
        calories: result.calories,
        protein:  result.protein,
        carbs:    result.carbs,
        fat:      result.fat,
        date:     new Date().toISOString().split('T')[0]
      })
      onLog?.()
      showToast(`✅ ${result.food_name} logged as ${meal}!`)
      setResult(null); setPreview(null)
    } catch { showToast('⚠️ Could not log meal. Try again.') }
  }

  const totalMacros = result ? result.protein + result.carbs + result.fat : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Header */}
      <div className="glass fade-up" style={{ padding:'16px 22px', borderTop:'2px solid var(--violet)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <span style={{ fontSize:32 }}>📸</span>
        <div>
          <div style={{ fontFamily:'var(--font-head)', color:'var(--violet)', fontSize:14, fontWeight:700 }}>AI FOOD RECOGNITION</div>
          <div style={{ color:'var(--muted)', fontSize:12, marginTop:3 }}>
            Take a photo of your meal → AI automatically detects food and calculates calories & macros
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <Badge color="var(--violet)">Claude Vision</Badge>
          <Badge color="var(--teal)">Auto Nutrition</Badge>
        </div>
      </div>

      {/* Upload area */}
      <div className="glass fade-up delay-1" style={{ padding:28 }}>
        <SectionTitle icon="📷" color="var(--violet)">Upload Food Photo</SectionTitle>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border:`2px dashed ${preview ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius:16, padding:preview ? 0 : 48, cursor:'pointer',
            textAlign:'center', transition:'all 0.3s', overflow:'hidden',
            background: preview ? 'transparent' : 'rgba(167,139,250,0.04)',
          }}
          onMouseOver={e => !preview && (e.currentTarget.style.borderColor='rgba(167,139,250,0.4)')}
          onMouseOut={e  => !preview && (e.currentTarget.style.borderColor='rgba(255,255,255,0.12)')}
        >
          {preview ? (
            <img src={preview} alt="Food" style={{ width:'100%', maxHeight:300, objectFit:'cover', borderRadius:14 }} />
          ) : (
            <>
              <div style={{ fontSize:48, marginBottom:12 }}>🍽️</div>
              <div style={{ color:'var(--muted2)', fontFamily:'var(--font-head)', fontSize:13 }}>Click to upload food photo</div>
              <div style={{ color:'var(--muted)', fontSize:12, marginTop:6 }}>JPG, PNG, WEBP • Max 5MB</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display:'none' }} />

        <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
          <Btn onClick={() => fileRef.current?.click()} color="var(--violet)" icon="📷">
            {preview ? 'Change Photo' : 'Choose Photo'}
          </Btn>
          {preview && !result && !loading && (
            <Btn onClick={() => { const inp = fileRef.current; if(inp?.files[0]) analyze(inp.files[0]) }}
              color="var(--teal)" icon="🤖">Analyze with AI</Btn>
          )}
          {preview && (
            <Btn onClick={() => { setPreview(null); setResult(null) }} color="var(--muted2)" variant="outline">✕ Clear</Btn>
          )}
        </div>

        {loading && (
          <div style={{ marginTop:20, padding:'16px 20px', background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:12, display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ fontSize:24 }}>🤖</div>
            <div>
              <div style={{ color:'var(--violet)', fontFamily:'var(--font-head)', fontSize:12 }}>AI ANALYZING YOUR FOOD...</div>
              <div style={{ color:'var(--muted)', fontSize:12, marginTop:3 }}>Claude Vision is detecting food items and calculating nutrition</div>
            </div>
          </div>
        )}
      </div>

      {/* Result card */}
      {result && (
        <div className="glass fade-up" style={{ padding:28, borderTop:'2px solid var(--green)' }}>
          <SectionTitle icon="✅" color="var(--green)">AI Analysis Result</SectionTitle>

          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:20, marginBottom:20, alignItems:'start' }}>
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:22, color:'var(--white)', fontWeight:700 }}>{result.food_name}</div>
              <div style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>{result.serving_size}</div>
              <div style={{ marginTop:8 }}>
                <Badge color={result.confidence==='high'?'var(--green)':result.confidence==='medium'?'var(--orange)':'var(--muted)'}>
                  {result.confidence === 'demo' ? '🎭 Demo Mode' : `${result.confidence} confidence`}
                </Badge>
              </div>
              {result.description && (
                <div style={{ color:'var(--muted2)', fontSize:12, marginTop:10, fontStyle:'italic' }}>{result.description}</div>
              )}
            </div>
            <div style={{ textAlign:'center', background:'rgba(34,211,165,0.08)', border:'1px solid rgba(34,211,165,0.2)', borderRadius:16, padding:'16px 20px' }}>
              <div style={{ color:'var(--green)', fontFamily:'var(--font-head)', fontSize:38, fontWeight:900 }}>{result.calories}</div>
              <div style={{ color:'var(--muted)', fontSize:11 }}>CALORIES</div>
            </div>
          </div>

          {/* Macros */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Protein', value:result.protein, color:'var(--green)' },
              { label:'Carbs',   value:result.carbs,   color:'var(--orange)' },
              { label:'Fat',     value:result.fat,     color:'var(--pink)' },
            ].map(m => (
              <div key={m.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'14px', textAlign:'center' }}>
                <div style={{ color:m.color, fontFamily:'var(--font-head)', fontSize:22, fontWeight:800 }}>{m.value}g</div>
                <div style={{ color:'var(--muted)', fontSize:11, marginTop:4 }}>{m.label}</div>
                {totalMacros > 0 && (
                  <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:999, marginTop:8 }}>
                    <div style={{ height:'100%', width:`${(m.value/totalMacros)*100}%`, background:m.color, borderRadius:999 }}/>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Log as meal */}
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ color:'var(--muted2)', fontSize:13 }}>Log as:</span>
            {['Breakfast','Lunch','Dinner','Snack'].map(m => (
              <button key={m} onClick={() => setMeal(m)} style={{
                padding:'8px 16px', borderRadius:10, border:`1px solid ${meal===m?'var(--teal)':'rgba(255,255,255,0.1)'}`,
                background: meal===m?'rgba(0,255,231,0.12)':'transparent',
                color: meal===m?'var(--teal)':'var(--muted)', cursor:'pointer',
                fontFamily:'var(--font-head)', fontSize:11, transition:'all 0.2s'
              }}>{m}</button>
            ))}
            <Btn onClick={logMeal} color="var(--teal)" icon="✅" style={{ marginLeft:'auto' }}>Log {meal}</Btn>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        {[
          { icon:'🤖', title:'AI-Powered',    desc:'Uses Claude Vision to identify food and estimate nutritional content from photos', color:'var(--violet)' },
          { icon:'⚡', title:'Instant',        desc:'Get calorie and macro information in seconds — no manual database searching', color:'var(--teal)' },
          { icon:'📊', title:'Auto Logging',   desc:'One click to log the detected meal directly to your nutrition tracker', color:'var(--green)' },
        ].map(c => (
          <div key={c.title} className="glass" style={{ padding:18, textAlign:'center', borderTop:`1px solid ${c.color}33` }}>
            <div style={{ fontSize:28, marginBottom:10 }}>{c.icon}</div>
            <div style={{ color:c.color, fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, marginBottom:6 }}>{c.title}</div>
            <div style={{ color:'var(--muted)', fontSize:11, lineHeight:1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
