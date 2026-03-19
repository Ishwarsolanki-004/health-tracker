// components/Toast.jsx — Animated toast notification

export default function Toast({ message }) {
  if (!message) return null
  return (
    <div style={{
      position:'fixed', top:24, left:'50%', transform:'translateX(-50%)',
      background:'rgba(0,255,231,0.08)', backdropFilter:'blur(20px)',
      border:'1px solid rgba(0,255,231,0.3)',
      borderRadius:14, padding:'13px 28px',
      color:'var(--teal)', fontWeight:700, fontSize:13,
      zIndex:9999,
      boxShadow:'0 0 40px rgba(0,255,231,0.2), 0 8px 32px rgba(0,0,0,0.5)',
      fontFamily:'var(--font-head)', letterSpacing:0.5,
      animation:'fadeUp 0.3s cubic-bezier(.2,.8,.2,1)',
      whiteSpace:'nowrap'
    }}>{message}</div>
  )
}
