export default function StatCard({ icon, label, value, unit, color, sub, delay=0 }) {
  return (
    <div className="glass btn-glow fade-up" style={{
      padding:'15px 13px', display:'flex', flexDirection:'column', gap:6,
      position:'relative', overflow:'hidden',
      animationDelay:`${delay}s`,
      borderTop:`2px solid ${color}33`,
    }}>
      <div style={{ position:'absolute',top:0,right:0,width:50,height:50,background:`radial-gradient(circle at top right,${color}12,transparent 70%)`,pointerEvents:'none' }}/>

      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:28,height:28,borderRadius:7,background:`${color}16`,border:`1px solid ${color}28`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>{icon}</div>
        <span style={{ color:'#6b7f96',fontSize:9,letterSpacing:1.5,textTransform:'uppercase',fontFamily:"'Orbitron',monospace",fontWeight:600 }}>{label}</span>
      </div>

      <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
        <span style={{ color, fontSize:24, fontWeight:900, fontFamily:"'Orbitron',monospace", lineHeight:1 }}>{value}</span>
        {unit && <span style={{ color:'#6b7f96', fontSize:11 }}>{unit}</span>}
      </div>

      {sub && <span style={{ color:'#6b7f96', fontSize:11 }}>{sub}</span>}
    </div>
  )
}
