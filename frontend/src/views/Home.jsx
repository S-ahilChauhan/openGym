// frontend/src/views/Home.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, DEF } from '../store/useStore.js'
import { effectiveRoutine, effectiveRoutineId, lastBW } from '../lib/history.js'
import { fmtNum, fmtDate, todayISO, isoOf, DAYS } from '../lib/format.js'
import { t as defaultT, dateLocale } from '../lib/i18n.js'
import { getStreakRank, calculateStreakDays } from '../utils/ranks.js'
import { bwSheet, goalSheet, dayOverrideSheet, calendarSheet, startFlow, loadStarterPlan, bwDeltaColor } from '../sheets.jsx'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import MacroFuelGrid from '../components/MacroFuelGrid.jsx'
import WarriorAvatar3D from '../components/WarriorAvatar3D.jsx'

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
    dayPlan: (state || storedState)?.dayPlan || {},
    diet: (state || storedState)?.diet || DEF.diet,
    profile: (state || storedState)?.profile || DEF.profile,
    bioScan: (state || storedState)?.bioScan || DEF.bioScan
  }
  const user = useStore(s => s.user)
  const t = typeof propT === 'function' ? propT : defaultT

  const localProfile = JSON.parse(localStorage.getItem('openGym_profile') || '{}')
  const greetingName =
    S?.profile?.name ||
    user?.user_metadata?.full_name ||
    localProfile?.name ||
    user?.name ||
    (user?.email ? user.email.split('@')[0] : 'Warrior')

  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const todayDateISO = todayISO()
  const routine = effectiveRoutine(S, todayDateISO)
  const isRestDay = !routine && !S.active
  
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
      <div key={i} className={'wday' + (iso === todayDateISO ? ' today' : '')} onClick={() => dayOverrideSheet(iso)}>
        <div className="lbl">{t(DAYS[d.getDay()])}</div>
        <div className="num">{d.getDate()}</div>
        <div className={'dot' + dot} />
      </div>
    )
  }

  const bwPoints = S.bodyweight.slice(-30).map(b => ({ t: b.t || new Date(b.d).getTime(), y: b.w, d: b.d }))

  const onToday = () => {
    if (S.active) nav('/workout')
    else if (routine) startFlow(routine.id)
    else dayOverrideSheet(todayDateISO)
  }

  return (
    <div className="narrow" style={hudStyles.container}>
      {/* 1. Header with Level & Direct Profile Badge */}
      <div className="hdr" style={hudStyles.header}>
        <div style={{ textAlign: 'left', margin: 0, padding: 0 }}>
          <div style={{ ...hudStyles.dateLabel, color: rank.badgeColor }}>
            {today.toLocaleDateString(dateLocale(), { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </div>
          <h1 style={{ ...hudStyles.title, textAlign: 'left', margin: '0.15rem 0 0.35rem' }}>
            Hi {greetingName}
          </h1>

          {/* LEVEL BADGE + GO TO PROFILE ACTION ROW */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

            {/* Profile Navigation Pill */}
            <button
              type="button"
              onClick={() => nav('/profile')}
              style={{
                ...hudStyles.profileLinkBtn,
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <Icon name="user" style={{ fontSize: '0.75rem', color: rank.badgeColor }} />
              <span>Profile ➔</span>
            </button>
          </div>
        </div>

        {/* Streak Button */}
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

      {/* 2. Hero Streak Card */}
      <div style={hudStyles.streakHeroCard} onClick={() => calendarSheet()}>
        <div
          style={{
            ...hudStyles.ambientGlow,
            background: isZeroStreak ? 'rgba(255, 255, 255, 0.04)' : rank.glowColor
          }}
        />

        <div style={hudStyles.streakHeroContent}>
          <div style={hudStyles.ringWrapper}>
            <svg viewBox="0 0 44 44" style={hudStyles.svgRing}>
              <circle cx="22" cy="22" r="17" fill="rgba(255, 255, 255, 0.03)" />
              <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="2.8" />
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

      {/* 3. Weekly Discipline Card */}
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

      {/* 4. 3D Biometric Avatar Card */}
      <WarriorAvatar3D
        profile={S.profile}
        bioScan={S.bioScan}
        accent={rank.badgeColor || '#34D399'}
      />

      {!S.routines.length && !S.active && (
        <div className="card" style={hudStyles.card}>
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

      {/* 5. Today's Blade */}
      <div style={{ ...hudStyles.heroCard, borderColor: `${rank.badgeColor}40` }}>
        <div className="row between" style={hudStyles.heroTop}>
          <span style={{ ...hudStyles.todayTag, color: rank.badgeColor }}>{t("TODAY'S BLADE")}</span>
          <span style={{ ...hudStyles.timeTag, color: isRestDay ? '#888' : rank.badgeColor, fontWeight: 700 }}>
            {S.active ? t('IN PROGRESS') : routine ? `${routine.exercises?.length || 0} ${t('EXERCISES')}` : t('REST PROTOCOL')}
          </span>
        </div>

        <h2 style={hudStyles.heroTitle}>
          {S.active ? t('Active Workout') : routine ? routine.name.toUpperCase() : t('Rest & Recovery')}
        </h2>

        <p style={hudStyles.heroDesc}>
          {S.active
            ? t('You have an active workout in progress.')
            : routine
            ? t('{0} exercises scheduled for today', routine.exercises?.length || 0)
            : t('"A blade is forged in fire, but tempered in stillness."')}
        </p>

        {!isRestDay && (
          <Button
            variant="primary"
            icon={S.active ? 'play' : 'zap'}
            onClick={onToday}
            style={{ ...hudStyles.unleashBtn, backgroundColor: rank.badgeColor, color: '#000' }}
          >
            {S.active ? t('Resume workout ⚔️') : t('Begin session ⚔️')}
          </Button>
        )}
      </div>

      {/* 6. Daily Macro Grid (Tap jumps straight to /diet) */}
      <div style={{ marginBottom: '1.2rem' }}>
        <MacroFuelGrid
          dietData={S.diet}
          dateKey={todayDateISO}
          onOpenDiet={() => nav('/diet')}
        />
      </div>

      {/* 7. Body Weight Tracker */}
      <div className="card" style={hudStyles.card}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{t('Body weight')}</h2>
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
  backgroundColor: 'rgba(16, 16, 22, 0.65)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '22px',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
}

const hudStyles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    backgroundColor: 'transparent',
    color: '#fff',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    paddingBottom: '5rem'
  },
  header: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    margin: '0 0 1rem',
    padding: '1.6rem 1rem 0.2rem',
    boxSizing: 'border-box'
  },
  dateLabel: { fontSize: '0.68rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' },
  title: { fontSize: '1.8rem', fontWeight: '900', margin: '0.15rem 0 0.35rem', letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)' },
  rankBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid', borderRadius: '16px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: '800', backgroundColor: 'rgba(0,0,0,0.6)' },
  profileLinkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid',
    borderRadius: '16px',
    padding: '0.2rem 0.65rem',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
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
  },
  streakNum: { fontSize: '0.95rem', fontWeight: '900', color: '#fff' },

  streakHeroCard: { position: 'relative', zIndex: 2, ...frostedCardStyle, padding: '1rem 1.25rem', marginBottom: '1rem', cursor: 'pointer', overflow: 'hidden' },
  ambientGlow: { position: 'absolute', top: '-30%', left: '10%', width: '110px', height: '110px', borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none', opacity: 0.45 },
  streakHeroContent: { display: 'flex', alignItems: 'center', gap: '1.15rem' },
  ringWrapper: { position: 'relative', width: '48px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  svgRing: { width: '100%', height: '100%' },
  ringCenter: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  streakTextCol: { display: 'flex', flexDirection: 'column' },
  rankEyebrow: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', letterSpacing: '1px', marginBottom: '1px' },
  streakNumberRow: { display: 'flex', alignItems: 'baseline', gap: '6px', lineHeight: 1.1 },
  streakNumHero: { fontSize: '1.65rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px' },
  unitTextHero: { fontSize: '0.78rem', fontWeight: '800', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' },
  subtextHero: { fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px', fontWeight: '600' },

  card: { position: 'relative', zIndex: 2, ...frostedCardStyle, padding: '1.1rem', marginBottom: '1rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.8px' },
  cardTitle: { fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.8px', color: '#888' },
  highlightBadge: { fontSize: '0.7rem', fontWeight: '800', whiteSpace: 'nowrap' },
  weekRow: { display: 'flex', justifyContent: 'space-between', gap: '0.35rem' },
  dayBox: { flex: 1, minWidth: 0, textAlign: 'center' },

  heroCard: { position: 'relative', zIndex: 2, ...frostedCardStyle, border: '1px solid', padding: '1.25rem', marginBottom: '1rem' },
  heroTop: { display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.4rem' },
  todayTag: { fontSize: '0.68rem', fontWeight: '800', letterSpacing: '1px' },
  timeTag: { fontSize: '0.72rem' },
  heroTitle: { fontSize: '1.35rem', fontWeight: '900', margin: '0.2rem 0 0.35rem', color: '#fff' },
  heroDesc: { fontSize: '0.78rem', color: '#999', margin: 0, fontStyle: 'italic', lineHeight: '1.35rem' },
  unleashBtn: { width: '100%', marginTop: '1rem', fontWeight: '900', borderRadius: '14px' }
}