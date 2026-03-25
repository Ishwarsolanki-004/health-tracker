// pages/Medications.jsx — Medication tracker + health records

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { GlassInput, GlassSelect, Btn, Badge, SectionTitle } from '../components/GlassInput'

const api = axios.create({ baseURL: '/api' })
const today = new Date().toISOString().split('T')[0]
const FREQ = ['daily','twice_daily','weekly','as_needed']
const REC_TYPES = ['blood_pressure','blood_sugar','weight','temperature','heart_rate','oxygen_level']
const REC_UNITS = { blood_pressure:'mmHg', blood_sugar:'mg/dL', weight:'kg', temperature:'°F', heart_rate:'bpm', oxygen_level:'%' }
const REC_ICONS = { blood_pressure:'❤️', blood_sugar:'🩸', weight:'⚖️', temperature:'🌡️', heart_rate:'💓', oxygen_level:'💨' }

export default function Medications({ deviceId, showToast }) {
  const [meds,    setMeds]    = useState([])
  const [logs,    setLogs]    = useState([])
  const [records, setRecords] = useState([])
  const [tab,     setTab]     = useState('meds')
  const [form,    setForm]    = useState({ name:'', dosage:'', frequency:'daily', time:'08:00', notes:'' })
  const [recForm, setRecForm] = useState({ type:'blood_pressure', value:'', unit:'', notes:'', date:today })
  const f = k => v => setForm(p=>({...p,[k]:v}))
  const rf= k => v => setRecForm(p=>({...p,[k]:v}))

  const loadMeds = useCallback(async () => {
    try {
      const [m, l, r] = await Promise.all([
        api.get(`/medications/${deviceId}`),
        api.get(`/medications/${deviceId}/logs/${today}`),
        api.get(`/medications/records/${deviceId}`),
      ])
      setMeds(m.data); setLogs(l.data); setRecords(r.data)
    } catch(e) { console.error(e) }
  }, [deviceId])

  useEffect(() => { if(deviceId) loadMeds() }, [deviceId, loadMeds])

  const addMed = async () => {
    if (!form.name) { showToast('Medicine name required!'); return }
    await api.post('/medications/', { ...form, device_id: deviceId })
    setForm({ name:'', dosage:'', frequency:'daily', time:'08:00', notes:'' })
    loadMeds(); showToast('✅ Medication added!')
  }

  const toggleTaken = async (medId, currentTaken) => {
    await api.post('/medications/logs', { device_id:deviceId, medication_id:medId, taken:!currentTaken, date:today })
    loadMeds(); showToast(currentTaken ? 'Marked as not taken' : '✅ Marked as taken!')
  }

  const addRecord = async () => {
    if (!recForm.value) { showToast('Value required!'); return }
    await api.post('/medications/records', { ...recForm, device_id:deviceId, unit: recForm.unit || REC_UNITS[recForm.type] || '' })
    setRecForm({ type:'blood_pressure', value:'', unit:'', notes:'', date:today })
    loadMeds(); showToast('✅ Health record saved!')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      
      <div className="glass fade-up" style={{ padding:'12px 16px', display:'flex', gap:4, background:'rgba(255,255,255,0.03)', borderRadius:14 }}>
        {[['meds','💊 Medications'],['records','📊 Health Records'],['add_med','➕ Add Medicine'],['add_rec','📝 Log Record']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{
            flex:1, padding:'9px 8px', borderRadius:10, border:'none', cursor:'pointer',
            background: tab===id?'rgba(251,146,60,0.15)':'transparent',
            color: tab===id?'var(--orange)':'var(--muted)',
            fontFamily:'var(--font-head)', fontSize:10, fontWeight:tab===id?700:400,
            boxShadow: tab===id?'inset 0 0 0 1px rgba(251,146,60,0.3)':'none', transition:'all 0.2s'
          }}>{label}</button>
        ))}
      </div>

      
      {tab==='meds' && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="💊" color="var(--orange)">Today's Medications</SectionTitle>
          {logs.length===0 ? (
            <div style={{ color:'var(--muted)', textAlign:'center', padding:40, fontFamily:'var(--font-head)', letterSpacing:1, fontSize:12 }}>NO MEDICATIONS ADDED YET</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {logs.map(({ medication:m, taken }) => (
                <div key={m.id} style={{
                  display:'flex', alignItems:'center', gap:14,
                  background: taken?'rgba(34,211,165,0.06)':'rgba(255,255,255,0.03)',
                  border:`1px solid ${taken?'rgba(34,211,165,0.25)':'rgba(255,255,255,0.07)'}`,
                  borderRadius:14, padding:'14px 18px', transition:'all 0.3s'
                }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:taken?'rgba(34,211,165,0.15)':'rgba(251,146,60,0.1)',border:`1px solid ${taken?'rgba(34,211,165,0.3)':'rgba(251,146,60,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>💊</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, color:taken?'var(--green)':'var(--text)' }}>{m.name}</div>
                    <div style={{ color:'var(--muted)', fontSize:11, marginTop:2 }}>{m.dosage} · {m.frequency.replace('_',' ')} · {m.time}</div>
                  </div>
                  <Badge color={taken?'var(--green)':'var(--orange)'}>{taken?'✅ Taken':'⏳ Pending'}</Badge>
                  <button onClick={()=>toggleTaken(m.id, taken)} style={{
                    background:taken?'rgba(239,68,68,0.1)':'rgba(34,211,165,0.12)',
                    border:`1px solid ${taken?'rgba(239,68,68,0.2)':'rgba(34,211,165,0.3)'}`,
                    color:taken?'#ef4444':'var(--green)', cursor:'pointer', borderRadius:10, padding:'8px 14px',
                    fontFamily:'var(--font-head)', fontSize:10, fontWeight:700
                  }}>{taken?'Undo':'Mark Taken'}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      
      {tab==='records' && (
        <div className="glass fade-up" style={{ padding:24 }}>
          <SectionTitle icon="📊" color="var(--blue)">Health Records</SectionTitle>
          {records.length===0 ? (
            <div style={{ color:'var(--muted)', textAlign:'center', padding:40, fontFamily:'var(--font-head)', fontSize:12 }}>NO RECORDS YET</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {records.map(r => (
                <div key={r.id} className="glass-sm" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ fontSize:22 }}>{REC_ICONS[r.type]||'📊'}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12, fontFamily:'var(--font-head)' }}>{r.type.replace(/_/g,' ').toUpperCase()}</div>
                      <div style={{ color:'var(--muted)', fontSize:11 }}>{r.date} {r.notes&&`· ${r.notes}`}</div>
                    </div>
                  </div>
                  <div style={{ color:'var(--blue)', fontFamily:'var(--font-head)', fontWeight:800, fontSize:18 }}>
                    {r.value} <span style={{ fontSize:11, color:'var(--muted)' }}>{r.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      
      {tab==='add_med' && (
        <div className="glass fade-up" style={{ padding:28 }}>
          <SectionTitle icon="➕" color="var(--orange)">Add New Medication</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <GlassInput label="Medicine Name" value={form.name} onChange={f('name')} placeholder="e.g. Vitamin D3" style={{ gridColumn:'span 2' }}/>
            <GlassInput label="Dosage" value={form.dosage} onChange={f('dosage')} placeholder="e.g. 500mg"/>
            <GlassSelect label="Frequency" value={form.frequency} onChange={f('frequency')} options={FREQ}/>
            <GlassInput label="Time" type="time" value={form.time} onChange={f('time')}/>
            <GlassInput label="Notes" value={form.notes} onChange={f('notes')} placeholder="With food, etc."/>
          </div>
          <button onClick={addMed} style={{ width:"100%",background:"rgba(251,146,60,0.18)",border:"1.5px solid rgba(251,146,60,0.6)",borderRadius:10,padding:"12px",color:"#fb923c",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Orbitron',monospace",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"none",minHeight:46,marginTop:14 }}><span>💊</span><span>ADD MEDICATION</span></button>
        </div>
      )}

      
      {tab==='add_rec' && (
        <div className="glass fade-up" style={{ padding:28 }}>
          <SectionTitle icon="📝" color="var(--blue)">Log Health Record</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <GlassSelect label="Type" value={recForm.type} onChange={v=>{ rf('type')(v); rf('unit')(REC_UNITS[v]||'') }} options={REC_TYPES}/>
            <GlassInput label="Date" type="date" value={recForm.date} onChange={rf('date')}/>
            <GlassInput label={`Value (${REC_UNITS[recForm.type]||''})`} value={recForm.value} onChange={rf('value')} placeholder="Enter reading"/>
            <GlassInput label="Notes" value={recForm.notes} onChange={rf('notes')} placeholder="Optional notes"/>
          </div>
          <button onClick={addRecord} style={{ width:"100%",background:"rgba(56,189,248,0.18)",border:"1.5px solid rgba(56,189,248,0.6)",borderRadius:10,padding:"12px",color:"#38bdf8",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Orbitron',monospace",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:"none",minHeight:46,marginTop:14 }}><span>📊</span><span>SAVE RECORD</span></button>
        </div>
      )}
    </div>
  )
}
