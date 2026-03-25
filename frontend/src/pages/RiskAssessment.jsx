// pages/RiskAssessment.jsx — ML Health Risk Predictor

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { SectionTitle, Badge, Btn } from '../components/GlassInput'

const api = axios.create({ baseURL: '/api' })

function RiskCard({ risk }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background:`${risk.color}09`, border:`1px solid ${risk.color}30`,
      borderRadius:16, overflow:'hidden', transition:'all 0.3s'
    }}>
      
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
      >
        <span style={{ fontSize:28, flexShrink:0 }}>{risk.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{risk.category}</div>
          
          <div style={{ height:6, background:'rgba(255,255,255,0.08)', borderRadius:999, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:999,
              width:`${risk.score}%`,
              background:`linear-gradient(90deg, #22d3a5, ${risk.color})`,
              boxShadow:`0 0 8px ${risk.color}66`,
              transition:'width 1s cubic-bezier(.4,0,.2,1)'
            }}/>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:900, color:risk.color }}>{risk.score}</div>
          <div style={{ fontSize:9, color:'var(--muted)' }}>/100</div>
        </div>
        <div style={{ marginLeft:4 }}>
          <Badge color={risk.color}>{risk.level}</Badge>
        </div>
        <span style={{ color:'var(--muted)', fontSize:14 }}>{open?'▲':'▼'}</span>
      </div>

      
      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          {risk.factors.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1.2, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:8 }}>Risk Factors</div>
              {risk.factors.map((f,i) => (
                <div key={i} style={{ display:'flex', gap:8, color:'var(--text2)', fontSize:12, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color:risk.color, flexShrink:0 }}>⚠</span>{f}
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:14 }}>
            <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1.2, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:8 }}>Recommended Actions</div>
            {risk.actions.map((a,i) => (
              <div key={i} style={{ display:'flex', gap:8, color:'var(--text2)', fontSize:12, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color:'var(--green)', flexShrink:0 }}>→</span>{a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RiskAssessment({ deviceId, showToast }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get(`/advanced/risk/${deviceId}`)
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load risk assessment')
    } finally { setLoading(false) }
  }, [deviceId])

  useEffect(() => { if(deviceId) load() }, [deviceId, load])

  const getLevelEmoji = (label) =>
    label==='Healthy'?'✅':label==='Moderate'?'⚠️':label==='High Risk'?'🔴':'🚨'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      
      <div className="glass fade-up" style={{ padding:'18px 24px', borderTop:'2px solid var(--pink)' }}>
        <SectionTitle icon="🔬" color="var(--pink)">ML Health Risk Assessment</SectionTitle>
        <div style={{ color:'var(--muted)', fontSize:12, lineHeight:1.7 }}>
          Machine learning models analyze your health data to detect potential risks early.
          Based on WHO clinical guidelines + your personal activity, sleep, and nutrition data.
        </div>
      </div>

      {loading && (
        <div className="glass" style={{ padding:40, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12, animation:'pulse 1s ease-in-out infinite' }}>🔬</div>
          <div style={{ color:'var(--pink)', fontFamily:'var(--font-head)', fontSize:12, letterSpacing:1 }}>ANALYZING YOUR HEALTH DATA...</div>
        </div>
      )}

      {error && !loading && (
        <div className="glass" style={{ padding:24 }}>
          <div style={{ color:'#ef4444', marginBottom:12 }}>⚠️ {error}</div>
          <Btn onClick={load} color="var(--pink)" icon="↺">Retry</Btn>
        </div>
      )}

      {data && !loading && (
        <>
          
          <div className="glass fade-up" style={{
            padding:24, borderTop:`2px solid ${data.overall_color}`,
            boxShadow:`0 0 30px ${data.overall_color}15`
          }}>
            <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:20, alignItems:'center' }}>
              
              <div style={{ textAlign:'center' }}>
                <div style={{
                  width:120, height:120, borderRadius:'50%', margin:'0 auto',
                  background:`conic-gradient(${data.overall_color} ${data.overall_score*3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 0 32px ${data.overall_color}44`, position:'relative'
                }}>
                  <div style={{ width:92,height:92,borderRadius:'50%',background:'#030712',position:'absolute',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:900, color:data.overall_color, lineHeight:1 }}>{data.overall_score}</div>
                    <div style={{ color:'var(--muted)', fontSize:9, marginTop:2 }}>/ 100</div>
                  </div>
                </div>
                <div style={{ marginTop:10 }}>
                  <span style={{ fontSize:20 }}>{getLevelEmoji(data.overall_label)}</span>
                  <div style={{ marginTop:4 }}><Badge color={data.overall_color}>{data.overall_label}</Badge></div>
                </div>
              </div>

              
              <div>
                <div style={{ fontFamily:'var(--font-head)', color:data.overall_color, fontSize:16, fontWeight:700, marginBottom:8 }}>
                  Overall Risk Score
                </div>
                <div style={{ color:'var(--text2)', fontSize:13, lineHeight:1.7, marginBottom:12 }}>
                  {data.overall_score < 25
                    ? "Your health metrics look great! Keep maintaining these healthy habits."
                    : data.overall_score < 50
                    ? "Some areas need attention. Review the risk factors below and take action."
                    : data.overall_score < 75
                    ? "Several health risks detected. Consider consulting a healthcare professional."
                    : "Critical risk levels detected. Please consult a doctor as soon as possible."}
                </div>
                <div style={{ color:'var(--muted)', fontSize:11 }}>
                  {data.generated_at?.slice(0,19)?.replace('T',' ')} UTC
                </div>
              </div>
            </div>
          </div>

          
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:2, textTransform:'uppercase', fontFamily:'var(--font-head)', marginBottom:4 }}>
              DETAILED RISK BREAKDOWN (click to expand)
            </div>
            {data.risks.map((r,i) => <RiskCard key={i} risk={r}/>)}
          </div>

          
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 16px', display:'flex', gap:10 }}>
            <span style={{ fontSize:16, flexShrink:0 }}>ℹ️</span>
            <div style={{ color:'var(--dim)', fontSize:11, lineHeight:1.6 }}>
              
            </div>
          </div>

          <Btn onClick={load} color="var(--pink)" variant="outline" icon="↺">Refresh Assessment</Btn>
        </>
      )}
    </div>
  )
}
