import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import { useUI } from './store/useUI.js'
import { bindUI } from './components/ui.jsx'
import { ACCENTS } from './lib/format.js'
import { setLang, useLang } from './lib/i18n.js'
import { setNav } from './lib/nav.js'
import { useWakeLock } from './lib/wakelock.js'
import { startFlow } from './sheets.jsx'
import Icon from './components/Icon.jsx'
import TabBar from './components/TabBar.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Modals from './components/Modals.jsx'
import Toast from './components/Toast.jsx'
import RestTimer from './components/RestTimer.jsx'
import Login from './views/Login.jsx'
import Home from './views/Home.jsx'
import Plan from './views/Plan.jsx'
import RoutineEdit from './views/RoutineEdit.jsx'
import Workout from './views/Workout.jsx'
import Stats from './views/Stats.jsx'
import History from './views/History.jsx'
import Library from './views/Library.jsx'
import Profile from './views/Profile.jsx'
import Settings from './views/Settings.jsx'
import Admin from './views/Admin.jsx'
import { ALL_RANK_IMAGES, getStreakRank } from './utils/ranks.js'
import { streakWeeks } from './lib/history.js'

bindUI(useUI)   // lets the shared controls open sheets without importing the store at module scope

function applyPrefs(theme, accent) {
  const de = document.documentElement
  de.dataset.theme = theme === 'light' ? 'light' : 'dark'
  de.dataset.accent = ACCENTS[accent] ? accent : 'lime'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = de.dataset.theme === 'light' ? '#f2f2f7' : '#000000'
}

function Shell({ devWeeks = null }) {
  const navigate = useNavigate()
  const loc = useLocation()
  const { S, user, ready } = useStore()
  const isGuest = useStore(s => s.isGuest())
  const langV = useLang()   // re-renders the whole shell when the language (pack) changes
  useEffect(() => { setNav(navigate) }, [navigate])
  useEffect(() => { applyPrefs(S.theme, S.accent) }, [S.theme, S.accent])
  useEffect(() => { setLang(S.lang || 'en') }, [S.lang])
  useEffect(() => { document.documentElement.lang = S.lang || 'en' }, [langV, S.lang])
  // every tab/route change starts at the top of the page
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  // bound to the workout, not to the route — checking Stats mid-session keeps the screen on
  useWakeLock(!!S.active && S.keepAwake !== false)

  const authed = user || isGuest
  if (!ready && !authed) return (
    <div id="app">
      <div style={{ paddingTop: '44vh', display: 'flex', justifyContent: 'center', fontSize: 34, color: 'var(--label-3)' }}>
        <Icon name="dumbbell" />
      </div>
    </div>
  )

  return (
    <>
      {/* keyed on the route: a view that throws is contained, and switching tabs
          re-mounts the boundary, so the tab bar is always a way out */}
      <div id="app" className="vfade" key={loc.pathname}>
        <ErrorBoundary>
          {!authed ? <Login /> : (
            <Routes>
              <Route path="/home" element={<Home rankWeeks={devWeeks} />} />
              <Route path="/plan" element={<Plan rankWeeks={devWeeks} />} />
              <Route path="/plan/r/:id" element={<RoutineEdit />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/stats" element={<Stats rankWeeks={devWeeks} />} />
              <Route path="/history" element={<History />} />
              <Route path="/library" element={<Library rankWeeks={devWeeks} />} />
              <Route path="/profile" element={<Profile rankWeeks={devWeeks} />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={user?.admin ? <Admin /> : <Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          )}
        </ErrorBoundary>
      </div>
      <TabBar onStart={startFlow} />
      <RestTimer />
      <Modals />
      <Toast />
    </>
  )
}

export default function App() {
  const boot = useStore(s => s.boot)
  const state = useStore(s => s.S)
  const [devWeeks, setDevWeeks] = useState(null)
  const activeWeeks = devWeeks !== null ? devWeeks : streakWeeks(state)
  const currentRank = getStreakRank(activeWeeks)

  useEffect(() => {
    ALL_RANK_IMAGES.forEach(src => {
      const img = new Image()
      img.src = src
    })
    boot()
  }, [boot])

  return (
    <div
      id="app-root-layout"
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        backgroundImage: `url('${currentRank.image}')`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#0a0a0c',
        color: '#ffffff',
        transition: 'background-image 0.4s ease-in-out',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(8, 8, 10, 0.35) 0%, rgba(10, 10, 14, 0.55) 50%, rgba(10, 10, 14, 0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <HashRouter>
          <Shell devWeeks={devWeeks} />
        </HashRouter>
      </div>
      <div style={devStyles.devBar}>
        <div style={devStyles.devHeader}>
          <span style={devStyles.devLabel}>GLOBAL DEV PREVIEW:</span>
          {devWeeks !== null && (
            <button onClick={() => setDevWeeks(null)} style={devStyles.resetBtn}>
              Reset to Real
            </button>
          )}
        </div>
        <div style={devStyles.devPillGroup}>
          {[
            { lvl: 1, weeks: 0, label: 'L1: Novice' },
            { lvl: 2, weeks: 2, label: 'L2: Ronin' },
            { lvl: 3, weeks: 5, label: 'L3: Shadow' },
            { lvl: 4, weeks: 9, label: 'L4: Demon' },
            { lvl: 5, weeks: 16, label: 'L5: Shogun' },
            { lvl: 6, weeks: 26, label: 'L6: Ogre' },
          ].map(item => {
            const selected = currentRank.level === item.lvl
            return (
              <button
                key={item.lvl}
                onClick={() => setDevWeeks(item.weeks)}
                style={{
                  ...devStyles.devBtn,
                  backgroundColor: selected ? currentRank.badgeColor : 'rgba(255,255,255,0.1)',
                  color: selected ? '#000' : '#fff',
                  fontWeight: selected ? 800 : 500,
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const devStyles = {
  devBar: {
    position: 'fixed',
    bottom: '4.8rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    width: '92%',
    maxWidth: '430px',
    backgroundColor: 'rgba(15, 15, 20, 0.92)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '18px',
    padding: '0.6rem 0.8rem',
    boxSizing: 'border-box',
  },
  devHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
  },
  devLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    letterSpacing: '1px',
    color: '#888',
  },
  resetBtn: {
    background: 'none',
    border: 'none',
    color: '#FF85A2',
    fontSize: '0.65rem',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
  devPillGroup: {
    display: 'flex',
    gap: '0.35rem',
    overflowX: 'auto',
    paddingBottom: '2px',
  },
  devBtn: {
    border: 'none',
    borderRadius: '12px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.68rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
  },
}