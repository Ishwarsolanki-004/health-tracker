// components/OnboardingTour.jsx — First-time user onboarding

import { useState } from 'react'
import { Btn } from './GlassInput'

const STEPS = [
  { icon:'⚡', title:'Welcome to VitalTrack Pro!', desc:'Your personal health companion. Track activities, nutrition, sleep, and get AI-powered insights — all without any wearable device.', color:'var(--teal)' },
  { icon:'👤', title:'Set Up Your Profile', desc:'Set your name, weight and height in the Goals tab for accurate tracking.', color:'var(--blue)' },
  { icon:'🏃', title:'Log Your First Activity', desc:'Select an activity, enter duration — calories are calculated automatically.', color:'var(--orange)' },
  { icon:'🤖', title:'Get ML Insights', desc:'After logging a few days, Dashboard shows your health score and predictions.', color:'var(--violet)' },
  { icon:'🔔', title:'Set Up Reminders', desc:'Go to Reminders tab → Allow Notifications → Add presets. You\'ll get browser notifications even when the app is in the background.', color:'var(--pink)' },
  { icon:'📲', title:'Install as Mobile App', desc:'Click the Install App button in the header (or browser\'s Add to Home Screen) to install VitalTrack as a native app on your phone!', color:'var(--green)' },
]

export default function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const s = STEPS[step]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div className="glass" style={{ width:'100%', maxWidth:460, padding:36, textAlign:'center', borderTop:`2px solid ${s.color}`, boxShadow:`0 0 60px ${s.color}22` }}>

        
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width:i===step?24:8, height:8, borderRadius:999, background:i===step?s.color:i<step?`${s.color}66`:'rgba(255,255,255,0.1)', transition:'all 0.3s' }}/>
          ))}
        </div>

        <div style={{ fontSize:56, marginBottom:16 }}>{s.icon}</div>
        <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:900, color:s.color, marginBottom:14, letterSpacing:0.5 }}>{s.title}</div>
        <div style={{ color:'var(--muted2)', fontSize:14, lineHeight:1.7, marginBottom:28 }}>{s.desc}</div>

        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {step > 0 && <Btn onClick={()=>setStep(s=>s-1)} color="var(--muted2)" variant="outline">← Back</Btn>}
          {!isLast
            ? <Btn onClick={()=>setStep(s=>s+1)} color={s.color}>Next →</Btn>
            : <Btn onClick={onComplete} color="var(--teal)" icon="🚀">Get Started!</Btn>
          }
          {step===0 && (
            <button onClick={onComplete} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:12, cursor:'pointer', padding:'10px' }}>Skip</button>
          )}
        </div>
      </div>
    </div>
  )
}
