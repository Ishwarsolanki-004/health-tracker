// components/CircleProgress.jsx — Animated neon ring

export default function CircleProgress({ value, max, color, size = 90, stroke = 8, label, unit }) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(value / (max || 1), 1)
  const dash = pct * circ
  const pctText = Math.round(pct * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        {/* Glow background disc */}
        <div style={{
          position:'absolute', inset:stroke, borderRadius:'50%',
          background:`radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          animation: pct > 0 ? 'pulseRing 2.5s ease-in-out infinite' : 'none'
        }}/>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)', position:'relative', zIndex:1 }}>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}/>
          {/* Track glow */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={`${color}18`} strokeWidth={stroke + 4}/>
          {/* Fill */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            filter={`drop-shadow(0 0 6px ${color})`}
            style={{ transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }}/>
        </svg>
        {/* Center value */}
        <div style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center'
        }}>
          <span style={{
            color:'#fff', fontSize:size*0.19, fontWeight:700,
            fontFamily:'var(--font-head)', lineHeight:1
          }}>{value}</span>
          <span style={{ color:`${color}bb`, fontSize:size*0.10, marginTop:1 }}>{pctText}%</span>
        </div>
      </div>
      <span style={{ color:'var(--muted2)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'var(--font-head)' }}>{label}</span>
      {unit && <span style={{ color, fontSize:10, opacity:0.8 }}>{unit}</span>}
    </div>
  )
}
