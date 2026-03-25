// pages/Gamification.jsx — Badges, points, streaks, leaderboard

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { SectionTitle, Badge, Btn } from '../components/GlassInput'

const api = axios.create({ baseURL:'/api' })

function BadgeCard({ badge }) {
  const color = `#${badge.color}`
  return (
    <div style={{
      background: badge.earned?`${color}10`:'rgba(255,255,255,0.02)',
      border:`1px solid ${badge.earned?`${color}40`:'rgba(255,255,255,0.06)'}`,
      borderRadius:16, padding:'18px 14px', textAlign:'center',
      opacity:badge.earned?1:0.45, transition:'all 0.3s', position:'relative', overflow:'hidden'
    }}>
      {badge.earned && <div style={{ position:'absolute', top:8, right:8, fontSize:10, color }}><Badge color={color}>EARNED</Badge></div>}
      <div style={{ fontSize:36, marginBottom:8, filter:badge.earned?'none':'grayscale(1)' }}>{badge.icon}</div>
      <div style={{ fontFamily:'var(--font-head)', color:badge.earned?color:'var(--muted)', fontSize:11, fontWeight:700, marginBottom:6 }}>{badge.title}</div>
      <div style={{ color:'var(--muted)', fontSize:10, marginBottom:8 }}>{badge.desc}</div>
      <div style={{ color:badge.earned?color:'var(--muted)', fontFamily:'var(--font-head)', fontSize:11, fontWeight:700 }}>+{badge.points} pts</div>
      {badge.earned && badge.earned_at && <div style={{ color:'var(--muted)', fontSize:9, marginTop:4 }}>{badge.earned_at.slice(0,10)}</div>}
    </div>
  )
}

export default function Gamification({ deviceId, showToast }) {
  const [badges,      setBadges]      = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [checking,    setChecking]    = useState(false)
  const [tab,         setTab]         = useState('badges')

  const load = useCallback(async () => {
    if (!deviceId) return
    try {
      const [b, l] = await Promise.all([
        api.get(`/gamification/${deviceId}/badges`),
        api.get(`/gamification/${deviceId}/leaderboard`),
      ])
      setBadges(b.data); setLeaderboard(l.data)
    } catch(e) { console.error(e) }
  }, [deviceId])

  useEffect(() => { load() }, [load])

  const checkBadges = async () => {
    setChecking(true)
    try {
      const res = await api.post(`/gamification/${deviceId}/check-badges`)
      if (res.data.new_badges?.length > 0) {
        showToast(`🏆 New badges: ${res.data.new_badges.join(', ')} (+${res.data.points_earned} pts)!`)
      } else {
        showToast('No new badges yet — keep going!')
      }
      load()
    } finally { setChecking(false) }
  }

  const earned = badges.filter(b=>b.earned)
  const total  = badges.reduce((s,b)=>s+(b.earned?b.points:0),0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Stats header */}
      <div className="glass fade-up" style={{ padding:'18px 24px', borderTop:'2px solid var(--orange)', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:20, flex:1 }}>
          {[
            { label:'Badges Earned', value:`${earned.length}/${badges.length}`, color:'var(--orange)' },
            { label:'Total Points',  value:total,       color:'var(--teal)' },
            { label:'Badges Left',   value:badges.length-earned.length, color:'var(--muted2)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ color:s.color, fontFamily:'var(--font-head)', fontSize:26, fontWeight:900 }}>{s.value}</div>
              <div style={{ color:'var(--muted)', fontSize:10, letterSpacing:1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <Btn onClick={checkBadges} color="var(--orange)" icon={checking?"⏳":"🏆"} style={{ whiteSpace:"nowrap", flexShrink:0 }}>{checking?"Checking...":"Check Badges"}</Btn>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, background:'rgba(255,255,255,0.03)', borderRadius:12, padding:4 }}>
        {[['badges','🏅 All Badges'],['leaderboard','🏆 Leaderboard']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1, padding:'9px', borderRadius:9, border:'none', cursor:'pointer',
            background:tab===id?'rgba(251,146,60,0.15)':'transparent',
            color:tab===id?'var(--orange)':'var(--muted)',
            fontFamily:'var(--font-head)', fontSize:11, fontWeight:tab===id?700:400, transition:'all 0.2s'
          }}>{label}</button>
        ))}
      </div>

      {/* Badges grid */}
      {tab==='badges' && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="🏅" color="var(--orange)">Achievement Badges</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {badges.map(b => <BadgeCard key={b.id} badge={b}/>)}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {tab==='leaderboard' && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="🏆" color="var(--teal)">Global Leaderboard</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {leaderboard.map((u,i) => {
              const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':null
              const isMe  = u.device_id === deviceId
              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:14,
                  background:isMe?'rgba(0,255,231,0.08)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${isMe?'rgba(0,255,231,0.3)':'rgba(255,255,255,0.06)'}`,
                  borderRadius:14, padding:'12px 18px'
                }}>
                  <div style={{ width:32, fontFamily:'var(--font-head)', fontSize:i<3?20:14, color:'var(--muted)', textAlign:'center', fontWeight:700 }}>{medal||`#${u.rank}`}</div>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{u.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-head)', fontWeight:700, color:isMe?'var(--teal)':'var(--text)' }}>{u.name}{isMe&&' (You)'}</div>
                  </div>
                  <div style={{ color:'var(--orange)', fontFamily:'var(--font-head)', fontWeight:900, fontSize:18 }}>{u.points}<span style={{ fontSize:10, color:'var(--muted)', marginLeft:3 }}>pts</span></div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
