// components/StatCard.jsx — Glassmorphism stat card with neon accent

export default function StatCard({ icon, label, value, unit, color, sub, delay=0 }) {
  return (
    <div className="glass fade-up btn-glow" style={{
      padding:'20px', display:'flex', flexDirection:'column', gap:8,
      position:'relative', overflow:'hidden',
      animationDelay: `${delay}s`,
      borderTop:`1px solid ${color}30`,
    }}>
      {/* Corner accent */}
      <div style={{
        position:'absolute', top:0, right:0,
        width:60, height:60,
        background:`radial-gradient(circle at top right, ${color}18, transparent 70%)`,
        pointerEvents:'none'
      }}/>
      {/* Animated icon bg */}
      <div style={{
        position:'absolute', bottom:-10, right:-10,
        fontSize:56, opacity:0.07, lineHeight:1,
        filter:'blur(2px)'
      }}>{icon}</div>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:36, height:36, borderRadius:10,
          background:`${color}18`,
          border:`1px solid ${color}30`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, flexShrink:0
        }}>{icon}</div>
        <span style={{ color:'var(--muted2)', fontSize:11, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'var(--font-head)' }}>{label}</span>
      </div>

      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
        <span className="count-up" style={{
          color, fontSize:30, fontWeight:900,
          fontFamily:'var(--font-head)', lineHeight:1,
          textShadow:`0 0 20px ${color}66`
        }}>{value}</span>
        {unit && <span style={{ color:'var(--muted)', fontSize:13, fontWeight:400 }}>{unit}</span>}
      </div>

      {sub && <span style={{ color:'var(--muted)', fontSize:11, letterSpacing:0.3 }}>{sub}</span>}
    </div>
  )
}
