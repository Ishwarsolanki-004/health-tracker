import { useState } from 'react'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Activity  from './pages/Activity'
import Nutrition from './pages/Nutrition'
import Sleep     from './pages/Sleep'
import Progress  from './pages/Progress'
import Goals     from './pages/Goals'
import Reminders from './pages/Reminders'
import {
  useActivities, useNutrition, useSleep,
  useWater, useGoals, useProfile
} from './hooks/useHealth'
import { useReminders } from './hooks/useSensors'

const TABS = [
  { label:'Dashboard', icon:'⚡' },
  { label:'Activity',  icon:'🏃' },
  { label:'Nutrition', icon:'🍎' },
  { label:'Sleep',     icon:'🌙' },
  { label:'Progress',  icon:'📈' },
  { label:'Goals',     icon:'🎯' },
  { label:'Reminders', icon:'🔔' },
]

const bmiColor = b => b<18.5?'var(--blue)':b<25?'var(--green)':b<30?'var(--orange)':'#ef4444'
const bmiLabel = b => b<18.5?'Underweight':b<25?'Healthy':b<30?'Overweight':'Obese'

export default function App() {
  const [tab,   setTab]   = useState(0)
  const [toast, setToast] = useState('')
  const [mood,  setMood]  = useState(null)

  const { activities, add:addAct, remove:delAct } = useActivities()
  const { nutrition,  add:addNut, remove:delNut } = useNutrition()
  const { sleepLogs,  add:addSlp, remove:delSlp } = useSleep()
  const { waterToday, add:addWater }              = useWater()
  const { goals,  update:updateGoals }            = useGoals()
  const { profile,update:updateProfile }          = useProfile()
  const { reminders, permission, requestPermission, addReminder, toggleReminder, deleteReminder } = useReminders()

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  const bmi = profile.weight && profile.height
    ? +(profile.weight / ((profile.height/100)**2)).toFixed(1) : null

  const hasNewReminder = reminders.some(r => r.enabled) && permission === 'granted'

  return (
    <div style={{ minHeight:'100vh' }}>
      <Toast message={toast} />

      {/* HEADER */}
      <header style={{
        padding:'0 28px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        background:'rgba(3,7,18,0.85)', backdropFilter:'blur(24px)',
        position:'sticky', top:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between', height:64
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:36, height:36,
            background:'linear-gradient(135deg,rgba(0,255,231,0.2),rgba(56,189,248,0.15))',
            border:'1px solid rgba(0,255,231,0.3)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 16px rgba(0,255,231,0.2)', fontSize:18
          }}>⚡</div>
          <div>
            <div style={{
              fontFamily:'var(--font-head)', fontSize:16, fontWeight:900, letterSpacing:2,
              background:'linear-gradient(90deg,var(--teal),var(--blue))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
            }}>VITALTRACK</div>
            <div style={{ color:'var(--muted)', fontSize:9, letterSpacing:3, marginTop:-2 }}>HEALTH SYSTEM PRO</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {bmi && (
            <div style={{
              background:`${bmiColor(bmi)}14`, border:`1px solid ${bmiColor(bmi)}33`,
              borderRadius:999, padding:'4px 14px',
              display:'flex', alignItems:'center', gap:8
            }}>
              <span style={{ color:bmiColor(bmi), fontSize:11, fontFamily:'var(--font-head)', fontWeight:700 }}>BMI {bmi}</span>
              <span style={{ color:'var(--muted)', fontSize:10 }}>·</span>
              <span style={{ color:bmiColor(bmi), fontSize:10 }}>{bmiLabel(bmi)}</span>
            </div>
          )}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontWeight:700, fontSize:14, fontFamily:'var(--font-head)' }}>{profile.name}</div>
            <div style={{ color:'var(--muted)', fontSize:10 }}>
              {new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
            </div>
          </div>
          <div style={{
            width:38, height:38, borderRadius:'50%',
            background:'linear-gradient(135deg,rgba(167,139,250,0.4),rgba(0,255,231,0.3))',
            border:'1.5px solid rgba(0,255,231,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:18, boxShadow:'0 0 12px rgba(167,139,250,0.3)', cursor:'pointer'
          }}>👤</div>
        </div>
      </header>

      {/* TABS */}
      <nav style={{
        padding:'0 20px',
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        background:'rgba(3,7,18,0.7)', backdropFilter:'blur(12px)',
        display:'flex', gap:0, overflowX:'auto',
        position:'sticky', top:64, zIndex:99
      }}>
        {TABS.map((t, i) => {
          const active = tab === i
          return (
            <button key={t.label} onClick={() => setTab(i)} style={{
              background:'none', border:'none', cursor:'pointer',
              padding:'14px 18px',
              display:'flex', alignItems:'center', gap:7,
              color: active ? 'var(--teal)' : 'var(--muted)',
              fontFamily:'var(--font-head)', fontSize:11,
              fontWeight: active ? 700 : 400, letterSpacing:1.2,
              borderBottom: active ? '2px solid var(--teal)' : '2px solid transparent',
              whiteSpace:'nowrap', transition:'all 0.2s',
              textShadow: active ? '0 0 12px rgba(0,255,231,0.5)' : 'none',
              position:'relative'
            }}>
              <span style={{ fontSize:14 }}>{t.icon}</span>
              {t.label}
              {/* Notification dot on Reminders tab */}
              {t.label === 'Reminders' && hasNewReminder && (
                <span style={{
                  position:'absolute', top:10, right:10,
                  width:6, height:6, borderRadius:'50%',
                  background:'var(--teal)',
                  boxShadow:'0 0 6px var(--teal)'
                }}/>
              )}
            </button>
          )
        })}
      </nav>

      {/* CONTENT */}
      <main style={{ padding:'28px 24px', maxWidth:1000, margin:'0 auto' }}>
        {tab===0 && <Dashboard activities={activities} nutrition={nutrition} sleepLogs={sleepLogs} waterToday={waterToday} goals={goals} mood={mood} setMood={setMood} addWater={addWater} showToast={showToast} />}
        {tab===1 && <Activity  activities={activities} onAdd={addAct} onDelete={delAct} showToast={showToast} userWeight={profile.weight} />}
        {tab===2 && <Nutrition nutrition={nutrition} onAdd={addNut} onDelete={delNut} showToast={showToast} />}
        {tab===3 && <Sleep     sleepLogs={sleepLogs} onAdd={addSlp} onDelete={delSlp} showToast={showToast} />}
        {tab===4 && <Progress  activities={activities} sleepLogs={sleepLogs} nutrition={nutrition} />}
        {tab===5 && <Goals     goals={goals} onUpdateGoals={updateGoals} profile={profile} onUpdateProfile={updateProfile} activities={activities} sleepLogs={sleepLogs} waterToday={waterToday} showToast={showToast} />}
        {tab===6 && <Reminders reminders={reminders} permission={permission} requestPermission={requestPermission} addReminder={addReminder} toggleReminder={toggleReminder} deleteReminder={deleteReminder} showToast={showToast} />}
      </main>
    </div>
  )
}
