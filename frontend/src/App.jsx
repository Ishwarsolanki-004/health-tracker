import { useState, useEffect } from 'react'
import Toast           from './components/Toast'
import UserSwitcher    from './components/UserSwitcher'
import OnboardingTour  from './components/OnboardingTour'
import Dashboard       from './pages/Dashboard'
import Activity        from './pages/Activity'
import Nutrition       from './pages/Nutrition'
import Sleep           from './pages/Sleep'
import Progress        from './pages/Progress'
import Goals           from './pages/Goals'
import Reminders       from './pages/Reminders'
import Medications     from './pages/Medications'
import Gamification    from './pages/Gamification'
import RiskAssessment  from './pages/RiskAssessment'
import BodyComposition from './pages/BodyComposition'
import { useActivities, useNutrition, useSleep, useWater, useGoals, useProfile } from './hooks/useHealth'
import { useReminders } from './hooks/useSensors'
import { usePWA } from './hooks/usePWA'
import { useUser } from './hooks/useUser'
import { useWebSocket } from './hooks/useWebSocket'

const TABS = [
  { id:'dashboard',   icon:'⚡', label:'Dashboard'  },
  { id:'activity',    icon:'🏃', label:'Activity'   },
  { id:'nutrition',   icon:'🍎', label:'Nutrition'  },
  { id:'sleep',       icon:'🌙', label:'Sleep'      },
  { id:'progress',    icon:'📈', label:'Progress'   },
  { id:'goals',       icon:'🎯', label:'Goals'      },
  { id:'risk',        icon:'🔬', label:'Risk AI'    },
  { id:'body',        icon:'⚖️', label:'Body'       },
  { id:'medications', icon:'💊', label:'Meds'       },
  { id:'badges',      icon:'🏅', label:'Badges'     },
  { id:'reminders',   icon:'🔔', label:'Reminders'  },
]

const bmiColor = b => b<18.5?'var(--blue)':b<25?'var(--green)':b<30?'var(--orange)':'#ef4444'
const getIsMobile = () => window.innerWidth < 768

export default function App() {
  const [tab,            setTab]           = useState(0)
  const [toast,          setToast]         = useState('')
  const [mood,           setMood]          = useState(null)
  const [showOnboarding, setShowOnboarding]= useState(false)
  const [sideOpen,       setSideOpen]      = useState(false)
  const [expanded,       setExpanded]      = useState(false)
  const [isMobile,       setIsMobile]      = useState(getIsMobile)

  const { currentUser, allUsers, showSwitcher, setShowSwitcher,
          switchUser, createNewUser, updateUser, deleteUser, deviceId } = useUser()
  const { connected: wsConnected, lastEvent } = useWebSocket(deviceId)
  const { activities, add:addAct, remove:delAct } = useActivities()
  const { nutrition,  add:addNut, remove:delNut } = useNutrition()
  const { sleepLogs,  add:addSlp, remove:delSlp } = useSleep()
  const { waterToday, add:addWater }              = useWater()
  const { goals,   update:updateGoals }           = useGoals()
  const { profile, update:updateProfile }         = useProfile()
  const { reminders, permission, requestPermission, addReminder,
          toggleReminder, deleteReminder, snoozeReminder, playBeep } = useReminders()
  const { swReady, installPrompt, installed, installApp, syncRemindersToSW } = usePWA()

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''), 2500) }
  const bmi = profile.weight && profile.height
    ? +(profile.weight/((profile.height/100)**2)).toFixed(1) : null

  useEffect(() => {
    if (!localStorage.getItem('vt_onboarded')) setShowOnboarding(true)
    const fn = () => setIsMobile(getIsMobile())
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    if (lastEvent?.type==='badge_earned') showToast(`🏆 ${lastEvent.data?.title}!`)
  }, [lastEvent])

  const handleTab = i => {
    setTab(i); setSideOpen(false)
    window.scrollTo({top:0, behavior:'smooth'})
  }

  const SIDE = expanded ? 200 : 68
  const hasDot = i => TABS[i].id==='reminders' && reminders.filter(r=>r.enabled).length>0 && permission==='granted'

  // ── Sidebar nav item ───────────────────────────────────────
  const NavItem = ({ t2, i, inDrawer }) => {
    const active = tab === i
    const show   = inDrawer || expanded
    return (
      <button onClick={() => handleTab(i)} style={{
        width:'100%', border:'none', cursor:'pointer',
        display:'flex', alignItems:'center', gap:10,
        padding: show ? '10px 12px' : '10px 0',
        justifyContent: show ? 'flex-start' : 'center',
        background: active ? 'rgba(0,255,231,0.10)' : 'transparent',
        borderRadius:12, marginBottom:3,
        position:'relative', transition:'all .18s',
        borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
        boxShadow: active ? 'inset 0 0 0 1px rgba(0,255,231,0.2)' : 'none',
      }}
        onMouseOver={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,0.05)' }}
        onMouseOut={e=>{ if(!active) e.currentTarget.style.background='transparent' }}
      >
        <span style={{
          fontSize:20, flexShrink:0,
          filter: active ? 'drop-shadow(0 0 5px var(--teal))' : 'none',
          transition:'all .18s',
        }}>{t2.icon}</span>
        {show && (
          <span style={{
            fontFamily:'var(--font-head)', fontSize:11, letterSpacing:.8,
            color: active ? 'var(--teal)' : 'var(--text2)',  /* ✅ readable */
            fontWeight: active ? 700 : 400,
            whiteSpace:'nowrap',
          }}>{t2.label}</span>
        )}
        {hasDot(i) && (
          <span style={{ position:'absolute', top:7, right:show?8:4, width:6, height:6, borderRadius:'50%', background:'var(--pink)', boxShadow:'0 0 5px var(--pink)' }}/>
        )}
      </button>
    )
  }

  // ── Sidebar inner content ──────────────────────────────────
  const SideContent = ({ inDrawer=false }) => {
    const show = inDrawer || expanded
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

        {/* Logo */}
        <div style={{ padding: show?'18px 14px 14px':'16px 8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,rgba(0,255,231,0.25),rgba(56,189,248,0.15))',border:'1px solid rgba(0,255,231,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,boxShadow:'0 0 12px rgba(0,255,231,0.18)' }}>⚡</div>
          {show && (
            <div>
              <div style={{ fontFamily:'var(--font-head)',fontSize:13,fontWeight:900,letterSpacing:2,background:'linear-gradient(90deg,var(--teal),var(--blue))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>VITAL</div>
              <div style={{ fontFamily:'var(--font-head)',fontSize:9,color:'var(--muted)',letterSpacing:1.5,marginTop:-3 }}>TRACK PRO</div>
            </div>
          )}
        </div>

        {/* User card */}
        <div onClick={()=>{ setShowSwitcher(true); setSideOpen(false) }}
          style={{ padding:show?'11px 14px':'11px 8px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0, background:'rgba(167,139,250,0.05)', transition:'background .2s' }}
          onMouseOver={e=>e.currentTarget.style.background='rgba(167,139,250,0.12)'}
          onMouseOut={e=>e.currentTarget.style.background='rgba(167,139,250,0.05)'}
        >
          <div style={{ width:32,height:32,borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,rgba(167,139,250,0.5),rgba(0,255,231,0.3))',border:'1px solid rgba(167,139,250,0.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>
            {currentUser?.avatar||'👤'}
          </div>
          {show && (
            <div style={{ overflow:'hidden', minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-head)',fontSize:11,fontWeight:700,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{currentUser?.name||'User'}</div>
              {bmi && <div style={{ color:bmiColor(bmi),fontSize:10,fontWeight:700 }}>BMI {bmi}</div>}
              <div style={{ color:'var(--muted)',fontSize:9 }}>Tap to switch</div>
            </div>
          )}
        </div>

        {/* Nav list */}
        <div style={{ flex:1,overflowY:'auto',overflowX:'hidden',padding:show?'8px':'6px 4px',scrollbarWidth:'none' }}>
          {TABS.map((t2,i) => <NavItem key={t2.id} t2={t2} i={i} inDrawer={inDrawer}/>)}
        </div>

        {/* Footer */}
        <div style={{ padding:show?'10px 14px':'10px 6px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
          {/* Live dot */}
          <div style={{ display:'flex',alignItems:'center',gap:8,justifyContent:show?'flex-start':'center' }}>
            <div style={{ width:7,height:7,borderRadius:'50%',background:wsConnected?'var(--green)':'var(--dim)',boxShadow:wsConnected?'0 0 6px var(--green)':'none',flexShrink:0 }}/>
            {show && <span style={{ color:'var(--muted)',fontSize:10 }}>{wsConnected?'Live':'Offline'}</span>}
          </div>

          {/* Language */}
          {show && (
            <button onClick={()=>updateUser({ language:currentUser?.language==='en'?'hi':'en' })}
              style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.10)',borderRadius:8,padding:'7px 10px',color:'var(--text2)',fontSize:11,cursor:'pointer',fontFamily:'var(--font-head)',width:'100%',minHeight:36 }}>
              {currentUser?.language==='hi'?'🌐 English':'🌐 हिंदी'}
            </button>
          )}

          {/* Install */}
          {installPrompt && !installed && show && (
            <button onClick={async()=>{ const ok=await installApp(); if(ok) showToast('✅ Installed!') }}
              style={{ background:'rgba(56,189,248,0.12)',border:'1px solid rgba(56,189,248,0.3)',borderRadius:8,padding:'7px 10px',color:'var(--blue)',fontFamily:'var(--font-head)',fontSize:10,cursor:'pointer',width:'100%',minHeight:36 }}>
              📲 Install App
            </button>
          )}

          {/* Desktop expand toggle */}
          {!inDrawer && (
            <button onClick={()=>setExpanded(e=>!e)}
              style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'6px',color:'var(--muted2)',fontSize:13,cursor:'pointer',width:'100%',display:'flex',justifyContent:'center',minHeight:36 }}>
              {expanded?'◀':'▶'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <Toast message={toast}/>
      {showOnboarding && <OnboardingTour onComplete={()=>{ setShowOnboarding(false); localStorage.setItem('vt_onboarded','1') }}/>}
      {showSwitcher && <UserSwitcher currentUser={currentUser} allUsers={allUsers} onSwitch={switchUser} onCreate={createNewUser} onDelete={deleteUser} onClose={()=>setShowSwitcher(false)}/>}

      {/* ══ DESKTOP sidebar (fixed left) ══ */}
      {!isMobile && (
        <aside style={{
          width:SIDE, minWidth:SIDE, height:'100vh',
          position:'fixed', top:0, left:0,
          background:'rgba(5,10,22,0.98)',
          backdropFilter:'blur(24px)',
          borderRight:'1px solid rgba(255,255,255,0.08)',
          zIndex:100, display:'flex', flexDirection:'column',
          transition:'width .3s cubic-bezier(.4,0,.2,1), min-width .3s cubic-bezier(.4,0,.2,1)',
          boxShadow:'4px 0 20px rgba(0,0,0,0.4)', overflow:'hidden',
        }}>
          <SideContent inDrawer={false}/>
        </aside>
      )}

      {/* ══ MOBILE drawer ══ */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {sideOpen && (
            <div onClick={()=>setSideOpen(false)} style={{
              position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',
              backdropFilter:'blur(5px)',zIndex:299,
            }}/>
          )}
          {/* Drawer panel */}
          <aside style={{
            position:'fixed', top:0, left:0, width:230, height:'100vh',
            background:'rgba(5,10,22,0.99)',
            backdropFilter:'blur(28px)',
            borderRight:'1px solid rgba(255,255,255,0.10)',
            zIndex:300,
            transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition:'transform .26s cubic-bezier(.4,0,.2,1)',
            boxShadow: sideOpen ? '8px 0 32px rgba(0,0,0,0.6)' : 'none',
            display:'flex', flexDirection:'column', overflow:'hidden',
          }}>
            {/* Close btn */}
            <button onClick={()=>setSideOpen(false)} style={{
              position:'absolute',top:12,right:10,zIndex:1,
              background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:8,width:30,height:30,color:'var(--muted)',fontSize:14,
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'auto'
            }}>✕</button>
            <SideContent inDrawer={true}/>
          </aside>
        </>
      )}

      {/* ══ MAIN content area ══ */}
      <div style={{
        flex:1, marginLeft: isMobile ? 0 : SIDE,
        transition:'margin-left .3s cubic-bezier(.4,0,.2,1)',
        display:'flex', flexDirection:'column', minWidth:0,
      }}>

        {/* Mobile top bar */}
        {isMobile && (
          <header style={{
            height:52, flexShrink:0,
            padding:'0 14px',
            paddingTop:'var(--sat)',
            background:'rgba(3,7,18,0.96)',
            backdropFilter:'blur(24px)',
            borderBottom:'1px solid rgba(255,255,255,0.08)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            position:'sticky', top:0, zIndex:100,
          }}>
            {/* Hamburger */}
            <button onClick={()=>setSideOpen(true)} style={{
              width:38, height:38, background:'rgba(0,255,231,0.08)',
              border:'1px solid rgba(0,255,231,0.25)', borderRadius:10,
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', gap:5, cursor:'pointer', padding:0, minHeight:'auto',
            }}>
              {[18,14,18].map((w,i)=>(
                <div key={i} style={{ width:w,height:2,borderRadius:999,background:'var(--teal)',boxShadow:'0 0 4px var(--teal)' }}/>
              ))}
            </button>

            {/* Current tab name */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:18 }}>{TABS[tab].icon}</span>
              <span style={{ fontFamily:'var(--font-head)',fontSize:12,fontWeight:700,color:'var(--teal)',letterSpacing:1 }}>
                {TABS[tab].label.toUpperCase()}
              </span>
            </div>

            {/* Avatar */}
            <button onClick={()=>setShowSwitcher(true)} style={{
              width:34,height:34,borderRadius:'50%',
              background:'linear-gradient(135deg,rgba(167,139,250,0.5),rgba(0,255,231,0.3))',
              border:'1px solid rgba(167,139,250,0.35)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:16,cursor:'pointer',minHeight:'auto',
            }}>{currentUser?.avatar||'👤'}</button>
          </header>
        )}

        {/* Page content */}
        <main style={{
          flex:1,
          padding: isMobile ? '14px 12px 28px' : '22px 28px',
          maxWidth:1040, width:'100%', margin:'0 auto',
        }}>
          {tab===0  && <Dashboard       activities={activities} nutrition={nutrition} sleepLogs={sleepLogs} waterToday={waterToday} goals={goals} mood={mood} setMood={setMood} addWater={addWater} showToast={showToast} profile={profile}/>}
          {tab===1  && <Activity        activities={activities} onAdd={addAct} onDelete={delAct} showToast={showToast} userWeight={profile.weight} deviceId={deviceId}/>}
          {tab===2  && <Nutrition       nutrition={nutrition} onAdd={addNut} onDelete={delNut} showToast={showToast}/>}
          {tab===3  && <Sleep           sleepLogs={sleepLogs} onAdd={addSlp} onDelete={delSlp} showToast={showToast}/>}
          {tab===4  && <Progress        activities={activities} sleepLogs={sleepLogs} nutrition={nutrition}/>}
          {tab===5  && <Goals           goals={goals} onUpdateGoals={updateGoals} profile={profile} onUpdateProfile={updateProfile} activities={activities} sleepLogs={sleepLogs} waterToday={waterToday} showToast={showToast}/>}
          {tab===6  && <RiskAssessment  deviceId={deviceId} showToast={showToast}/>}
          {tab===7  && <BodyComposition deviceId={deviceId} profile={profile} showToast={showToast}/>}
          {tab===8  && <Medications     deviceId={deviceId} showToast={showToast}/>}
          {tab===9  && <Gamification    deviceId={deviceId} showToast={showToast}/>}
          {tab===10 && <Reminders       reminders={reminders} permission={permission} requestPermission={requestPermission} addReminder={addReminder} toggleReminder={toggleReminder} deleteReminder={deleteReminder} snoozeReminder={snoozeReminder} playBeep={playBeep} syncRemindersToSW={syncRemindersToSW} swReady={swReady} installPrompt={installPrompt} installed={installed} installApp={installApp} showToast={showToast}/>}
        </main>
      </div>

      <style>{`
        aside::-webkit-scrollbar { display:none; }
        * { -webkit-tap-highlight-color:transparent; }
      `}</style>
    </div>
  )
}
