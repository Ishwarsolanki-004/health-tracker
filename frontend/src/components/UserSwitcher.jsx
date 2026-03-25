// components/UserSwitcher.jsx — Multi-user profile switcher (no login needed)

import { useState } from 'react'
import { Btn, SectionTitle } from './GlassInput'

const AVATARS = ['👤','🧑','👩','🧔','👨‍💻','👩‍💻','🧑‍🎓','👨‍⚕️','👩‍⚕️','🦸','🧙','🏋️']

export default function UserSwitcher({ currentUser, allUsers, onSwitch, onCreate, onDelete, onClose }) {
  const [creating, setCreating] = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newAvatar,setNewAvatar]= useState('👤')

  const handleCreate = async () => {
    if (!newName.trim()) return
    await onCreate(newName.trim(), newAvatar)
    setCreating(false); setNewName('')
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
      backdropFilter:'blur(8px)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20
    }} onClick={onClose}>
      <div className="glass" onClick={e=>e.stopPropagation()} style={{
        width:'100%', maxWidth:480, padding:28,
        borderTop:'2px solid var(--teal)',
        boxShadow:'0 0 60px rgba(0,255,231,0.15)'
      }}>
        <SectionTitle icon="👥" color="var(--teal)">Switch User Profile</SectionTitle>
        <div style={{ color:'var(--muted)', fontSize:12, marginBottom:18 }}>
          No login required — each profile is stored by device. Switch between family members or test accounts.
        </div>

        {/* Existing users */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18, maxHeight:280, overflowY:'auto' }}>
          {allUsers.map(u => (
            <div key={u.device_id} style={{
              display:'flex', alignItems:'center', gap:14,
              background: u.device_id===currentUser?.device_id ? 'rgba(0,255,231,0.1)' : 'rgba(255,255,255,0.03)',
              border:`1px solid ${u.device_id===currentUser?.device_id ? 'rgba(0,255,231,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius:14, padding:'12px 16px', cursor:'pointer', transition:'all 0.2s'
            }} onClick={() => onSwitch(u.device_id)}>
              <div style={{
                width:44, height:44, borderRadius:'50%', fontSize:24,
                background:'rgba(255,255,255,0.08)', border:`2px solid ${u.device_id===currentUser?.device_id?'var(--teal)':'transparent'}`,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
              }}>{u.avatar}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:700, color:u.device_id===currentUser?.device_id?'var(--teal)':'var(--text)' }}>
                  {u.name} {u.device_id===currentUser?.device_id && '(Active)'}
                </div>
                <div style={{ color:'var(--muted)', fontSize:11, marginTop:2 }}>
                  BMI {u.bmi||'—'} · {u.points||0} pts · {u.age} yrs
                </div>
              </div>
              {u.device_id !== currentUser?.device_id && (
                <button onClick={e=>{ e.stopPropagation(); if(window.confirm(`Delete ${u.name}?`)) onDelete(u.device_id) }}
                  style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', cursor:'pointer', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Create new user */}
        {!creating ? (
          <Btn onClick={()=>setCreating(true)} color="var(--teal)" icon="➕">Add New Profile</Btn>
        ) : (
          <div style={{ background:'rgba(0,255,231,0.05)', border:'1px solid rgba(0,255,231,0.2)', borderRadius:14, padding:18 }}>
            <div style={{ color:'var(--teal)', fontFamily:'var(--font-head)', fontSize:12, marginBottom:14 }}>NEW PROFILE</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {AVATARS.map(a => (
                <button key={a} onClick={()=>setNewAvatar(a)} style={{
                  fontSize:24, background:newAvatar===a?'rgba(0,255,231,0.2)':'rgba(255,255,255,0.04)',
                  border:`2px solid ${newAvatar===a?'var(--teal)':'transparent'}`, borderRadius:10, padding:6, cursor:'pointer'
                }}>{a}</button>
              ))}
            </div>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Enter name..."
              style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', color:'var(--text)', fontSize:14, marginBottom:14 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <Btn onClick={handleCreate} color="var(--teal)">Create Profile</Btn>
              <Btn onClick={()=>setCreating(false)} color="var(--muted2)" variant="outline">Cancel</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
