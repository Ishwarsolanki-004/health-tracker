const HEX = {
  'var(--teal)':   '#00ffe7',
  'var(--orange)': '#fb923c',
  'var(--blue)':   '#38bdf8',
  'var(--violet)': '#a78bfa',
  'var(--green)':  '#22d3a5',
  'var(--pink)':   '#ff2d78',
  'var(--muted2)': '#6b7f96',
  'var(--muted)':  '#6b7f96',
}

export function GlassInput({ label, type='text', value, onChange, placeholder, min, max, step, style }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
      {label && (
        <label style={{ color:'#6b7f96', fontSize:11, letterSpacing:1.2, textTransform:'uppercase', fontFamily:"'Orbitron',monospace", fontWeight:600 }}>
          {label}
        </label>
      )}
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        style={{
          background:'rgba(255,255,255,0.06)',
          border:'1px solid rgba(255,255,255,0.11)',
          borderRadius:10, padding:'11px 13px',
          color:'#dde3ed',
          fontSize:15, fontFamily:"'Rajdhani',sans-serif", fontWeight:500,
          width:'100%', minHeight:46, outline:'none', boxSizing:'border-box',
        }}
      />
    </div>
  )
}

export function GlassSelect({ label, value, onChange, options, style }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, ...style }}>
      {label && (
        <label style={{ color:'#6b7f96', fontSize:11, letterSpacing:1.2, textTransform:'uppercase', fontFamily:"'Orbitron',monospace", fontWeight:600 }}>
          {label}
        </label>
      )}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background:'#0e1d30', border:'1px solid rgba(255,255,255,0.11)',
          borderRadius:10, padding:'11px 13px', color:'#dde3ed',
          fontSize:15, fontFamily:"'Rajdhani',sans-serif", fontWeight:500,
          width:'100%', minHeight:46, cursor:'pointer',
          outline:'none', boxSizing:'border-box',
          WebkitAppearance:'none', appearance:'none',
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7'%3E%3Cpath d='M1 1l4.5 5 4.5-5' stroke='%236b7f96' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat:'no-repeat', backgroundPosition:'right 13px center', paddingRight:34,
        }}
      >
        {options.map(o=>(
          <option key={o} value={o} style={{ background:'#1a2d45', color:'#dde3ed' }}>{o}</option>
        ))}
      </select>
    </div>
  )
}

// ✅ BUTTON — visible but NOT over-highlighted
// Fill: semi-transparent colored bg + dark text
// Outline: transparent bg + colored border + colored text
export function Btn({ children, onClick, color='var(--teal)', variant='fill', style, icon, disabled }) {
  const hex    = HEX[color] || color
  const isFill = variant === 'fill'

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        // ✅ Semi-transparent fill — not full solid, not invisible
        background: disabled
          ? 'rgba(255,255,255,0.04)'
          : isFill
            ? `rgba(${hexToRgb(hex)}, 0.18)`   // subtle tinted bg
            : 'transparent',
        border: `1.5px solid ${disabled ? 'rgba(255,255,255,0.08)' : `rgba(${hexToRgb(hex)}, 0.6)`}`,
        borderRadius: 10,
        padding: '10px 20px',
        // ✅ Colored text (not black, not white — the accent color itself)
        color: disabled ? '#3d4f62' : hex,
        fontWeight: 700,
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 0.8,
        fontFamily:"'Orbitron', monospace",
        boxShadow: 'none',   // no glow
        display: 'inline-flex', alignItems:'center', gap:7,
        minHeight: 46,
        transition: 'all .18s',
        opacity: disabled ? 0.45 : 1,
        ...style
      }}
      onMouseDown={e=>{ if(!disabled){ e.currentTarget.style.opacity='.7'; e.currentTarget.style.transform='scale(0.97)' }}}
      onMouseUp={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }}
      onTouchStart={e=>{ if(!disabled){ e.currentTarget.style.opacity='.7'; e.currentTarget.style.transform='scale(0.97)' }}}
      onTouchEnd={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='scale(1)' }}
    >
      {icon && <span style={{ fontSize:16, lineHeight:1 }}>{icon}</span>}
      <span>{children}</span>
    </button>
  )
}

// Helper: hex to "r,g,b"
function hexToRgb(hex) {
  const h = hex.replace('#','')
  const r = parseInt(h.slice(0,2),16)
  const g = parseInt(h.slice(2,4),16)
  const b = parseInt(h.slice(4,6),16)
  return `${r},${g},${b}`
}

export function Badge({ children, color }) {
  const hex = HEX[color] || color
  return (
    <span style={{
      background:`rgba(${hexToRgb(hex)},0.12)`,
      color: hex,
      border:`1px solid rgba(${hexToRgb(hex)},0.35)`,
      borderRadius:999, padding:'2px 9px',
      fontSize:10, fontWeight:700,
      fontFamily:"'Orbitron',monospace",
      letterSpacing:0.5, whiteSpace:'nowrap',
    }}>{children}</span>
  )
}

export function SectionTitle({ children, color='var(--teal)', icon }) {
  const hex = HEX[color] || color
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14 }}>
      {icon && (
        <div style={{ width:28,height:28,borderRadius:7,background:`rgba(${hexToRgb(hex)},0.12)`,border:`1px solid rgba(${hexToRgb(hex)},0.25)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>
          {icon}
        </div>
      )}
      <span style={{ color:hex, fontFamily:"'Orbitron',monospace", fontSize:11, fontWeight:700, letterSpacing:1 }}>
        {children}
      </span>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,rgba(${hexToRgb(hex)},0.2),transparent)` }}/>
    </div>
  )
}
