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

function MLBar({ label, value, max, color }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100))
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'var(--muted2)', fontSize: 11 }}>{label}</span>
        <span style={{ color, fontFamily: 'var(--font-head)', fontSize: 11 }}>{value} / {max}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 1s' }} />
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
      </div>
      <Btn onClick={onRetry} color="#ef4444" variant="outline">Retry</Btn>
    </div>
  )
}

export default function Dashboard({ activities, nutrition, sleepLogs, waterToday, goals, mood, setMood, addWater, showToast, profile }) {

  const todayActs  = activities.filter(l => l.date === today)
  const todaySteps = todayActs.reduce((s, l) => s + (l.steps || 0), 0)
  const todayCals  = todayActs.reduce((s, l) => s + (l.calories || 0), 0)
  const todayExerc = todayActs.reduce((s, l) => s + (l.duration || 0), 0)
  const todayNut   = nutrition.filter(n => n.date === today)
  const todayCalIn = todayNut.reduce((s, n) => s + (n.calories || 0), 0)
  const todaySleep = sleepLogs.find(s => s.date === today)

  const weekSteps = last7.map(d => activities.filter(l => l.date === d).reduce((s, l) => s + (l.steps || 0), 0))
  const weekCals  = last7.map(d => activities.filter(l => l.date === d).reduce((s, l) => s + (l.calories || 0), 0))
  const weekSleep = last7.map(d => { const sl = sleepLogs.find(s => s.date === d); return sl?.duration || 0 })
  const weekWater = last7.map((_, i) => i === 6 ? waterToday : 0)

  const { data: ml, loading: mlLoading, error: mlError, refresh: mlRefresh } = useMLData(14)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Mood */}
      <div className="glass fade-up" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-head)' }}>Mood</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {MOOD_DATA.map((m, i) => (
            <button key={i} onClick={() => { setMood(i); showToast(`Mood: ${m.label}`) }}
              style={{ fontSize: 22, background: mood === i ? `${m.color}22` : 'transparent', border: `2px solid ${mood === i ? m.color : 'transparent'}`, borderRadius: 10, padding: '4px 7px', cursor: 'pointer', transition: 'all 0.2s', transform: mood === i ? 'scale(1.2)' : 'scale(1)', minHeight: 'auto' }}>
              {m.emoji}
            </button>
          ))}
        </div>
        {mood !== null && <Badge color={MOOD_DATA[mood].color}>{MOOD_DATA[mood].label}</Badge>}
        <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 10, fontFamily: 'var(--font-head)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Activity Rings */}
      <div className="glass fade-up delay-1" style={{ padding: '20px' }}>
        <SectionTitle icon="⭕" color="var(--teal)">Activity Rings</SectionTitle>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 14 }}>
          {[
            { value: todaySteps, max: goals.steps,    color: 'var(--teal)',   label: 'Steps',    unit: `/${goals.steps}` },
            { value: todayCals,  max: goals.calories, color: 'var(--pink)',   label: 'Burned',   unit: 'kcal' },
            { value: todayCalIn, max: goals.calories, color: 'var(--blue)',   label: 'Intake',   unit: 'kcal' },
            { value: waterToday, max: goals.water,    color: 'var(--green)',  label: 'Water',    unit: `/${goals.water}L` },
            { value: todayExerc, max: goals.exercise, color: 'var(--orange)', label: 'Exercise', unit: 'min' },
            { value: todaySleep?.duration || 0, max: goals.sleep, color: 'var(--violet)', label: 'Sleep', unit: 'hrs' },
          ].map((r, i) => (
            <div key={i} style={{ animation: `fadeUp 0.5s cubic-bezier(.2,.8,.2,1) ${0.05 + i * 0.07}s both` }}>
              <CircleProgress {...r} size={88} stroke={8} />
            </div>
          ))}
        </div>
      </div>

      {/* ML Health Score */}
      <div className="glass fade-up delay-1" style={{ padding: 20, borderTop: `2px solid ${ml?.health_score?.color || 'var(--teal)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <SectionTitle icon="🤖" color="var(--teal)">ML · Health Score</SectionTitle>
          <Btn onClick={mlRefresh} color="var(--muted2)" variant="outline" style={{ padding: '5px 10px', fontSize: 10, minHeight: 'auto' }}>↺</Btn>
        </div>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : ml?.health_score && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', margin: '0 auto', background: `conic-gradient(${ml.health_score.color} ${ml.health_score.score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#030712', position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 900, color: ml.health_score.color, lineHeight: 1 }}>{ml.health_score.score}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 9 }}>/ 100</div>
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-head)', color: ml.health_score.color, fontSize: 18, fontWeight: 900 }}>{ml.health_score.grade}</span>
                <Badge color={ml.health_score.color}>{ml.health_score.label}</Badge>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-head)', marginBottom: 10 }}>Breakdown</div>
              <MLBar label="Activity"  value={ml.health_score.breakdown.activity}  max={30} color="var(--teal)" />
              <MLBar label="Sleep"     value={ml.health_score.breakdown.sleep}     max={25} color="var(--violet)" />
              <MLBar label="Hydration" value={ml.health_score.breakdown.hydration} max={20} color="var(--green)" />
              <MLBar label="Calories"  value={ml.health_score.breakdown.nutrition} max={15} color="var(--orange)" />
              <MLBar label="BMI"       value={ml.health_score.breakdown.bmi}       max={10} color="var(--blue)" />
            </div>
          </div>
        )}
      </div>

      {/* ML Predictions */}
      <div className="glass fade-up delay-2" style={{ padding: 20, borderTop: '2px solid var(--blue)' }}>
        <SectionTitle icon="🔮" color="var(--blue)">ML · Step Predictions</SectionTitle>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : ml?.predictions && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 10, padding: '9px 14px' }}>
              <span style={{ fontSize: 18 }}>
                {ml.predictions.trend === 'increasing' ? '📈' : ml.predictions.trend === 'decreasing' ? '📉' : '➡️'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--blue)', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700 }}>
                  Trend: {ml.predictions.trend.toUpperCase()}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 1 }}>
                  Slope: {ml.predictions.slope > 0 ? '+' : ''}{ml.predictions.slope} steps/day · R² = {ml.predictions.r2}
                </div>
              </div>
              <Badge color={ml.predictions.r2 > 0.7 ? 'var(--green)' : ml.predictions.r2 > 0.4 ? 'var(--orange)' : 'var(--muted)'}>
                {ml.predictions.r2 > 0.7 ? 'High' : ml.predictions.r2 > 0.4 ? 'Medium' : 'Low'} Confidence
              </Badge>
            </div>

            {/* Prediction cards — horizontal scroll on mobile */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
              {ml.predictions.predictions.map((steps, i) => {
                const labels = ['Tomorrow', 'Day After', 'Day +3']
                const pct    = Math.min(100, Math.round((steps / (goals.steps || 10000)) * 100))
                const color  = steps >= (goals.steps || 10000) ? 'var(--green)' : steps >= (goals.steps || 10000) * 0.7 ? 'var(--orange)' : '#ef4444'
                return (
                  <div key={i} style={{ background: `${color}08`, border: `1px solid ${color}28`, borderRadius: 12, padding: '14px 12px', textAlign: 'center', minWidth: 130, flexShrink: 0 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 9, fontFamily: 'var(--font-head)', letterSpacing: 1, marginBottom: 6 }}>{labels[i].toUpperCase()}</div>
                    <div style={{ color, fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 900 }}>{steps.toLocaleString()}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 9, marginTop: 3 }}>steps</div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 999, margin: '8px 0 5px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
                    </div>
                    <Badge color={color}>{pct}%</Badge>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Anomaly Detection */}
      <div className="glass fade-up delay-2" style={{ padding: 20, borderTop: '2px solid var(--pink)' }}>
        <SectionTitle icon="🔍" color="var(--pink)">ML · Anomaly Detection</SectionTitle>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : ml?.anomalies && (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginBottom: 12, overflow: 'hidden' }}>
              {weekSteps.map((v, i) => {
                const anom    = ml.anomalies[i] || {}
                const max     = Math.max(...weekSteps, 1)
                const h       = Math.max(3, Math.min(60, (v / max) * 60))
                const isToday = i === 6
                const color   = anom.is_anomaly ? 'var(--pink)' : isToday ? 'var(--teal)' : 'rgba(0,255,231,0.35)'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      {anom.is_anomaly && <div style={{ position: 'absolute', bottom: '100%', fontSize: 11 }}>{anom.direction === 'high' ? '⬆️' : '⬇️'}</div>}
                      {isToday && !anom.is_anomaly && <div style={{ position: 'absolute', bottom: '100%', color: 'var(--teal)', fontSize: 8, fontFamily: 'var(--font-head)' }}>NOW</div>}
                      <div style={{ width: '80%', height: `${h}px`, borderRadius: '3px 3px 0 0', background: color, transition: 'height 0.7s' }} />
                    </div>
                    <span style={{ color: anom.is_anomaly ? 'var(--pink)' : isToday ? 'var(--teal)' : 'var(--muted)', fontSize: 8, fontFamily: 'var(--font-head)', fontWeight: anom.is_anomaly || isToday ? 700 : 400 }}>
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                )
              })}
            </div>

            {ml.anomalies.some(a => a.is_anomaly) ? (
              <div style={{ background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.3)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10 }}>
                <span>⚠️</span>
                <div>
                  <div style={{ color: 'var(--pink)', fontFamily: 'var(--font-head)', fontSize: 11, marginBottom: 3 }}>ANOMALIES DETECTED</div>
                  <div style={{ color: 'var(--muted2)', fontSize: 11 }}>
                    Unusual patterns on: {ml.anomalies.map((a, i) => a.is_anomaly ? DAY_LABELS[i] : null).filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(34,211,165,0.08)', border: '1px solid rgba(34,211,165,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span>✅</span>
                <span style={{ color: 'var(--green)', fontSize: 12 }}>No anomalies detected this week</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recommendations */}
      <div className="glass fade-up delay-3" style={{ padding: 20, borderTop: '2px solid var(--teal)' }}>
        <SectionTitle icon="💡" color="var(--teal)">ML · Recommendations</SectionTitle>

        {mlLoading ? <MLSkeleton /> : mlError ? <MLError message={mlError} onRetry={mlRefresh} /> : (
          ml?.recommendations?.length === 0 ? (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 24, fontFamily: 'var(--font-head)', fontSize: 11 }}>LOG MORE DATA FOR RECOMMENDATIONS</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(ml?.recommendations || []).map((rec, i) => (
                <div key={i} style={{ background: `${rec.color}08`, border: `1px solid ${rec.color}22`, borderRadius: 12, padding: '13px 15px', display: 'flex', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${rec.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{rec.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-head)', color: rec.color, fontSize: 11, fontWeight: 700 }}>{rec.title}</span>
                      <Badge color={{ high: '#ef4444', medium: '#fb923c', positive: '#22d3a5', low: '#6b7280' }[rec.priority] || 'var(--muted2)'}>{rec.priority.toUpperCase()}</Badge>
                    </div>
                    <div style={{ color: 'var(--muted2)', fontSize: 11, lineHeight: 1.5 }}>{rec.body}</div>
                    <div style={{ marginTop: 6, color: rec.color, fontSize: 11, fontWeight: 700 }}>→ {rec.action}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {[
          { icon: '🦶', label: 'Steps',    value: todaySteps.toLocaleString(), color: 'var(--teal)',   sub: `Goal: ${goals.steps?.toLocaleString()}`, delay: 0 },
          { icon: '🔥', label: 'Cal Out',  value: todayCals,  unit: 'kcal', color: 'var(--pink)',   delay: 0.06 },
          { icon: '🍽️', label: 'Cal In',  value: todayCalIn, unit: 'kcal', color: 'var(--blue)',   delay: 0.12 },
          { icon: '💧', label: 'Water',    value: waterToday, unit: 'L',    color: 'var(--green)',  sub: `Goal: ${goals.water}L`, delay: 0.18 },
          { icon: '🏃', label: 'Exercise', value: todayExerc, unit: 'min',  color: 'var(--orange)', delay: 0.24 },
          { icon: '😴', label: 'Sleep',    value: todaySleep?.duration || 0, unit: 'hrs', color: 'var(--violet)', delay: 0.30 },
        ].map(p => <StatCard key={p.label} {...p} />)}
      </div>

      {/* Water Quick Log */}
      <div className="glass fade-up" style={{ padding: 18 }}>
        <SectionTitle icon="💧" color="var(--green)">Quick Water Log</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {[0.25, 0.5, 1, 1.5].map(v => (
            <Btn key={v} color="var(--green)" variant="outline" onClick={() => { addWater(v); showToast(`+${v}L added!`) }}>+{v}L</Btn>
          ))}
          <span style={{ color: 'var(--green)', fontWeight: 900, fontSize: 20, fontFamily: 'var(--font-head)' }}>{waterToday}L</span>
          <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, minWidth: 80 }}>
            <div style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,var(--green),var(--teal))', width: `${Math.min(waterToday / (goals.water || 8) * 100, 100)}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      </div>

      {/* Weekly Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 }}>
        {[
          { data: weekSteps, label: 'Weekly Steps',       color: 'var(--teal)' },
          { data: weekSleep, label: 'Weekly Sleep (hrs)', color: 'var(--violet)' },
          { data: weekCals,  label: 'Weekly Cal Burned',  color: 'var(--pink)' },
          { data: weekWater, label: 'Weekly Water (L)',   color: 'var(--green)' },
        ].map((w, i) => (
          <div key={w.label} className="glass fade-up" style={{ padding: 16, animationDelay: `${0.05 + i * 0.07}s` }}>
            <WeekBar data={w.data} label={w.label} color={w.color} />
          </div>
        ))}
      </div>

    </div>
  )
}
