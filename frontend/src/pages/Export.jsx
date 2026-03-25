// pages/Export.jsx — AI Food Recognition with camera + upload + Claude Vision

import { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { SectionTitle, Badge, Btn } from '../components/GlassInput'

const api = axios.create({ baseURL: '/api' })

export default function Export({ deviceId, showToast }) {
  const [downloading, setDownloading] = useState(null)

  // Food AI state
  const [mode,       setMode]       = useState('home')   // home | camera | result | analyzing | error
  const [foodImg,    setFoodImg]    = useState(null)     // base64 preview
  const [foodResult, setFoodResult] = useState(null)
  const [errorMsg,   setErrorMsg]   = useState('')
  const [cameraOn,   setCameraOn]   = useState(false)

  const fileRef   = useRef()
  const videoRef  = useRef()
  const canvasRef = useRef()
  const streamRef = useRef(null)

  // ── Download ───────────────────────────────────────────────
  const downloadFile = async (type) => {
    setDownloading(type)
    try {
      const res = await api.get(`/export/${type}/${deviceId}`, { responseType:'blob' })
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href = url; a.download = `vitaltrack_${type}_${new Date().toISOString().split('T')[0]}.${type}`; a.click()
      URL.revokeObjectURL(url)
      showToast(`✅ ${type.toUpperCase()} downloaded!`)
    } catch { showToast('⚠️ Export failed. Make sure backend is running.') }
    finally   { setDownloading(null) }
  }

  // ── Send image to Claude Vision API ───────────────────────
  const analyzeImage = useCallback(async (blob, previewUrl) => {
    setFoodImg(previewUrl)
    setMode('analyzing')
    setFoodResult(null)
    setErrorMsg('')

    try {
      const file     = new File([blob], 'food.jpg', { type: blob.type || 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post('/food-ai/analyze', formData, {
        headers: { 'Content-Type':'multipart/form-data' },
        timeout: 40000,
      })

      setFoodResult(res.data)
      setMode('result')
      showToast(`✅ Detected: ${res.data.detected}`)
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI analysis failed'
      setErrorMsg(msg)
      setMode('error')
    }
  }, [])

  // ── Upload from gallery ────────────────────────────────────
  const handleFileUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (e) => {
      // Convert base64 to blob for upload
      const res    = await fetch(e.target.result)
      const blob   = await res.blob()
      analyzeImage(blob, e.target.result)
    }
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Camera functions ───────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode:'environment', width:{ ideal:1280 }, height:{ ideal:720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraOn(true)
      setMode('camera')
    } catch (e) {
      showToast('⚠️ Camera access denied. Use upload instead.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    canvas.toBlob(async (blob) => {
      const previewUrl = canvas.toDataURL('image/jpeg', 0.9)
      stopCamera()
      analyzeImage(blob, previewUrl)
    }, 'image/jpeg', 0.9)
  }

  const reset = () => {
    stopCamera()
    setFoodImg(null)
    setFoodResult(null)
    setErrorMsg('')
    setMode('home')
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Macro bar ─────────────────────────────────────────────
  const MacroBar = ({ label, value, total, color }) => {
    const pct = total > 0 ? Math.round((value/total)*100) : 0
    return (
      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ color:'var(--muted)', fontSize:11 }}>{label}</span>
          <span style={{ color, fontFamily:'var(--font-head)', fontSize:11, fontWeight:700 }}>{value}g ({pct}%)</span>
        </div>
        <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:999 }}>
          <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:999, boxShadow:`0 0 6px ${color}77`, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── Export Section ── */}
      <div className="glass fade-up" style={{ padding:28, borderTop:'2px solid var(--green)' }}>
        <SectionTitle icon="📤" color="var(--green)">Export Health Data</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ background:'rgba(34,211,165,0.06)', border:'1px solid rgba(34,211,165,0.2)', borderRadius:16, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:38, marginBottom:8 }}>📊</div>
            <div style={{ fontFamily:'var(--font-head)', color:'var(--green)', fontSize:13, fontWeight:700, marginBottom:6 }}>CSV Export</div>
            <div style={{ color:'var(--muted)', fontSize:11, marginBottom:14, lineHeight:1.6 }}>All data in spreadsheet format. Open in Excel.</div>
            <Btn onClick={()=>downloadFile('csv')} color="var(--green)" icon={downloading==='csv'?'⏳':'📥'} style={{ width:'100%', justifyContent:'center' }}>
              {downloading==='csv'?'Downloading...':'Download CSV'}
            </Btn>
          </div>
          <div style={{ background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.2)', borderRadius:16, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:38, marginBottom:8 }}>📄</div>
            <div style={{ fontFamily:'var(--font-head)', color:'var(--blue)', fontSize:13, fontWeight:700, marginBottom:6 }}>PDF Report</div>
            <div style={{ color:'var(--muted)', fontSize:11, marginBottom:14, lineHeight:1.6 }}>Formatted health report. Share with doctor.</div>
            <Btn onClick={()=>downloadFile('pdf')} color="var(--blue)" icon={downloading==='pdf'?'⏳':'📥'} style={{ width:'100%', justifyContent:'center' }}>
              {downloading==='pdf'?'Generating...':'Download PDF'}
            </Btn>
          </div>
        </div>
      </div>

      {/* ── AI Food Recognition ── */}
      <div className="glass fade-up delay-1" style={{ padding:24, borderTop:'2px solid var(--violet)' }}>

        {/* Title row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <SectionTitle icon="🤖" color="var(--violet)">AI Food Recognition</SectionTitle>
          {mode !== 'home' && (
            <button onClick={reset} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'5px 14px', color:'var(--muted)', fontSize:11, cursor:'pointer', fontFamily:'var(--font-head)' }}>
              ↺ Start Over
            </button>
          )}
        </div>

        {/* Badges */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          <Badge color="var(--violet)">Claude Vision AI</Badge>
          <Badge color="var(--teal)">Real Detection</Badge>
          <Badge color="var(--green)">Any Food / Fruit / Vegetable</Badge>
        </div>

        {/* ════ HOME — Choose method ════ */}
        {mode === 'home' && (
          <div>
            <p style={{ color:'var(--muted)', fontSize:13, marginBottom:20, lineHeight:1.7 }}>
              Apne food, fruit ya vegetable ki photo lo ya upload karo — Claude AI exactly identify karega aur nutrition bata dega.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

              {/* Camera option */}
              <div onClick={startCamera} style={{
                background:'rgba(167,139,250,0.07)', border:'2px solid rgba(167,139,250,0.3)',
                borderRadius:18, padding:'28px 20px', textAlign:'center', cursor:'pointer',
                transition:'all 0.2s'
              }}
                onMouseOver={e=>e.currentTarget.style.background='rgba(167,139,250,0.14)'}
                onMouseOut={e=>e.currentTarget.style.background='rgba(167,139,250,0.07)'}
              >
                <div style={{ fontSize:52, marginBottom:10 }}>📷</div>
                <div style={{ fontFamily:'var(--font-head)', color:'var(--violet)', fontSize:13, fontWeight:700, marginBottom:6 }}>Live Camera</div>
                <div style={{ color:'var(--muted)', fontSize:12 }}>Phone/laptop camera se real-time photo lo</div>
              </div>

              {/* Upload option */}
              <div onClick={()=>fileRef.current?.click()} style={{
                background:'rgba(0,255,231,0.05)', border:'2px solid rgba(0,255,231,0.25)',
                borderRadius:18, padding:'28px 20px', textAlign:'center', cursor:'pointer',
                transition:'all 0.2s'
              }}
                onMouseOver={e=>e.currentTarget.style.background='rgba(0,255,231,0.12)'}
                onMouseOut={e=>e.currentTarget.style.background='rgba(0,255,231,0.05)'}
              >
                <div style={{ fontSize:52, marginBottom:10 }}>🖼️</div>
                <div style={{ fontFamily:'var(--font-head)', color:'var(--teal)', fontSize:13, fontWeight:700, marginBottom:6 }}>Upload Photo</div>
                <div style={{ color:'var(--muted)', fontSize:12 }}>Gallery se koi bhi food photo upload karo</div>
              </div>
            </div>

            {/* Sample foods hint */}
            <div style={{ marginTop:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 16px' }}>
              <div style={{ color:'var(--muted)', fontSize:11, marginBottom:8 }}>Try with:</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {['🍎 Apple','🍌 Banana','🍕 Pizza','🍛 Biryani','🥗 Salad','🍔 Burger','🥦 Broccoli','🥕 Carrot','🍊 Orange','🍗 Chicken','🥚 Egg','🍜 Noodles'].map(f=>(
                  <span key={f} style={{ background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:999, padding:'3px 10px', fontSize:11, color:'var(--text2)' }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ CAMERA VIEW ════ */}
        {mode === 'camera' && (
          <div>
            <div style={{ position:'relative', borderRadius:16, overflow:'hidden', background:'#000', marginBottom:14 }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width:'100%', maxHeight:320, display:'block', objectFit:'cover' }}
              />
              {/* Corner guides */}
              {[['0px','0px','top','left'],['0px','0px','top','right'],['0px','0px','bottom','left'],['0px','0px','bottom','right']].map(([t,r,v,h],i)=>(
                <div key={i} style={{
                  position:'absolute', [v]:'16px', [h]:'16px',
                  width:28, height:28,
                  borderTop: v==='top'?'3px solid var(--teal)':'none',
                  borderBottom: v==='bottom'?'3px solid var(--teal)':'none',
                  borderLeft: h==='left'?'3px solid var(--teal)':'none',
                  borderRight: h==='right'?'3px solid var(--teal)':'none',
                }}/>
              ))}
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:180, height:180, border:'1.5px dashed rgba(0,255,231,0.4)', borderRadius:12 }}/>
              <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', color:'var(--teal)', fontSize:11, fontFamily:'var(--font-head)', background:'rgba(0,0,0,0.6)', padding:'4px 12px', borderRadius:999, whiteSpace:'nowrap' }}>
                Food ko frame mein rakh ke capture karo
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display:'none' }}/>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <Btn onClick={capturePhoto} color="var(--teal)" icon="📸" style={{ fontSize:14, padding:'12px 32px' }}>Capture Photo</Btn>
              <Btn onClick={()=>{ stopCamera(); setMode('home') }} color="var(--muted2)" variant="outline">Cancel</Btn>
            </div>
          </div>
        )}

        {/* ════ ANALYZING ════ */}
        {mode === 'analyzing' && (
          <div>
            {foodImg && (
              <div style={{ borderRadius:14, overflow:'hidden', marginBottom:18, maxHeight:220 }}>
                <img src={foodImg} alt="Food" style={{ width:'100%', objectFit:'cover', maxHeight:220, display:'block' }}/>
              </div>
            )}
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:12, animation:'pulse 1s ease-in-out infinite' }}>🤖</div>
              <div style={{ color:'var(--violet)', fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, letterSpacing:1, marginBottom:8 }}>CLAUDE AI ANALYZING...</div>
              <div style={{ color:'var(--muted)', fontSize:12, marginBottom:20 }}>Image dekh ke food identify ho rahi hai...</div>
              <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                {[0,1,2,3].map(i=>(
                  <div key={i} style={{ width:10,height:10,borderRadius:'50%',background:'var(--violet)',animation:`pulse 1.2s ${i*0.18}s ease-in-out infinite` }}/>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ ERROR ════ */}
        {mode === 'error' && (
          <div>
            {foodImg && (
              <div style={{ borderRadius:14, overflow:'hidden', marginBottom:14, maxHeight:180 }}>
                <img src={foodImg} alt="Food" style={{ width:'100%', objectFit:'cover', maxHeight:180, display:'block' }}/>
              </div>
            )}
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:14, padding:'16px 20px', marginBottom:14 }}>
              <div style={{ color:'#ef4444', fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, marginBottom:6 }}>⚠️ ANALYSIS FAILED</div>
              <div style={{ color:'var(--muted)', fontSize:12, lineHeight:1.6 }}>{errorMsg}</div>
              <div style={{ color:'var(--muted)', fontSize:11, marginTop:8 }}>
                Backend running hai? <code>uvicorn app.main:app --reload --port 8000</code>
              </div>
            </div>
            <Btn onClick={reset} color="var(--violet)" icon="↺">Try Again</Btn>
          </div>
        )}

        {/* ════ RESULT ════ */}
        {mode === 'result' && foodResult && (
          <div>
            {/* Image + dish name side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16, alignItems:'start' }}>
              <div style={{ borderRadius:14, overflow:'hidden' }}>
                <img src={foodImg} alt="Food" style={{ width:'100%', objectFit:'cover', maxHeight:180, display:'block' }}/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:10 }}>
                {/* Dish name */}
                <div style={{ background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:12, padding:'14px' }}>
                  <div style={{ color:'var(--muted)', fontSize:10, fontFamily:'var(--font-head)', letterSpacing:1, marginBottom:6 }}>DETECTED FOOD</div>
                  <div style={{ color:'var(--violet)', fontFamily:'var(--font-head)', fontWeight:900, fontSize:16, lineHeight:1.3 }}>{foodResult.detected}</div>
                </div>
                {/* Calories big */}
                <div style={{ background:'rgba(0,255,231,0.08)', border:'1px solid rgba(0,255,231,0.25)', borderRadius:12, padding:'14px', textAlign:'center' }}>
                  <div style={{ color:'var(--teal)', fontFamily:'var(--font-head)', fontWeight:900, fontSize:34, lineHeight:1 }}>{foodResult.calories}</div>
                  <div style={{ color:'var(--muted)', fontSize:11, marginTop:4 }}>kcal per serving</div>
                </div>
                {/* Badges */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <Badge color="var(--blue)">{foodResult.cuisine}</Badge>
                  <Badge color={foodResult.confidence>=85?'var(--green)':foodResult.confidence>=70?'var(--orange)':'#ef4444'}>
                    {foodResult.confidence}% sure
                  </Badge>
                </div>
              </div>
            </div>

            {/* Macro cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[
                { label:'Protein', value:foodResult.protein, color:'var(--green)',  icon:'🥩' },
                { label:'Carbs',   value:foodResult.carbs,   color:'var(--orange)', icon:'🍞' },
                { label:'Fat',     value:foodResult.fat,      color:'var(--pink)',   icon:'🧈' },
              ].map(m=>(
                <div key={m.label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{m.icon}</div>
                  <div style={{ color:m.color, fontFamily:'var(--font-head)', fontSize:22, fontWeight:800 }}>{m.value}</div>
                  <div style={{ color:'var(--muted)', fontSize:10 }}>g {m.label}</div>
                </div>
              ))}
            </div>

            {/* Macro distribution */}
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'14px 16px', marginBottom:14 }}>
              <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:10 }}>Macro Split</div>
              {(()=>{ const t=foodResult.protein+foodResult.carbs+foodResult.fat||1; return(<>
                <MacroBar label="Protein" value={foodResult.protein} total={t} color="var(--green)"/>
                <MacroBar label="Carbs"   value={foodResult.carbs}   total={t} color="var(--orange)"/>
                <MacroBar label="Fat"     value={foodResult.fat}      total={t} color="var(--pink)"/>
              </>)})()}
            </div>

            {/* Ingredients */}
            {foodResult.items?.length>0 && (
              <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
                <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:10 }}>Ingredients / Components</div>
                {foodResult.items.map((item,i)=>(
                  <div key={i} style={{ color:'var(--text2)', fontSize:12, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:8 }}>
                    <span style={{ color:'var(--violet)', flexShrink:0 }}>▸</span>{item}
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Btn onClick={()=>showToast(`📋 Open Nutrition tab → Log Meal → Add "${foodResult.detected}"`)} color="var(--teal)" icon="📋">
                Log to Nutrition
              </Btn>
              <Btn onClick={reset} color="var(--muted2)" variant="outline" icon="📸">
                Analyze Another
              </Btn>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e=>handleFileUpload(e.target.files[0])}/>
      </div>
    </div>
  )
}
