// pages/HealthChat.jsx — Natural Language Health AI Chat

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Btn, Badge, SectionTitle } from '../components/GlassInput'

const api = axios.create({ baseURL: '/api' })

const QUICK = [
  "How am I doing this week?",
  "What should I eat today?",
  "Am I getting enough sleep?",
  "Give me a workout plan",
  "How can I lose weight?",
  "What's my health score?",
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 16,
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start'
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: isUser
          ? 'linear-gradient(135deg,rgba(167,139,250,0.5),rgba(0,255,231,0.3))'
          : 'linear-gradient(135deg,rgba(0,255,231,0.3),rgba(56,189,248,0.3))',
        border: `1px solid ${isUser ? 'rgba(167,139,250,0.4)' : 'rgba(0,255,231,0.4)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
      }}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '75%',
        background: isUser
          ? 'rgba(167,139,250,0.12)'
          : 'rgba(0,255,231,0.06)',
        border: `1px solid ${isUser ? 'rgba(167,139,250,0.25)' : 'rgba(0,255,231,0.18)'}`,
        borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
        padding: '12px 16px',
      }}>
        <div style={{
          color: 'var(--text)', fontSize: 13, lineHeight: 1.7,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word'
        }}>{msg.content}</div>
        <div style={{ color: 'var(--dim)', fontSize: 10, marginTop: 5, textAlign: isUser ? 'right' : 'left' }}>
          {msg.time}
        </div>
      </div>
    </div>
  )
}

export default function HealthChat({ deviceId, showToast }) {
  const [messages,  setMessages]  = useState([
    { role:'assistant', content:"Hi! I'm your VitalTrack AI health coach 🤖\n\nI can see your real health data — steps, sleep, nutrition, and more. Ask me anything about your health!\n\nTry: \"How am I doing this week?\" or \"What should I eat today?\"", time: 'Now' }
  ])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const bottomRef = useRef()
  const inputRef  = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role:'user', content: msg, time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}) }
    const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0)
      .map(m => ({ role: m.role, content: m.content }))

    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await api.post('/chat/message', {
        device_id: deviceId,
        message:   msg,
        history:   history.slice(-8),   // last 8 messages for context
      })
      const aiMsg = {
        role: 'assistant',
        content: res.data.reply,
        time: new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (e) {
      setMessages(prev => [...prev, {
        role:'assistant',
        content: '⚠️ Connection error. Make sure backend is running.\n\n`uvicorn app.main:app --reload --port 8000`',
        time: '—'
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 160px)', minHeight:500, gap:0 }}>

      {/* Header */}
      <div className="glass" style={{ padding:'14px 20px', borderTop:'2px solid var(--teal)', borderRadius:'20px 20px 0 0', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,rgba(0,255,231,0.3),rgba(56,189,248,0.2))', border:'1px solid rgba(0,255,231,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🤖</div>
        <div>
          <div style={{ fontFamily:'var(--font-head)', color:'var(--teal)', fontWeight:700, fontSize:13 }}>VITALTRACK AI HEALTH COACH</div>
          <div style={{ color:'var(--muted)', fontSize:11 }}>Powered by Claude AI · Sees your real health data</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <Badge color="var(--teal)">Live Data</Badge>
          <Badge color="var(--green)">Claude AI</Badge>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY:'auto', padding:'16px',
        background:'rgba(3,7,18,0.6)',
        borderLeft:'1px solid rgba(255,255,255,0.07)',
        borderRight:'1px solid rgba(255,255,255,0.07)',
      }}>
        {messages.map((m, i) => <Message key={i} msg={m}/>)}

        {/* Loading dots */}
        {loading && (
          <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'flex-start' }}>
            <div style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,rgba(0,255,231,0.3),rgba(56,189,248,0.3))',border:'1px solid rgba(0,255,231,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16 }}>🤖</div>
            <div style={{ background:'rgba(0,255,231,0.06)', border:'1px solid rgba(0,255,231,0.18)', borderRadius:'4px 18px 18px 18px', padding:'14px 18px', display:'flex', gap:6, alignItems:'center' }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:8,height:8,borderRadius:'50%',background:'var(--teal)',animation:`pulse 1s ${i*0.2}s ease-in-out infinite` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick suggestions */}
      <div style={{ background:'rgba(3,7,18,0.8)', borderLeft:'1px solid rgba(255,255,255,0.07)', borderRight:'1px solid rgba(255,255,255,0.07)', padding:'8px 12px', display:'flex', gap:6, overflowX:'auto' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => sendMessage(q)} disabled={loading} style={{
            background:'rgba(0,255,231,0.06)', border:'1px solid rgba(0,255,231,0.2)',
            borderRadius:999, padding:'5px 12px', color:'var(--teal)',
            fontSize:11, cursor:'pointer', whiteSpace:'nowrap',
            fontFamily:'var(--font-head)', transition:'all 0.2s', flexShrink:0
          }}
            onMouseOver={e=>e.currentTarget.style.background='rgba(0,255,231,0.14)'}
            onMouseOut={e=>e.currentTarget.style.background='rgba(0,255,231,0.06)'}
          >{q}</button>
        ))}
      </div>

      {/* Input bar */}
      <div style={{
        padding:'12px 16px', background:'rgba(3,7,18,0.9)',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'0 0 20px 20px',
        display:'flex', gap:10, alignItems:'flex-end'
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about your health... (Enter to send)"
          disabled={loading}
          rows={1}
          style={{
            flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
            borderRadius:12, padding:'10px 14px', color:'var(--text)',
            fontSize:13, fontFamily:'var(--font-body)', resize:'none', outline:'none',
            lineHeight:1.5, maxHeight:100, overflowY:'auto'
          }}
          onInput={e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,100)+'px' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            width:42, height:42, borderRadius:'50%', border:'none', cursor:'pointer',
            background: input.trim() && !loading ? 'linear-gradient(135deg,var(--teal),var(--blue))' : 'rgba(255,255,255,0.1)',
            color: input.trim() && !loading ? '#030712' : 'var(--dim)',
            fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s', flexShrink:0
          }}
        >{loading ? '⏳' : '➤'}</button>
      </div>
    </div>
  )
}
