import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, DEF } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, streakWeeks, lastBW, setsDoneActive } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t as defaultT, dateLocale } from '../lib/i18n.js'
import { getStreakRank } from '../utils/ranks.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, loadStarterPlan, bwDeltaColor } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

export default function Home({ onNavigate, state, dispatch, t: propT, rankWeeks = null } = {}) {
  const routerNavigate = useNavigate()
  const nav = typeof onNavigate === 'function' ? path => onNavigate(path.replace(/^\//, '')) : routerNavigate
  const storedState = useStore(s => s.S)
  const S = {
    ...DEF,
    ...(storedState || {}),
    ...(state || {}),
    bodyweight: (state || storedState)?.bodyweight || [],
    routines: (state || storedState)?.routines || [],
    workouts: (state || storedState)?.workouts || [],
    week: (state || storedState)?.week || {},
    dayPlan: (state || storedState)?.dayPlan || {}
  }
  const user = useStore(s => s.user)
  const t = typeof propT === 'function' ? propT : defaultT
  const profile = user?.profile
  const greetingName = user?.user_metadata?.full_name || profile?.name || user?.email?.split('@')[0] || 'Sahil'
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const routine = effectiveRoutine(S, todayISO())
  const rank = getStreakRank(rankWeeks ?? streakWeeks(S))
  const bw = lastBW(S)
  const prevBW = S.bodyweight.length > 1 ? S.bodyweight[S.bodyweight.length - 2] : null
  const delta = bw && prevBW ? bw.w - prevBW.w : null

  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
  const doneDays = new Set(S.workouts.map(w => w.d))
  const strip = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const iso = isoOf(d)
    const eff = effectiveRoutineId(S, iso), ovr = S.dayPlan[iso] !== undefined, done = doneDays.has(iso)
    const dot = done ? ' done' : ovr && eff ? ' ovr' : eff ? ' plan' : ''
    strip.push(<div key={i} className={'wday' + (iso === todayISO() ? ' today' : '')} onClick={() => dayOverrideSheet(iso)}>
      <div className="lbl">{t(DAYS[d.getDay()])}</div><div className="num">{d.getDate()}</div><div className={'dot' + dot} /></div>)
  }
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0 ? t('This week') : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const wThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length
  const completedThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  const onToday = () => { if (S.active) nav('/workout'); else if (routine) startFlow(routine.id); else dayOverrideSheet(todayISO()) }

  return <div className="narrow" style={hudStyles.container}>
    <div className="hdr" style={hudStyles.header}>
      <div style={{ textAlign: 'left', margin: 0, padding: 0 }}>
        <div style={{ ...hudStyles.dateLabel, color: rank.badgeColor }}>{today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</div>
        <h1 style={{ ...hudStyles.title, textAlign: 'left', margin: '0.15rem 0 0.4rem' }}>{user ? `Hi ${greetingName}` : 'openGym'}</h1>
        <div style={{ ...hudStyles.rankBadge, color: rank.badgeColor, borderColor: rank.badgeColor, boxShadow: `0 0 10px ${rank.glowColor}` }}>⚔️ LVL {rank.level} · {rank.fullTitle}</div>
      </div>
      <button className="iconbtn" style={{ ...hudStyles.streakPill, borderColor: rank.badgeColor, boxShadow: `0 0 12px ${rank.glowColor}`, marginLeft: 'auto' }} onClick={() => calendarSheet()} aria-label={t('View streak')}><span style={{ ...hudStyles.fireIcon, fontSize: '0.95rem' }}>🔥</span><span style={hudStyles.streakNum}>{rankWeeks ?? streakWeeks(S)}</span><span style={hudStyles.streakLabel}>{t('weeks')}</span></button>
    </div>

    <div className="card" style={hudStyles.card}>
      <div className="row between" style={{ ...hudStyles.sectionHeader, marginBottom: 12 }}>
        <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week"><Icon name="chevronLeft" /></button>
        <div style={hudStyles.cardTitle}>{t("THIS WEEK'S DISCIPLINE")}</div>
        <div style={{ ...hudStyles.highlightBadge, color: rank.badgeColor }}>{rank.nextTarget}</div>
        <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week"><Icon name="chevronRight" /></button>
      </div>
      <div className="week" style={hudStyles.weekRow}>{strip.map((day, i) => <div key={i} style={hudStyles.dayBox}>{day}</div>)}</div>
    </div>

    {!S.routines.length && !S.active && (
      <div className="card">
        <div className="row" style={{ gap: 10, marginBottom: 6 }}>
          <span className="lrow-i"><Icon name="sparkles" /></span>
          <div className="big" style={{ fontSize: 22 }}>{t('Welcome!')}</div>
        </div>
        <div className="muted small" style={{ marginBottom: 12 }}>{t('Set up your weekly routine to get going — or load a ready-made Push / Pull / Legs plan.')}</div>
        <Button variant="primary" icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (PPL)')}</Button>
        <div style={{ height: 8 }} /><Button onClick={() => nav('/plan')}>{t('Build my own plan')}</Button>
      </div>
    )}

    <div className="card" style={hudStyles.heroCard}>
      <div className="row between" style={hudStyles.heroTop}>
        <span style={{ ...hudStyles.todayTag, color: rank.badgeColor }}>{t("TODAY'S BLADE")}</span>
        <span style={hudStyles.timeTag}>{routine ? `${routine.exercises?.length || 0} ${t('EXERCISES')}` : t('REST DAY')}</span>
      </div>
      <h2 style={hudStyles.heroTitle}>{routine ? routine.name.toUpperCase() : t('REST DAY')}</h2>
      <p style={hudStyles.heroDesc}>{routine ? t('{0} exercises scheduled for today', routine.exercises?.length || 0) : t('Recover today. Return stronger tomorrow.')}</p>
      <Button variant="primary" icon="play" onClick={onToday} style={{ ...hudStyles.unleashBtn, backgroundColor: rank.badgeColor }}>{S.active ? t('Resume workout') : routine ? t('Begin session') : t('Plan today')}</Button>
    </div>

    <div style={hudStyles.grid}>
      <div className="card" style={hudStyles.statCard} onClick={() => bwSheet()}>
        <div style={hudStyles.statLabel}>{t('Body weight')}</div>
        <div style={hudStyles.statVal}>{bw ? `${fmtNum(bw.w)} ` : '—'}{bw && <span style={hudStyles.unit}>{S.unit}</span>}</div>
        <div style={hudStyles.statAction}>+ {t('Log entry')}</div>
      </div>
    </div>

    <div className="card">
      <div className="row between" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{t('Body weight')}</h2>
        <div className="row" style={{ gap: 8 }}>
          <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--yellow)' } : undefined} onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) : t('Goal')}</Button>
          <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
        </div>
      </div>
      {bw ? <>
        <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
          <div className="big">{fmtNum(bw.w)} <span className="muted" style={{ fontSize: '1rem' }}>{S.unit}</span></div>
          {/* only when it actually moved — an unchanged weight used to read as "− 0" */}
          {!!delta && (
            <span className="small row" style={{ gap: 2, fontWeight: 500, color: bwDeltaColor(delta, bw.w) }}>
              <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} style={{ fontSize: 12 }} />
              {fmtNum(Math.abs(delta))}
            </span>
          )}
          <span className="dim small" style={{ marginLeft: 'auto' }}>{fmtDate(bw.d, true)}</span>
        </div>
        {S.targetW && (
          <div className="small row" style={{ color: 'var(--yellow)', marginTop: 4, gap: 5 }}>
            <Icon name="target" style={{ fontSize: 13 }} />
            <span>{t('Goal')} {fmtNum(S.targetW)} {S.unit} · {Math.abs(S.targetW - bw.w) < 0.05 ? t('reached!') : t(S.targetW > bw.w ? '{0} to gain' : '{0} to lose', fmtNum(Math.abs(S.targetW - bw.w)) + ' ' + S.unit)}</span>
          </div>
        )}
        <div className="chart" style={{ marginTop: 8 }}><LineChart points={bwPoints} h={130} unit={S.unit} goal={S.targetW} /></div>
      </> : <div className="muted small">{t("No entries yet — log your weight to start the curve. It's also asked before every workout.")}</div>}
    </div>

    <div className="card tappable" style={{ cursor: 'pointer' }} onClick={() => calendarSheet()}>
      <div className="row between">
        <div>
          <div className="row" style={{ gap: 7, fontSize: 22, fontWeight: 600, letterSpacing: '-.021em' }}>
            <Icon name="flame" style={{ color: 'var(--orange)' }} />
            {t('{0} week streak', streakWeeks(S))}
          </div>
          <div className="muted small" style={{ marginTop: 2 }}>{wThisWeek}{plannedPerWeek ? ' / ' + plannedPerWeek : ''} {t('this week')} · {t(S.workouts.length === 1 ? '{0} workout total' : '{0} workouts total', S.workouts.length)}</div>
        </div>
        <Icon name="calendar" className="chev" style={{ fontSize: 20 }} />
      </div>
    </div>

  </div>
}

const frostedCardStyle = {
  backgroundColor: 'rgba(18, 18, 22, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '20px',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
}

const hudStyles = {
  container: {
    minHeight: '100vh', width: '100%', position: 'relative', backgroundColor: 'transparent',
    color: '#fff', boxSizing: 'border-box', overflowX: 'hidden'
  },
  bgOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8, 8, 10, 0.25) 0%, rgba(10, 10, 14, 0.45) 50%, rgba(10, 10, 14, 0.75) 100%)', zIndex: 1 },
  header: { position: 'relative', zIndex: 2, width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '0 0 1.6rem', padding: '2rem 1rem 0.5rem', boxSizing: 'border-box' },
  dateLabel: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1px', color: '#ff85a2', textTransform: 'uppercase' },
  title: { fontSize: '1.8rem', fontWeight: '800', margin: '0.15rem 0 0.4rem', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)' },
  rankBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid', borderRadius: '16px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)' },
  streakPill: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(20, 20, 24, 0.85)', border: '1.5px solid rgba(255, 133, 162, 0.45)', boxShadow: '0 4px 16px rgba(255, 133, 162, 0.25)', borderRadius: '40px', padding: '0.45rem 0.95rem', cursor: 'pointer' },
  fireIcon: { fontSize: '1rem' },
  streakNum: { fontSize: '1.05rem', fontWeight: '800', color: '#fff' },
  card: { position: 'relative', zIndex: 2, ...frostedCardStyle, borderRadius: '22px', padding: '1.1rem', marginBottom: '1.2rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px' },
  cardTitle: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px', color: '#aaa' },
  highlightBadge: { fontSize: '0.7rem', fontWeight: '700', color: '#ff85a2', whiteSpace: 'nowrap' },
  weekRow: { display: 'flex', justifyContent: 'space-between', gap: '0.35rem' },
  dayBox: { flex: 1, minWidth: 0, textAlign: 'center' },
  heroCard: { backgroundColor: 'rgba(22, 22, 28, 0.85)', border: '1px solid rgba(255, 133, 162, 0.35)', borderRadius: '24px', padding: '1.35rem', marginBottom: '1.2rem', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)' },
  heroTop: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' },
  todayTag: { fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px', color: '#ff85a2' },
  timeTag: { fontSize: '0.75rem', color: '#aaa' },
  heroTitle: { fontSize: '1.35rem', fontWeight: '800', margin: '0.2rem 0 0.4rem' },
  heroDesc: { fontSize: '0.8rem', color: '#999', margin: '0 0 1.2rem', lineHeight: '1.25rem' },
  unleashBtn: { width: '100%', backgroundColor: '#ff85a2', color: '#0e0e12', boxShadow: '0 4px 18px rgba(255, 133, 162, 0.35)' },
  grid: { position: 'relative', zIndex: 2, display: 'flex', gap: '0.85rem' },
  statCard: { flex: 1, backgroundColor: 'rgba(18, 18, 22, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '1.1rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' },
  statVal: { fontSize: '1.35rem', fontWeight: '800', margin: '0.45rem 0 0.2rem' },
  statLabel: { fontSize: '0.72rem', color: '#888', fontWeight: '600' },
  statSub: { fontSize: '0.75rem', color: '#888' },
  statAction: { fontSize: '0.75rem', color: '#ff85a2', fontWeight: '600' },
  unit: { fontSize: '0.85rem', color: '#aaa', fontWeight: '500' },
}
