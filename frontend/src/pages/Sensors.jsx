// pages/Sensors.jsx — Full sensor dashboard for mobile + laptop

import { useState, useRef, useEffect } from 'react'
import { SectionTitle, Btn, Badge } from '../components/GlassInput'
import {
  useStepCounter, useGyroscope, useBattery,
  useGeolocation, useNetwork, useMediaDevices,
  useAmbientLight, useScreen
} from '../hooks/useSensors'

// Mini gauge bar
function MiniBar({ value, max, color, label, unit }) {
  const pct = Math.min((value||0) / (max||1) * 100, 100)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ color:'var(--muted2)', fontSize:11 }}>{label}</span>
        <span style={{ color, fontFamily:'var(--font-head)', fontSize:11 }}>{value??'—'}{unit}</span>
      </div>
      <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:999 }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:999, boxShadow:`0 0 6px ${color}88`, transition:'width 0.4s' }}/>
      </div>
    </div>
  )
}

// Sensor card wrapper
function SCard({ title, icon, color, active, children, supported=true, badge }) {
  return (
    <div className="glass" style={{
      padding:20, borderTop:`2px solid ${supported&&active ? color : 'rgba(255,255,255,0.06)'}`,
      transition:'all 0.3s',
      boxShadow: active ? `0 0 24px ${color}18` : 'none'
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <div style={{
          width:34, height:34, borderRadius:9,
          background:`${color}18`, border:`1px solid ${color}30`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18
        }}>{icon}</div>
        <span style={{ fontFamily:'var(--font-head)', fontSize:12, fontWeight:700, color: active ? color : 'var(--muted2)', letterSpacing:1 }}>{title}</span>
        {badge && <Badge color={active ? color : 'var(--muted)'}>{badge}</Badge>}
        <div style={{ marginLeft:'auto' }}>
          {!supported
            ? <Badge color="var(--muted)">NOT SUPPORTED</Badge>
            : active
              ? <Badge color={color}>ACTIVE</Badge>
              : <Badge color="var(--muted2)">IDLE</Badge>
          }
        </div>
      </div>
      {children}
    </div>
  )
}

// Animated bars for microphone
function MicBars({ level }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:36 }}>
      {Array.from({length:16}).map((_, i) => {
        const h = Math.max(4, Math.min(36, (level/255) * 36 * (0.5 + Math.random()*0.5)))
        return (
          <div key={i} style={{
            width:5, borderRadius:3,
            height: `${h}px`,
            background:`hsl(${160+i*5},80%,60%)`,
            transition:'height 0.08s', opacity:0.8
          }}/>
        )
      })}
    </div>
  )
}

export default function Sensors({ showToast }) {
  const steps    = useStepCounter()
  const gyro     = useGyroscope()
  const battery  = useBattery()
  const geo      = useGeolocation()
  const network  = useNetwork()
  const media    = useMediaDevices()
  const ambient  = useAmbientLight()
  const screen   = useScreen()
  const videoRef = useRef(null)

  // Feed camera stream to video element
  useEffect(() => {
    if (media.camOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video:true }).then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }).catch(() => {})
    } else if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [media.camOn])

  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Header note */}
      <div className="glass fade-up" style={{ padding:'14px 20px', borderTop:'2px solid var(--teal)' }}>
        <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:22 }}>🔬</span>
          <div>
            <div style={{ fontFamily:'var(--font-head)', color:'var(--teal)', fontSize:13 }}>SENSOR LAB</div>
            <div style={{ color:'var(--muted)', fontSize:12 }}>
              Mobile + Laptop dono ke sensors live yahan dikhte hain. HTTPS required for some sensors.
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
            <Badge color={network.online ? 'var(--green)' : '#ef4444'}>
              {network.online ? '🟢 Online' : '🔴 Offline'}
            </Badge>
            <Badge color="var(--blue)">{screen.innerW}×{screen.innerH}</Badge>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* ── 1. STEP COUNTER ── */}
        <SCard title="STEP COUNTER" icon="🦶" color="var(--teal)"
          active={steps.active} supported={steps.supported} badge="Mobile">
          <div style={{ textAlign:'center', marginBottom:14 }}>
            <div style={{
              fontFamily:'var(--font-head)', fontSize:56, fontWeight:900, lineHeight:1,
              color: steps.active ? 'var(--teal)' : 'var(--muted)',
              textShadow: steps.active ? '0 0 30px var(--teal)' : 'none', transition:'all 0.3s'
            }}>{steps.steps}</div>
            <div style={{ color:'var(--muted)', fontSize:11, letterSpacing:2 }}>STEPS</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { label:'Calories', value: Math.round(steps.steps*0.04), unit:'kcal', color:'var(--pink)' },
              { label:'Distance', value: (steps.steps*0.762/1000).toFixed(2), unit:'km', color:'var(--blue)' },
              { label:'Duration', value: steps.active ? '...' : '—', unit:'', color:'var(--orange)' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ color:s.color, fontFamily:'var(--font-head)', fontWeight:800, fontSize:16 }}>{s.value}</div>
                <div style={{ color:'var(--muted)', fontSize:9 }}>{s.unit}</div>
                <div style={{ color:'var(--muted2)', fontSize:9 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {steps.error && <div style={{ color:'var(--orange)', fontSize:11, background:'rgba(251,146,60,0.08)', borderRadius:8, padding:'8px 12px', marginBottom:10 }}>⚠️ {steps.error}</div>}
          <div style={{ display:'flex', gap:8 }}>
            {!steps.active
              ? <Btn onClick={steps.startCounting} color="var(--teal)" icon="▶">Start</Btn>
              : <Btn onClick={() => { steps.stopCounting(); showToast(`✅ ${steps.steps} steps saved!`) }} color="var(--pink)" icon="⬛">Stop</Btn>
            }
            {steps.steps > 0 && <Btn onClick={steps.reset} color="var(--muted2)" variant="outline" icon="↺">Reset</Btn>}
          </div>
          {steps.supported && <div style={{ color:'var(--muted)', fontSize:10, marginTop:8 }}>📱 Phone ko pocket mein rakho, chalte waqt Start karo</div>}
        </SCard>

        {/* ── 2. GYROSCOPE ── */}
        <SCard title="GYROSCOPE" icon="🌀" color="var(--violet)"
          active={gyro.active} supported={gyro.supported} badge="Mobile">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              { axis:'α Alpha',  value: gyro.data.alpha, desc:'Z-axis rotation (compass)', color:'var(--pink)' },
              { axis:'β Beta',   value: gyro.data.beta,  desc:'X-axis tilt (front-back)',  color:'var(--orange)' },
              { axis:'γ Gamma',  value: gyro.data.gamma, desc:'Y-axis tilt (left-right)',  color:'var(--teal)' },
            ].map(g => (
              <div key={g.axis} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'12px 8px', textAlign:'center' }}>
                <div style={{ color:g.color, fontFamily:'var(--font-head)', fontSize:20, fontWeight:800 }}>{g.value}°</div>
                <div style={{ color:'var(--muted2)', fontSize:9, marginTop:3 }}>{g.axis}</div>
                <div style={{ color:'var(--muted)', fontSize:9, marginTop:2 }}>{g.desc}</div>
              </div>
            ))}
          </div>
          {/* Visual orientation indicator */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <div style={{
              width:60, height:60, border:'2px solid var(--violet)',
              borderRadius:8, background:'rgba(167,139,250,0.08)',
              display:'flex', alignItems:'center', justifyContent:'center',
              transform: `rotateX(${gyro.data.beta}deg) rotateZ(${gyro.data.gamma}deg)`,
              transition:'transform 0.1s', fontSize:28
            }}>📱</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {!gyro.active
              ? <Btn onClick={gyro.start} color="var(--violet)" icon="▶">Start Gyro</Btn>
              : <Btn onClick={gyro.stop}  color="var(--pink)"   icon="⬛">Stop</Btn>
            }
          </div>
        </SCard>

        {/* ── 3. BATTERY ── */}
        <SCard title="BATTERY" icon="🔋" color="var(--green)"
          active={battery.supported && battery.battery !== null} supported={battery.supported} badge="Laptop+Mobile">
          {battery.battery ? (
            <>
              {/* Big battery visual */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:14 }}>
                <div style={{ position:'relative', width:80, height:36, border:'2px solid var(--green)', borderRadius:6, overflow:'hidden' }}>
                  <div style={{
                    position:'absolute', left:0, top:0, bottom:0,
                    width:`${battery.battery.level}%`,
                    background: battery.battery.level > 50 ? 'var(--green)' : battery.battery.level > 20 ? 'var(--orange)' : '#ef4444',
                    transition:'width 0.8s, background 0.5s'
                  }}/>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontSize:13, fontWeight:700, color:'#fff', zIndex:1 }}>
                    {battery.battery.level}%
                  </div>
                </div>
                <div>
                  <Badge color={battery.battery.charging ? 'var(--green)' : 'var(--orange)'}>
                    {battery.battery.charging ? '⚡ Charging' : '🔋 Discharging'}
                  </Badge>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Level', value:`${battery.battery.level}%`, color:'var(--green)' },
                  { label:'Status', value: battery.battery.charging ? 'Charging' : 'On Battery', color:'var(--orange)' },
                  { label:'Charge Time', value: battery.battery.chargingTime ? `${battery.battery.chargingTime}min` : '—', color:'var(--teal)' },
                  { label:'Time Left', value: battery.battery.dischargingTime ? `${battery.battery.dischargingTime}min` : '—', color:'var(--blue)' },
                ].map(b => (
                  <div key={b.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ color:'var(--muted)', fontSize:10 }}>{b.label}</div>
                    <div style={{ color:b.color, fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, marginTop:3 }}>{b.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color:'var(--muted)', textAlign:'center', padding:20, fontSize:12 }}>
              {battery.supported ? 'Loading battery info...' : '⚠️ Battery API not supported in this browser'}
            </div>
          )}
        </SCard>

        {/* ── 4. GEOLOCATION ── */}
        <SCard title="GEOLOCATION" icon="📍" color="var(--pink)"
          active={geo.location !== null} supported={geo.supported} badge="GPS+WiFi">
          {geo.location ? (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { label:'Latitude',  value:geo.location.lat,      color:'var(--pink)' },
                  { label:'Longitude', value:geo.location.lng,      color:'var(--blue)' },
                  { label:'Accuracy',  value:`±${geo.location.accuracy}m`, color:'var(--orange)' },
                  { label:'Speed',     value: geo.location.speed ? `${geo.location.speed}km/h` : '0 km/h', color:'var(--teal)' },
                ].map(g => (
                  <div key={g.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px' }}>
                    <div style={{ color:'var(--muted)', fontSize:10 }}>{g.label}</div>
                    <div style={{ color:g.color, fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, marginTop:3 }}>{g.value}</div>
                  </div>
                ))}
              </div>
              <a href={`https://maps.google.com/?q=${geo.location.lat},${geo.location.lng}`} target="_blank" rel="noreferrer"
                style={{ color:'var(--blue)', fontSize:12, textDecoration:'none' }}>🗺️ View on Google Maps →</a>
            </>
          ) : (
            <div style={{ color:'var(--muted)', marginBottom:14, fontSize:12 }}>
              {geo.error ? `❌ ${geo.error}` : 'Aapki current location fetch karo'}
            </div>
          )}
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <Btn onClick={geo.getOnce} color="var(--pink)" icon={geo.loading?'⏳':'📍'}>
              {geo.loading ? 'Fetching...' : 'Get Location'}
            </Btn>
          </div>
        </SCard>

        {/* ── 5. NETWORK ── */}
        <SCard title="NETWORK" icon="📶" color="var(--blue)"
          active={network.online} supported={true} badge="Laptop+Mobile">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Status',    value: network.online ? 'Online ✅' : 'Offline ❌', color: network.online ? 'var(--green)' : '#ef4444' },
              { label:'Type',      value: network.type,          color:'var(--blue)' },
              { label:'Speed',     value: network.effectiveType.toUpperCase(), color:'var(--teal)' },
              { label:'Downlink',  value: network.downlink ? `${network.downlink} Mbps` : '—', color:'var(--orange)' },
              { label:'Latency',   value: network.rtt ? `${network.rtt}ms` : '—', color:'var(--violet)' },
              { label:'Data Saver',value: network.saveData ? 'ON' : 'OFF', color: network.saveData ? 'var(--orange)' : 'var(--muted)' },
            ].map(n => (
              <div key={n.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ color:'var(--muted)', fontSize:10 }}>{n.label}</div>
                <div style={{ color:n.color, fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, marginTop:3 }}>{n.value||'—'}</div>
              </div>
            ))}
          </div>
          {network.downlink && (
            <div style={{ marginTop:12 }}>
              <MiniBar value={network.downlink} max={100} color="var(--blue)" label="Downlink Speed" unit=" Mbps" />
            </div>
          )}
        </SCard>

        {/* ── 6. CAMERA + MIC ── */}
        <SCard title="CAMERA & MIC" icon="📷" color="var(--orange)"
          active={media.camOn || media.micOn} supported={true} badge="Laptop+Mobile">
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'8px 14px' }}>
              <div style={{ color:'var(--muted)', fontSize:10 }}>Cameras found</div>
              <div style={{ color:'var(--orange)', fontFamily:'var(--font-head)', fontSize:18, fontWeight:800 }}>{media.cameras.length}</div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'8px 14px' }}>
              <div style={{ color:'var(--muted)', fontSize:10 }}>Mics found</div>
              <div style={{ color:'var(--teal)', fontFamily:'var(--font-head)', fontSize:18, fontWeight:800 }}>{media.mics.length}</div>
            </div>
          </div>

          {/* Camera preview */}
          {media.camOn && (
            <video ref={videoRef} autoPlay muted playsInline style={{
              width:'100%', borderRadius:12, border:'1px solid var(--orange)',
              background:'#000', marginBottom:10, maxHeight:140, objectFit:'cover'
            }}/>
          )}

          {/* Mic level */}
          {media.micOn && (
            <div style={{ marginBottom:12 }}>
              <div style={{ color:'var(--muted)', fontSize:10, marginBottom:6 }}>MIC LEVEL</div>
              <MicBars level={media.micLevel} />
              <MiniBar value={media.micLevel} max={255} color="var(--green)" label="Volume" unit="" />
            </div>
          )}

          {media.error && <div style={{ color:'var(--orange)', fontSize:11, marginBottom:10 }}>⚠️ {media.error}</div>}

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Btn onClick={media.camOn ? media.stopCamera : media.startCamera}
              color={media.camOn ? 'var(--pink)' : 'var(--orange)'}
              icon={media.camOn ? '⬛' : '📷'}>
              {media.camOn ? 'Stop Cam' : 'Camera'}
            </Btn>
            <Btn onClick={media.micOn ? media.stopMic : media.startMic}
              color={media.micOn ? 'var(--pink)' : 'var(--teal)'}
              icon={media.micOn ? '⬛' : '🎤'}>
              {media.micOn ? 'Stop Mic' : 'Microphone'}
            </Btn>
          </div>
        </SCard>

        {/* ── 7. AMBIENT LIGHT ── */}
        <SCard title="AMBIENT LIGHT" icon="💡" color="var(--orange)"
          active={ambient.lux !== null} supported={ambient.supported} badge="Experimental">
          {ambient.supported ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:14 }}>
                <div style={{
                  width:70, height:70, borderRadius:'50%',
                  background: ambient.lux === null ? 'var(--muted)' :
                    ambient.lux < 50 ? '#1e3a5f' : ambient.lux < 300 ? '#3b5998' : ambient.lux < 1000 ? '#f59e0b' : '#fbbf24',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:30,
                  transition:'background 0.5s',
                  boxShadow: ambient.lux && ambient.lux > 300 ? `0 0 30px ${ambient.lux > 1000 ? '#fbbf24' : '#f59e0b'}88` : 'none'
                }}>💡</div>
                <div>
                  <div style={{ color:'var(--orange)', fontFamily:'var(--font-head)', fontSize:32, fontWeight:900 }}>
                    {ambient.lux ?? '—'}
                  </div>
                  <div style={{ color:'var(--muted)', fontSize:11 }}>lux · {ambient.label}</div>
                </div>
              </div>
              <MiniBar value={ambient.lux||0} max={2000} color="var(--orange)" label="Light Level" unit=" lux" />
            </>
          ) : (
            <div style={{ color:'var(--muted)', fontSize:12, padding:'10px 0' }}>
              ⚠️ AmbientLightSensor sirf Chrome/Edge mein supported hai (experimental flag on karo).<br/>
              <code style={{ fontSize:10 }}>chrome://flags/#enable-generic-sensor-extra-classes</code>
            </div>
          )}
        </SCard>

        {/* ── 8. SCREEN INFO ── */}
        <SCard title="SCREEN INFO" icon="🖥️" color="var(--blue)"
          active={true} supported={true} badge="Laptop+Mobile">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { label:'Screen Size',    value:`${screen.width}×${screen.height}`,  color:'var(--blue)' },
              { label:'Viewport',       value:`${screen.innerW}×${screen.innerH}`, color:'var(--teal)' },
              { label:'Pixel Ratio',    value:`${screen.pixelRatio}x`,             color:'var(--violet)' },
              { label:'Color Depth',    value:`${screen.colorDepth} bit`,          color:'var(--orange)' },
              { label:'Orientation',    value: screen.orientation.replace(/-/g,' '), color:'var(--pink)' },
              { label:'Device Type',    value: screen.width < 768 ? '📱 Mobile' : screen.width < 1024 ? '💻 Tablet' : '🖥️ Desktop', color:'var(--green)' },
            ].map(s => (
              <div key={s.label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ color:'var(--muted)', fontSize:10 }}>{s.label}</div>
                <div style={{ color:s.color, fontFamily:'var(--font-head)', fontWeight:700, fontSize:12, marginTop:3 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </SCard>

      </div>
    </div>
  )
}
