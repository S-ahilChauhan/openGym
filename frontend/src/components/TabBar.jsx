// frontend/src/components/TabBar.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { effectiveRoutine } from '../lib/history.js'
import { todayISO } from '../lib/format.js'
import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

export default function TabBar({ onStart }) {
  const nav = useNavigate()
  const loc = useLocation()
  const S = useStore(s => s.S)
  const user = useStore(s => s.user)
  const isGuest = useStore(s => s.isGuest())
  if (!user && !isGuest) return null

  const cur = loc.pathname.split('/')[1] || 'home'
  const on = k => cur === k || (cur === 'history' && k === 'stats') || (cur === 'settings' && k === 'profile')

  const startWorkout = () => {
    if (!S.active) {
      const r = effectiveRoutine(S, todayISO())
      if (r && r.ex.length) { onStart(r.id); return }
    }
    nav('/workout')
  }

  return (
    <nav id="tabbar">
      <button className={on('home') ? 'on' : ''} onClick={() => nav('/home')}>
        <Icon name="house" /><span>{t('Home')}</span>
      </button>

      <button className={on('plan') ? 'on' : ''} onClick={() => nav('/plan')}>
        <Icon name="calendar" /><span>{t('Plan')}</span>
      </button>

      <button className={'start' + (S.active ? ' rec' : '')} onClick={startWorkout}>
        <span className="cir"><Icon name={S.active ? 'play' : 'dumbbell'} /></span>
        <span>{S.active ? t('Resume') : t('Start')}</span>
      </button>

      <button className={on('stats') ? 'on' : ''} onClick={() => nav('/stats')}>
        <Icon name="chart" /><span>{t('Stats')}</span>
      </button>

      {/* Direct, crash-proof Profile Tab Button */}
      <button className={on('profile') ? 'on' : ''} onClick={() => nav('/profile')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>{t('Profile') || 'Profile'}</span>
      </button>
    </nav>
  )
}