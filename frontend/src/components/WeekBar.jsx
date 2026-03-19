// components/WeekBar.jsx — Animated weekly bar chart

export default function WeekBar({ data, label, color }) {
  const max  = Math.max(...data, 1)
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const todayIdx = (new Date().getDay() + 6) % 7  // Mon=0

  return (
    <div>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14
      }}>
        <span style={{ color:'var(--muted2)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', fontFamily:'var(--font-head)' }}>{label}</span>
        <span style={{ color, fontSize:11, fontWeight:700 }}>
          avg {(data.reduce((a,b)=>a+b,0)/7).toFixed(0)}
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:72 }}>
        {data.map((v, i) => {
          const h = Math.max((v/max)*58 + 4, 4)
          const isToday = i === todayIdx
          return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{ position:'relative', width:'100%' }}>
                {/* Value tooltip on today */}
                {isToday && v > 0 && (
                  <div style={{
                    position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)',
                    background:`${color}22`, border:`1px solid ${color}44`,
                    borderRadius:6, padding:'2px 5px', fontSize:9,
                    color, whiteSpace:'nowrap', marginBottom:3,
                    fontFamily:'var(--font-head)'
                  }}>{v}</div>
                )}
                <div style={{
                  width:'100%', height:`${h}px`, borderRadius:5,
                  background: isToday
                    ? `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`
                    : `${color}44`,
                  boxShadow: isToday ? `0 0 12px ${color}66, 0 -2px 8px ${color}44` : 'none',
                  transition:'height 0.8s cubic-bezier(.4,0,.2,1)',
                  transitionDelay:`${i*0.06}s`,
                  border: isToday ? `1px solid ${color}88` : '1px solid transparent'
                }}/>
              </div>
              <span style={{
                color: isToday ? color : 'var(--muted)',
                fontSize:9, fontFamily:'var(--font-head)',
                fontWeight: isToday ? 700 : 400
              }}>{days[i]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
