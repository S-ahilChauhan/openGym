// frontend/src/components/Nav.jsx
import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { t } from '../lib/i18n.js'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/plan', label: 'Plan', icon: 'calendar' },
  { path: '/workout', label: 'Start', icon: 'dumbbell', isCenter: true },
  { path: '/diet', label: 'Diet', icon: 'utensils' },
  { path: '/stats', label: 'Stats', icon: 'stats' },
]

export default function Nav() {
  const location = useLocation()
  const nav = useNavigate()
  const currentPath = location.pathname

  return (
    <nav style={styles.bar}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.path)

        if (item.isCenter) {
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => nav(item.path)}
              style={styles.centerBtn}
              aria-label={t(item.label)}
            >
              <div style={styles.centerDisc}>
                <Icon name={item.icon} style={{ fontSize: '1.45rem', color: '#000' }} />
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#34D399', marginTop: '3px' }}>
                {t(item.label)}
              </span>
            </button>
          )
        }

        return (
          <button
            key={item.path}
            type="button"
            onClick={() => nav(item.path)}
            style={{
              ...styles.navItem,
              color: isActive ? '#34D399' : '#777782',
            }}
          >
            <Icon name={item.icon} style={{ fontSize: '1.3rem' }} />
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: isActive ? '800' : '600',
                marginTop: '4px',
              }}
            >
              {t(item.label)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: 'rgba(10, 10, 14, 0.94)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 9000,
    padding: '0 0.5rem',
    boxSizing: 'border-box',
  },
  navItem: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flex: 1,
    padding: '6px 0',
    transition: 'color 0.2s ease',
  },
  centerBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flex: 1,
    position: 'relative',
    top: '-8px',
  },
  centerDisc: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: '#34D399',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 18px rgba(52, 211, 153, 0.45)',
  },
}