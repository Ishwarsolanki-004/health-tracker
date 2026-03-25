export default function WeekBar({ data, label, color }) {
  const max      = Math.max(...data, 1)
  const days     = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ color:'#6b7f96', fontSize:9, letterSpacing:1.5, textTransform:'uppercase', fontFamily:"'Orbitron',monospace", fontWeight:600 }}>{label}</span>
        <span style={{ color, fontSize:10, fontFamily:"'Orbitron',monospace", fontWeight:700 }}>avg {(data.reduce((a,b)=>a+b,0)/7).toFixed(0)}</span>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:64 }}>
        {data.map((v,i) => {
          const h       = Math.max(3, Math.min(52, (v/max)*52))
          const isToday = i === todayIdx
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:'100%', height:`${h}px`, borderRadius:'3px 3px 0 0',
                background: isToday ? color : `${color}38`,
                boxShadow: isToday ? `0 0 8px ${color}55` : 'none',
                transition:'height .6s cubic-bezier(.4,0,.2,1)'
              }}/>
              <span style={{ color:isToday?color:'#3d4f62', fontSize:8, fontFamily:"'Orbitron',monospace", fontWeight:isToday?700:400 }}>
                {days[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
