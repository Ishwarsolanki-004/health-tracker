export default function CircleProgress({ value, max, color, size=88, stroke=8, label, unit }) {
  const r    = (size - stroke*2) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(value / (max||1), 1)
  const dash = pct * circ

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)', position:'relative', zIndex:1 }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            filter={`drop-shadow(0 0 4px ${color}88)`}
            style={{ transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
          <span style={{ color:'#dde3ed', fontSize:size*.17, fontWeight:700, fontFamily:"'Orbitron',monospace", lineHeight:1 }}>{value}</span>
          <span style={{ color:`${color}bb`, fontSize:size*.10, marginTop:1 }}>{Math.round(pct*100)}%</span>
        </div>
      </div>
      <span style={{ color:'#6b7f96', fontSize:9, letterSpacing:1.2, textTransform:'uppercase', fontFamily:"'Orbitron',monospace", fontWeight:600 }}>{label}</span>
      {unit && <span style={{ color, fontSize:9, opacity:.8 }}>{unit}</span>}
    </div>
  )
}
