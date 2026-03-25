export default function Toast({ message }) {
  if (!message) return null
  return (
    <div style={{
      position:'fixed', top:18, left:'50%', transform:'translateX(-50%)',
      background:'rgba(10,22,40,0.95)', backdropFilter:'blur(18px)',
      border:'1px solid rgba(0,255,231,0.3)', borderRadius:12,
      padding:'11px 24px',
      color:'#a8c8e0',            /* soft — not neon */
      fontWeight:700, fontSize:12,
      zIndex:9999,
      boxShadow:'0 4px 24px rgba(0,0,0,0.5)',
      fontFamily:"'Orbitron',monospace", letterSpacing:.5,
      animation:'fadeUp .25s cubic-bezier(.2,.8,.2,1)',
      whiteSpace:'nowrap', maxWidth:'88vw',
    }}>{message}</div>
  )
}
