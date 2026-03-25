// pages/Dashboard.jsx — Dashboard with Python ML backend integration

import { useMemo } from 'react'
import CircleProgress from '../components/CircleProgress'
import StatCard       from '../components/StatCard'
import WeekBar        from '../components/WeekBar'
import { Btn, Badge, SectionTitle } from '../components/GlassInput'
import { useMLData } from '../hooks/useMLData'

const today = new Date().toISOString().split('T')[0]
const last7 = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]
})
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MOOD_DATA = [
  { emoji: '😭', label: 'Very Sad',  color: '#60a5fa' },
  { emoji: '😔', label: 'Sad',       color: '#a78bfa' },
  { emoji: '😐', label: 'Neutral',   color: '#fbbf24' },
  { emoji: '😊', label: 'Happy',     color: '#34d399' },
  { emoji: '🤩', label: 'Excited',   color: '#f472b6' },
]

// ── Reusable sub-components ────────────────────────────────
function MLBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100))
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--muted2)', fontSize: 11 }}>{label}</span>
        <span style={{ color, fontFamily: 'var(--font-head)', fontSize: 11 }}>{value} / {max}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, boxShadow: `0 0 6px ${color}66`, transition: 'width 1s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  )
}

function MLSkeleton() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[80, 60, 90, 50].map((w, i) => (
        <div key={i} style={{ height: 14, width: `${w}%`, background: 'rgba(255,255,255,0.06)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

function MLError({ message, onRetry }) {
  return (
    <div style={{ padding: 20, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
      <span style={{ fontSize: 24 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#ef4444', fontFamily: 'var(--font-head)', fontSize: 12, marginBottom: 4 }}>ML BACKEND OFFLINE</div>
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>{message}</div>
        <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 6 }}>
          <code style={{ color: 'var(--teal)', background: 'rgba(0,255,231,0.08)', padding: '1px 6px', borderRadius: 4 }}></code>
        </div>
      </div>
      <Btn onClick={onRetry} color="#ef4444" variant="outline">Retry</Btn>
    </div>
  )
}

export default function Dashboard({ activities, nutrition, sleepLogs, waterToday, goals, mood, setMood, addWater, showToast, profile }) {

  // ── Today stats ───────────────────────────────────────────
  const todayActs  = activities.filter(l => l.date === today)
  const todaySteps = todayActs.reduce((s, l) => s + (l.steps || 0), 0)
  const todayCals  = todayActs.reduce((s, l) => s + (l.calories || 0), 0)
  const todayExerc = todayActs.reduce((s, l) => s + (l.duration || 0), 0)
  const todayNut   = nutrition.filter(n => n.date === today)
  const todayCalIn = todayNut.reduce((s, n) => s + (n.calories || 0), 0)
  const todaySleep = sleepLogs.find(s => s.date === today)

  // ── 7-day series ──────────────────────────────────────────
  const weekSteps = last7.map(d => activities.filter(l => l.date === d).reduce((s, l) => s + (l.steps || 0), 0))
  const weekCals  = last7.map(d => activities.filter(l => l.date === d).reduce((s, l) => s + (l.calories || 0), 0))
  const weekSleep = last7.map(d => { const sl = sleepLogs.find(s => s.date === d); return sl?.duration || 0 })
  const weekWater = last7.map((_, i) => i === 6 ? waterToday : 0)

  // ── Python ML data ────────────────────────────────────────
  const { data: ml, loading: mlLoading, error: mlError, refresh: mlRefresh } = useMLData(14)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      
      <div className="glass fade-up" style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--muted2)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-head)' }}>Today's Mood</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {MOOD_DATA.map((m, i) => (
            <button key={i} onClick={() => { setMood(i); showToast(`Mood: ${m.label}`) }}
              style={{ fontSize: 24, background: mood === i ? `${m.color}22` : 'transparent', border: `2px solid ${mood === i ? m.color : 'transparent'}`, borderRadius: 10, padding: '5px 8px', cursor: 'pointer', transition: 'all 0.2s', transform: mood === i ? 'scale(1.25)' : 'scale(1)', boxShadow: mood === i ? `0 0 14px ${m.color}66` : 'none' }}>
              {m.emoji}
            </button>
          ))}
        </div>
        {mood !== null && <Badge color={MOOD_DATA[mood].color}>{MOOD_DATA[mood].label}</Badge>}
        <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-head)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      
      <div className="glass fade-up delay-1 scan-effect" style={{ padding: '24px', position: 'relative' }}>
        <SectionTitle icon="⭕" color="var(--teal)">Activity Rings</SectionTitle>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 18 }}>
          {[
            { value: todaySteps, max: goals.steps,    color: 'var(--teal)',   label: 'Steps',    unit: `/${goals.steps}` },
            { value: todayCals,  max: goals.calories, color: 'var(--pink)',   label: 'Burned',   unit: 'kcal' },
            { value: todayCalIn, max: goals.calories, color: 'var(--blue)',   label: 'Intake',   unit: 'kcal' },
            { value: waterToday, max: goals.water,    color: 'var(--green)',  label: 'Water',    unit: `/${goals.water}L` },
            { value: todayExerc, max: goals.exercise, color: 'var(--orange)', label: 'Exercise', unit: 'min' },
            { value: todaySleep?.duration || 0, max: goals.sleep, color: 'var(--violet)', label: 'Sleep', unit: 'hrs' },
          ].map((r, i) => (
            <div key={i} style={{ animation: `fadeUp 0.5s cubic-bezier(.2,.8,.2,1) ${0.05 + i * 0.07}s both` }}>
              <CircleProgress {...r} size={94} stroke={8} />
            </div>
          ))}
        </div>
      </div>

      
      <div className="glass fade-up delay-1" style={{ padding: 24, borderTop: `2px solid ${ml?.health_score?.color || 'var(--teal)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(0,255,231,0.12)', border: '1px solid rgba(0,255,231,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700, color: 'var(--teal)', letterSpacing: 1 }}>ML · HEALTH SCORE</span>
            <Badge color="var(--violet)">Python </Badge>
          </div>
          <Btn onClick={mlRefresh} color="var(--muted2)" variant="outline" style={{ padding: '6px 12px', fontSize: 10 }}>↺ Refresh</Btn>
        </div>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : ml?.health_score && (
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, alignItems: 'center' }}>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', margin: '0 auto',
                background: `conic-gradient(${ml.health_score.color} ${ml.health_score.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 32px ${ml.health_score.color}44`, position: 'relative'
              }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#030712', position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 900, color: ml.health_score.color, lineHeight: 1, textShadow: `0 0 20px ${ml.health_score.color}88` }}>{ml.health_score.score}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 10 }}>/ 100</div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-head)', color: ml.health_score.color, fontSize: 22, fontWeight: 900 }}>{ml.health_score.grade}</span>
                <Badge color={ml.health_score.color}>{ml.health_score.label}</Badge>
              </div>
            </div>
            
            <div>
              <div style={{ color: 'var(--muted2)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-head)', marginBottom: 12 }}>Score Breakdown</div>
              <MLBar label="Activity (steps)"  value={ml.health_score.breakdown.activity}  max={30} color="var(--teal)" />
              <MLBar label="Sleep quality"     value={ml.health_score.breakdown.sleep}     max={25} color="var(--violet)" />
              <MLBar label="Hydration"         value={ml.health_score.breakdown.hydration} max={20} color="var(--green)" />
              <MLBar label="Calorie balance"   value={ml.health_score.breakdown.nutrition} max={15} color="var(--orange)" />
              <MLBar label="BMI"               value={ml.health_score.breakdown.bmi}       max={10} color="var(--blue)" />
            </div>
          </div>
        )}
      </div>

      
      <div className="glass fade-up delay-2" style={{ padding: 24, borderTop: '2px solid var(--blue)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔮</div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1 }}>ML · STEP PREDICTIONS — NEXT 3 DAYS</span>
          <Badge color="var(--blue)"></Badge>
        </div>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : ml?.predictions && (
          <>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 12, padding: '10px 16px' }}>
              <span style={{ fontSize: 22 }}>
                {ml.predictions.trend === 'increasing' ? '📈' : ml.predictions.trend === 'decreasing' ? '📉' : '➡️'}
              </span>
              <div>
                <div style={{ color: 'var(--blue)', fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700 }}>
                  Trend: {ml.predictions.trend.toUpperCase()}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>
                  Slope: {ml.predictions.slope > 0 ? '+' : ''}{ml.predictions.slope} steps/day &nbsp;·&nbsp; R² = {ml.predictions.r2}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Badge color={ml.predictions.r2 > 0.7 ? 'var(--green)' : ml.predictions.r2 > 0.4 ? 'var(--orange)' : 'var(--muted)'}>
                  {ml.predictions.confidence.charAt(0).toUpperCase() + ml.predictions.confidence.slice(1)} Confidence
                </Badge>
              </div>
            </div>

            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {ml.predictions.predictions.map((steps, i) => {
                const labels = ['Tomorrow', 'Day After', 'Day +3']
                const pct    = Math.min(100, Math.round((steps / (goals.steps || 10000)) * 100))
                const color  = steps >= (goals.steps || 10000) ? 'var(--green)' : steps >= (goals.steps || 10000) * 0.7 ? 'var(--orange)' : '#ef4444'
                return (
                  <div key={i} style={{ background: `${color}08`, border: `1px solid ${color}28`, borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--muted2)', fontSize: 10, fontFamily: 'var(--font-head)', letterSpacing: 1, marginBottom: 8 }}>{labels[i].toUpperCase()}</div>
                    <div style={{ color, fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 900, textShadow: `0 0 16px ${color}66` }}>{steps.toLocaleString()}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 4 }}>predicted steps</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999, margin: '10px 0 6px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
                    </div>
                    <Badge color={color}>{pct}% of goal</Badge>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      
      <div className="glass fade-up delay-2" style={{ padding: 24, borderTop: '2px solid var(--pink)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,45,120,0.12)', border: '1px solid rgba(255,45,120,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔍</div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700, color: 'var(--pink)', letterSpacing: 1 }}>ML · ANOMALY DETECTION</span>
          <Badge color="var(--pink)"></Badge>
        </div>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : ml?.anomalies && (
          <>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 14 }}>
              IsolationForest algorithm detects statistically unusual days in your step data
            </div>
            
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80, marginBottom: 14, overflow: "hidden" }}>
              {weekSteps.map((v, i) => {
                const anom   = ml.anomalies[i] || {}
                const max    = Math.max(...weekSteps, 1)
                const h = Math.max(4, Math.min(65, (v / max) * 65))
                const isToday = i === 6
                const color  = anom.is_anomaly ? 'var(--pink)' : isToday ? 'var(--teal)' : 'rgba(0,255,231,0.38)'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      {anom.is_anomaly && (
                        <div style={{ position: 'absolute', bottom: '100%', marginBottom: 2, fontSize: 13 }}>
                          {anom.direction === 'high' ? '⬆️' : '⬇️'}
                        </div>
                      )}
                      {isToday && !anom.is_anomaly && (
                        <div style={{ position: 'absolute', bottom: '100%', marginBottom: 2, color: 'var(--teal)', fontSize: 9, fontFamily: 'var(--font-head)' }}>TODAY</div>
                      )}
                      <div style={{ width: '80%', height: `${h}px`, borderRadius: 6, background: color, boxShadow: anom.is_anomaly ? '0 0 12px var(--pink)' : isToday ? '0 0 10px var(--teal)' : 'none', border: anom.is_anomaly ? '1px solid var(--pink)' : '1px solid transparent', transition: 'height 0.7s' }} />
                    </div>
                    <span style={{ color: anom.is_anomaly ? 'var(--pink)' : isToday ? 'var(--teal)' : 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-head)', fontWeight: anom.is_anomaly || isToday ? 700 : 400 }}>
                      {DAY_LABELS[i]}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: 8 }}>{v > 0 ? v.toLocaleString() : '—'}</span>
                  </div>
                )
              })}
            </div>

            
            {ml.anomalies.some(a => a.is_anomaly) ? (
              <div style={{ background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.3)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <div style={{ color: 'var(--pink)', fontFamily: 'var(--font-head)', fontSize: 12, marginBottom: 4 }}>ANOMALIES DETECTED</div>
                  <div style={{ color: 'var(--muted2)', fontSize: 12 }}>
                    Unusual step patterns on: {ml.anomalies.map((a, i) => a.is_anomaly ? DAY_LABELS[i] : null).filter(Boolean).join(', ')}
                    &nbsp;(Algorithm: {ml.anomalies.find(a => a.is_anomaly)?.method?.replace('_', ' ')})
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(34,211,165,0.08)', border: '1px solid rgba(34,211,165,0.25)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span>✅</span>
                <span style={{ color: 'var(--green)', fontSize: 12 }}>No anomalies detected — your activity pattern is consistent!</span>
              </div>
            )}
          </>
        )}
      </div>

      
      <div className="glass fade-up delay-3" style={{ padding: 24, borderTop: '2px solid var(--teal)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(0,255,231,0.12)', border: '1px solid rgba(0,255,231,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💡</div>
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700, color: 'var(--teal)', letterSpacing: 1 }}>ML · SMART RECOMMENDATIONS</span>
          <Badge color="var(--teal)">AI Engine</Badge>
        </div>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : (
          ml?.recommendations?.length === 0 ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 28, fontFamily: 'var(--font-head)', letterSpacing: 1, fontSize: 12 }}>LOG MORE DATA TO GET PERSONALIZED RECOMMENDATIONS</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(ml?.recommendations || []).map((rec, i) => {
                const priorityColors = { high: '#ef4444', medium: '#fb923c', positive: '#22d3a5', low: '#6b7280' }
                const pc = priorityColors[rec.priority] || 'var(--muted2)'
                return (
                  <div key={i} style={{ background: `${rec.color}08`, border: `1px solid ${rec.color}22`, borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${rec.color}18`, border: `1px solid ${rec.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{rec.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'var(--font-head)', color: rec.color, fontSize: 12, fontWeight: 700 }}>{rec.title}</span>
                        <Badge color={pc}>{rec.priority.toUpperCase()}</Badge>
                      </div>
                      <div style={{ color: 'var(--muted2)', fontSize: 12, lineHeight: 1.6 }}>{rec.body}</div>
                      <div style={{ marginTop: 8, color: rec.color, fontSize: 12, fontWeight: 700 }}>→ {rec.action}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        
        {!mlLoading && !mlError && ml?.calorie_model && (
          <div style={{ marginTop: 14, background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.22)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--orange)', fontFamily: 'var(--font-head)', fontSize: 11, marginBottom: 3 }}>CALORIE BALANCE MODEL ()</div>
              <div style={{ color: 'var(--muted2)', fontSize: 12 }}>{ml.calorie_model.message}</div>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { label: 'BMR',     value: ml.calorie_model.bmr,     color: 'var(--blue)' },
                { label: 'TDEE',    value: ml.calorie_model.tdee,    color: 'var(--violet)' },
                { label: 'Balance', value: (ml.calorie_model.balance > 0 ? '+' : '') + ml.calorie_model.balance, color: ml.calorie_model.status === 'surplus' ? '#ef4444' : ml.calorie_model.status === 'deficit' ? 'var(--blue)' : 'var(--green)' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: s.color, fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16 }}>{s.value}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 9 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ml && (
          <div style={{ marginTop: 12, color: 'var(--muted)', fontSize: 10, textAlign: 'right' }}>
            {ml.generated_at?.slice(0, 19)?.replace('T', ' ')} UTC · {ml.data_points} 
          </div>
        )}
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 14 }}>
        {[
          { icon: '🦶', label: 'Steps',    value: todaySteps.toLocaleString(), color: 'var(--teal)',   sub: `Goal: ${goals.steps?.toLocaleString()}`, delay: 0 },
          { icon: '🔥', label: 'Cal Out',  value: todayCals,  unit: 'kcal', color: 'var(--pink)',   delay: 0.06 },
          { icon: '🍽️', label: 'Cal In',  value: todayCalIn, unit: 'kcal', color: 'var(--blue)',   delay: 0.12 },
          { icon: '💧', label: 'Water',    value: waterToday, unit: 'L',    color: 'var(--green)',  sub: `Goal: ${goals.water}L`, delay: 0.18 },
          { icon: '🏃', label: 'Exercise', value: todayExerc, unit: 'min',  color: 'var(--orange)', delay: 0.24 },
          { icon: '😴', label: 'Sleep',    value: todaySleep?.duration || 0, unit: 'hrs', color: 'var(--violet)', delay: 0.30 },
        ].map(p => <StatCard key={p.label} {...p} />)}
      </div>

      
      <div className="glass fade-up" style={{ padding: 20 }}>
        <SectionTitle icon="💧" color="var(--green)">Quick Water Log</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {[0.25, 0.5, 1, 1.5].map(v => (
            <Btn key={v} color="var(--green)" variant="outline" onClick={() => { addWater(v); showToast(`+${v}L added!`) }}>+{v}L</Btn>
          ))}
          <span style={{ color: 'var(--green)', fontWeight: 900, fontSize: 22, fontFamily: 'var(--font-head)' }}>{waterToday}L</span>
          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, minWidth: 80 }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,var(--green),var(--teal))', width: `${Math.min(waterToday / (goals.water || 8) * 100, 100)}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { data: weekSteps, label: 'Weekly Steps',      color: 'var(--teal)' },
          { data: weekSleep, label: 'Weekly Sleep (hrs)', color: 'var(--violet)' },
          { data: weekCals,  label: 'Weekly Cal Burned',  color: 'var(--pink)' },
          { data: weekWater, label: 'Weekly Water (L)',    color: 'var(--green)' },
        ].map((w, i) => (
          <div key={w.label} className="glass fade-up" style={{ padding: 18, animationDelay: `${0.05 + i * 0.07}s` }}>
            <WeekBar data={w.data} label={w.label} color={w.color} />
          </div>
        ))}
      </div>

      
      {todayActs.length > 0 && (
        <div className="glass fade-up" style={{ padding: 22 }}>
          <SectionTitle icon="🏃" color="var(--teal)">Today's Activities</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayActs.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '13px 18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,255,231,0.1)', border: '1px solid rgba(0,255,231,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {{ Running: '🏃', Cycling: '🚴', Swimming: '🏊', Yoga: '🧘', Gym: '💪', HIIT: '⚡', Walking: '🚶', Meditation: '🧠' }[l.type] || '🏃'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 13 }}>{l.type}</div>
                    <div style={{ color: 'var(--muted2)', fontSize: 12, marginTop: 2 }}>{l.duration} min{l.notes ? ` · ${l.notes}` : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {l.calories > 0 && <div style={{ color: 'var(--pink)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>{l.calories} kcal</div>}
                  {l.steps > 0    && <div style={{ color: 'var(--teal)', fontFamily: 'var(--font-head)', fontSize: 13 }}>{Number(l.steps).toLocaleString()} steps</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <Badge color="var(--muted)">🤖  ·  ·  ·  · </Badge>
      </div>
    </div>
  )
}
