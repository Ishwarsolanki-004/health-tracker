// components/GlassInput.jsx — Styled inputs, selects, buttons, badges

export function GlassInput({ label, type='text', value, onChange, placeholder, min, max, step, style }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && (
        <label style={{
          color:'var(--muted2)', fontSize:10, letterSpacing:1.5,
          textTransform:'uppercase', fontFamily:'var(--font-head)'
        }}>{label}</label>
      )}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        style={{
          background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:12, padding:'11px 15px',
          color:'var(--text)', fontSize:14, fontFamily:'var(--font-body)',
          width:'100%', boxSizing:'border-box',
          transition:'all 0.2s'
        }}
      />
    </div>
  )
}

export function GlassSelect({ label, value, onChange, options, style }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && (
        <label style={{
          color:'var(--muted2)', fontSize:10, letterSpacing:1.5,
          textTransform:'uppercase', fontFamily:'var(--font-head)'
        }}>{label}</label>
      )}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{
          background:'#0d1117',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:12, padding:'11px 15px',
          color:'var(--text)', fontSize:14, fontFamily:'var(--font-body)',
          width:'100%', boxSizing:'border-box', cursor:'pointer',
          transition:'all 0.2s'
        }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export function Btn({ children, onClick, color='var(--teal)', variant='fill', style, icon }) {
  const isFill = variant === 'fill'
  return (
    <button onClick={onClick} className="btn-glow" style={{
      background: isFill
        ? `linear-gradient(135deg, ${color}ee, ${color}bb)`
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}${isFill?'00':'66'}`,
      borderRadius:12, padding:'10px 22px',
      color: isFill ? '#030712' : color,
      fontWeight:700, fontSize:13, cursor:'pointer',
      letterSpacing:1, fontFamily:'var(--font-head)',
      boxShadow: isFill ? `0 4px 20px ${color}44, 0 0 0 1px ${color}22` : 'none',
      display:'flex', alignItems:'center', gap:6,
      ...style
    }}>
      {icon && <span style={{ fontSize:16 }}>{icon}</span>}
      {children}
    </button>
  )
}

export function Badge({ children, color }) {
  return (
    <span style={{
      background:`${color}16`,
      color,
      border:`1px solid ${color}44`,
      borderRadius:999, padding:'3px 11px',
      fontSize:11, fontWeight:700,
      fontFamily:'var(--font-head)',
      letterSpacing:0.5,
      textShadow:`0 0 8px ${color}66`
    }}>{children}</span>
  )
}

export function SectionTitle({ children, color='var(--teal)', icon }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
      {icon && (
        <div style={{
          width:32, height:32, borderRadius:8,
          background:`${color}18`, border:`1px solid ${color}30`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:16
        }}>{icon}</div>
      )}
      <span style={{
        color, fontFamily:'var(--font-head)', fontSize:14, fontWeight:700,
        letterSpacing:1, textShadow:`0 0 16px ${color}66`
      }}>{children}</span>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${color}30, transparent)` }}/>
    </div>
  )
}
