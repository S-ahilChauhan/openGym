// frontend/src/views/Home.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, DEF } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, lastBW } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, weekKey, DAYS } from '../lib/format.js'
import { t as defaultT, dateLocale } from '../lib/i18n.js'
import { getStreakRank, calculateStreakDays } from '../utils/ranks.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, loadStarterPlan, bwDeltaColor } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'

export default function Home({ onNavigate, state, dispatch, t: propT, rankDays = null } = {}) {
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

  // Prioritize Warrior Call-Sign from Profile settings
  const localProfile = JSON.parse(localStorage.getItem('openGym_profile') || '{}')
  const greetingName =
    S?.profile?.name ||
    user?.user_metadata?.full_name ||
    localProfile?.name ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warrior')

  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const routine = effectiveRoutine(S, todayISO())
  
  // Calculate day-based streak and rank progression
  const streakDaysCount = rankDays ?? calculateStreakDays(S.workouts)
  const rank = getStreakRank(streakDaysCount)
  const isZeroStreak = streakDaysCount === 0

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
    strip.push(
      <div key={i} className={'wday' + (iso === todayISO() ? ' today' : '')} onClick={() => dayOverrideSheet(iso)}>
        <div className="lbl">{t(DAYS[d.getDay()])}</div>
        <div className="num">{d.getDate()}</div>
        <div className={'dot' + dot} />
      </div>
    )
  }
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const wkLabel = weekOffset === 0 ? t('This week') : `${monday.getDate()} ${monday.toLocaleDateString(dateLocale(), { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleDateString(dateLocale(), { month: 'short' })}`

  const wThisWeek = S.workouts.filter(w => weekKey(w.d) === weekKey(todayISO())).length
  const plannedPerWeek = Object.keys(S.week).filter(k => S.week[k]).length
  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayISO())
  }

  return (
    <div className="narrow" style={hudStyles.container}>
      {/* Top Header */}
      <div className="hdr" style={hudStyles.header}>
        <div style={{ textAlign: 'left', margin: 0, padding: 0 }}>
          <div style={{ ...hudStyles.dateLabel, color: rank.badgeColor }}>
            {today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          <h1 style={{ ...hudStyles.title, textAlign: 'left', margin: '0.15rem 0 0.4rem' }}>
            Hi {greetingName}
          </h1>
          <div
            style={{
              ...hudStyles.rankBadge,
              color: rank.badgeColor,
              borderColor: rank.badgeColor,
              boxShadow: `0 0 10px ${rank.glowColor}`
            }}
          >
            ⚔️ LVL {rank.level} · {rank.fullTitle}
          </div>
        </div>

        {/* Header Compact Streak Pill */}
        <button
          className="iconbtn"
          style={{
            ...hudStyles.streakPill,
            borderColor: isZeroStreak ? 'rgba(255,255,255,0.15)' : rank.badgeColor,
            boxShadow: isZeroStreak ? 'none' : `0 0 14px ${rank.glowColor}`,
            marginLeft: 'auto'
          }}
          onClick={() => calendarSheet()}
          aria-label={t('View streak')}
        >
          <span style={{ fontSize: '0.95rem', filter: isZeroStreak ? 'grayscale(1) opacity(0.5)' : 'none' }}>🔥</span>
          <span style={hudStyles.streakNum}>{streakDaysCount}</span>
          <span style={{ fontSize: '0.68rem', color: '#aaa', fontWeight: '700' }}>d</span>
        </button>
      </div>

      {/* Hero Streak Card */}
      <div style={hudStyles.streakHeroCard} onClick={() => calendarSheet()}>
        <div
          style={{
            ...hudStyles.ambientGlow,
            background: isZeroStreak ? 'rgba(255, 255, 255, 0.04)' : rank.glowColor
          }}
        />

        <div style={hudStyles.streakHeroContent}>
          {/* Circular Progress & Flame Disc */}
          <div style={hudStyles.ringWrapper}>
            <svg viewBox="0 0 44 44" style={hudStyles.svgRing}>
              {/* Inner subtle disc */}
              <circle
                cx="22"
                cy="22"
                r="17"
                fill="rgba(255, 255, 255, 0.03)"
              />
              {/* Background Track */}
              <circle
                cx="22"
                cy="22"
                r="17"
                fill="none"
                stroke="rgba(255, 255, 255, 0.09)"
                strokeWidth="2.8"
              />
              {/* Dynamic Progress Indicator */}
              <circle
                cx="22"
                cy="22"
                r="17"
                fill="none"
                stroke={isZeroStreak ? 'rgba(255, 255, 255, 0.18)' : rank.badgeColor}
                strokeWidth="2.8"
                strokeDasharray="106.8"
                strokeDashoffset={isZeroStreak ? '106.8' : Math.max(10, 106.8 - (streakDaysCount * 2.5))}
                strokeLinecap="round"
                style={{
                  filter: isZeroStreak ? 'none' : `drop-shadow(0 0 5px ${rank.badgeColor})`,
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                transform="rotate(-90 22 22)"
              />
            </svg>
            <div style={hudStyles.ringCenter}>
              <span style={{ fontSize: '1.15rem', filter: isZeroStreak ? 'grayscale(1) opacity(0.35)' : 'none' }}>
                🔥
              </span>
            </div>
          </div>

          {/* Text Details & Level Up Countdown */}
          <div style={hudStyles.streakTextCol}>
            <div style={hudStyles.rankEyebrow}>
              <span style={{ color: isZeroStreak ? '#888' : rank.badgeColor, fontWeight: '800' }}>
                {isZeroStreak ? 'IGNITE STREAK' : rank.fullTitle.toUpperCase()}
              </span>
            </div>

            <div style={hudStyles.streakNumberRow}>
              <span style={hudStyles.streakNumHero}>{streakDaysCount}</span>
              <span style={hudStyles.unitTextHero}>{streakDaysCount === 1 ? 'DAY' : 'DAYS'}</span>
            </div>

            <div style={hudStyles.subtextHero}>
              {rank.nextRankTitle ? (
                <span style={{ color: rank.badgeColor, fontWeight: '700' }}>
                  ⚡ {rank.daysToNext} {rank.daysToNext === 1 ? 'day' : 'days'} to level up ({rank.nextRankTitle})
                </span>
              ) : (
                <span style={{ color: rank.badgeColor, fontWeight: '700' }}>
                  👑 Apex Master ({rank.title})
                </span>
              )}
            </div>
          </div>

          <Icon name="chevronRight" style={{ marginLeft: 'auto', color: '#666', fontSize: 18 }} />
        </div>
      </div>

      {/* Weekly Discipline Card */}
      <div className="card" style={hudStyles.card}>
        <div className="row between" style={{ ...hudStyles.sectionHeader, marginBottom: 12 }}>
          <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week">
            <Icon name="chevronLeft" />
          </button>
          <div style={hudStyles.cardTitle}>{t("THIS WEEK'S DISCIPLINE")}</div>
          <div style={{ ...hudStyles.highlightBadge, color: rank.badgeColor }}>{rank.nextTarget}</div>
          <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week">
            <Icon name="chevronRight" />
          </button>
        </div>
        <div className="week" style={hudStyles.weekRow}>
          {strip.map((day, i) => (
            <div key={i} style={hudStyles.dayBox}>{day}</div>
          ))}
        </div>
      </div>

      {!S.routines.length && !S.active && (
        <div className="card">
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <span className="lrow-i"><Icon name="sparkles" /></span>
            <div className="big" style={{ fontSize: 22 }}>{t('Welcome!')}</div>
          </div>
          <div className="muted small" style={{ marginBottom: 12 }}>
            {t('Set up your weekly routine to get going — or load a ready-made Push / Pull / Legs plan.')}
          </div>
          <Button variant="primary" icon="sparkles" onClick={loadStarterPlan}>{t('Load starter plan (PPL)')}</Button>
          <div style={{ height: 8 }} />
          <Button onClick={() => nav('/plan')}>{t('Build my own plan')}</Button>
        </div>
      )}

      {/* Hero Blade Card */}
      <div className="card" style={hudStyles.heroCard}>
        <div className="row between" style={hudStyles.heroTop}>
          <span style={{ ...hudStyles.todayTag, color: rank.badgeColor }}>{t("TODAY'S BLADE")}</span>
          <span style={hudStyles.timeTag}>{routine ? `${routine.exercises?.length || 0} ${t('EXERCISES')}` : t('REST DAY')}</span>
        </div>
        <h2 style={hudStyles.heroTitle}>{routine ? routine.name.toUpperCase() : t('REST DAY')}</h2>
        <p style={hudStyles.heroDesc}>
          {routine ? t('{0} exercises scheduled for today', routine.exercises?.length || 0) : t('Recover today. Return stronger tomorrow.')}
        </p>
        <Button
          variant="primary"
          icon="play"
          onClick={onToday}
          style={{ ...hudStyles.unleashBtn, backgroundColor: rank.badgeColor }}
        >
          {S.active ? t('Resume workout') : routine ? t('Begin session') : t('Plan today')}
        </Button>
      </div>

      {/* Body Weight Stat */}
      <div style={hudStyles.grid}>
        <div className="card" style={hudStyles.statCard} onClick={() => bwSheet()}>
          <div style={hudStyles.statLabel}>{t('Body weight')}</div>
          <div style={hudStyles.statVal}>
            {bw ? `${fmtNum(bw.w)} ` : '—'}
            {bw && <span style={hudStyles.unit}>{S.unit}</span>}
          </div>
          <div style={{ ...hudStyles.statAction, color: rank.badgeColor }}>+ {t('Log entry')}</div>
        </div>
      </div>

      {/* Body Weight Chart Card */}
      <div className="card" style={hudStyles.card}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>{t('Body weight')}</h2>
          <div className="row" style={{ gap: 8 }}>
            <Button size="sm" icon="target" style={S.targetW ? { color: 'var(--yellow)' } : undefined} onClick={goalSheet}>
              {S.targetW ? fmtNum(S.targetW) : t('Goal')}
            </Button>
            <Button size="sm" icon="plus" onClick={() => bwSheet()}>{t('Log')}</Button>
          </div>
        </div>
        {bw ? (
          <>
            <div className="row" style={{ gap: 8, alignItems: 'baseline' }}>
              <div className="big">{fmtNum(bw.w)} <span className="muted" style={{ fontSize: '1rem' }}>{S.unit}</span></div>
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
                <span>
                  {t('Goal')} {fmtNum(S.targetW)} {S.unit} · {Math.abs(S.targetW - bw.w) < 0.05 ? t('reached!') : t(S.targetW > bw.w ? '{0} to gain' : '{0} to lose', fmtNum(Math.abs(S.targetW - bw.w)) + ' ' + S.unit)}
                </span>
              </div>
            )}
            <div className="chart" style={{ marginTop: 8 }}>
              <LineChart points={bwPoints} h={130} unit={S.unit} goal={S.targetW} />
            </div>
          </>
        ) : (
          <div className="muted small">{t("No entries yet — log your weight to start the curve. It's also asked before every workout.")}</div>
        )}
      </div>
    </div>
  )
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
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
    color: '#fff',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  header: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    margin: '0 0 1.2rem',
    padding: '1.8rem 1rem 0.4rem',
    boxSizing: 'border-box'
  },
  dateLabel: { fontSize: '0.72rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' },
  title: { fontSize: '1.8rem', fontWeight: '800', margin: '0.15rem 0 0.4rem', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)' },
  rankBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid', borderRadius: '16px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: '700', backgroundColor: 'rgba(0,0,0,0.6)' },
  streakPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(18, 18, 24, 0.85)',
    border: '1px solid',
    borderRadius: '40px',
    padding: '0.35rem 0.75rem',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)'
  },
  streakNum: { fontSize: '0.95rem', fontWeight: '900', color: '#fff' },

  // Hero Streak Card Styles
  streakHeroCard: {
    position: 'relative',
    zIndex: 2,
    ...frostedCardStyle,
    borderRadius: '22px',
    padding: '1rem 1.25rem',
    marginBottom: '1.2rem',
    cursor: 'pointer',
    overflow: 'hidden'
  },
  ambientGlow: {
    position: 'absolute',
    top: '-30%',
    left: '10%',
    width: '110px',
    height: '110px',
    borderRadius: '50%',
    filter: 'blur(40px)',
    pointerEvents: 'none',
    opacity: 0.45
  },
  streakHeroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.15rem'
  },
  ringWrapper: {
    position: 'relative',
    width: '48px',
    height: '48px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  svgRing: { width: '100%', height: '100%' },
  ringCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  streakTextCol: { display: 'flex', flexDirection: 'column' },
  rankEyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.66rem',
    letterSpacing: '1px',
    marginBottom: '1px'
  },
  streakNumberRow: { display: 'flex', alignItems: 'baseline', gap: '6px', lineHeight: 1.1 },
  streakNumHero: { fontSize: '1.65rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' },
  unitTextHero: { fontSize: '0.78rem', fontWeight: '800', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' },
  subtextHero: { fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '2px', fontWeight: '500' },

  card: { position: 'relative', zIndex: 2, ...frostedCardStyle, borderRadius: '22px', padding: '1.1rem', marginBottom: '1.2rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px' },
  cardTitle: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px', color: '#aaa' },
  highlightBadge: { fontSize: '0.7rem', fontWeight: '700', whiteSpace: 'nowrap' },
  weekRow: { display: 'flex', justifyContent: 'space-between', gap: '0.35rem' },
  dayBox: { flex: 1, minWidth: 0, textAlign: 'center' },
  heroCard: { backgroundColor: 'rgba(22, 22, 28, 0.85)', border: '1px solid rgba(255, 133, 162, 0.35)', borderRadius: '24px', padding: '1.35rem', marginBottom: '1.2rem', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)' },
  heroTop: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' },
  todayTag: { fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1px' },
  timeTag: { fontSize: '0.75rem', color: '#aaa' },
  heroTitle: { fontSize: '1.35rem', fontWeight: '800', margin: '0.2rem 0 0.4rem' },
  heroDesc: { fontSize: '0.8rem', color: '#999', margin: '0 0 1.2rem', lineHeight: '1.25rem' },
  unleashBtn: { width: '100%', color: '#0e0e12', fontWeight: '800' },
  grid: { position: 'relative', zIndex: 2, display: 'flex', gap: '0.85rem', marginBottom: '1.2rem' },
  statCard: { flex: 1, backgroundColor: 'rgba(18, 18, 22, 0.75)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '1.1rem', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' },
  statVal: { fontSize: '1.35rem', fontWeight: '800', margin: '0.45rem 0 0.2rem' },
  statLabel: { fontSize: '0.72rem', color: '#888', fontWeight: '600' },
  statAction: { fontSize: '0.75rem', fontWeight: '600', marginTop: '0.4rem' },
  unit: { fontSize: '0.85rem', color: '#aaa', fontWeight: '500' }
}