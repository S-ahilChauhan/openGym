// frontend/src/views/Login.jsx
import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { hasData } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { DEMO, REPO } from '../lib/demo.js'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import Auth from '../components/Auth.jsx'
import { WARRIOR_CARDS, pickRandomCard } from '../lib/warriorCards.js'

export default function Login() {
  const { setUser, pushState, pullState, setGuest } = useStore()

  // Mechanism A: pick one card at random when the screen mounts.
  const [card] = useState(() => pickRandomCard())
  const isImageCard = card.kind === 'image'

  // Preload every image card up front so switching feels instant.
  useEffect(() => {
    WARRIOR_CARDS.forEach((c) => {
      if (c.kind === 'image') {
        const img = new Image()
        img.src = c.src
      }
    })
  }, [])

  const onAuth = async (u) => {
    setUser(u)
    if (hasData(useStore.getState().S)) {
      await pushState()
      useUI.getState().toast(t('Profile created — data from this device moved into it'))
    } else {
      await pullState()
      useUI.getState().toast(t('Welcome back, {0}', u.email))
    }
  }

  // Demo build: no backend to sign in against — only the local guest profile.
  if (DEMO) {
    return (
      <div className="narrow" style={demoWrap}>
        <div style={{ fontSize: 54, display: 'flex', justifyContent: 'center', color: 'var(--acc)' }}>
          <Icon name="dumbbell" />
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.028em', margin: '10px 0 4px' }}>openGym</h1>
        <div className="muted" style={{ marginBottom: 30 }}>{t('Live demo — everything stays in this browser.')}</div>
        <Button variant="primary" icon="sparkles" onClick={() => setGuest(true)}>{t('Start the demo')}</Button>
        <div className="card small muted" style={{ textAlign: 'left', marginTop: 16 }}>
          {t('This demo runs entirely in your browser on example data — nothing is sent anywhere. Passkey sign-in and sync across your devices come with the openGym server, which you get by self-hosting it.')}
        </div>
        <div className="dim small" style={{ marginTop: 22, lineHeight: 1.6 }}>
          <a href={REPO} target="_blank" rel="noopener">{t('Self-host it in a minute →')}</a>
        </div>
      </div>
    )
  }

  // Auth.jsx now owns the entire screen (background image, overlay, bottom sheet).
  // Login.jsx's only job is deciding which warrior card to hand it.
  return (
    <Auth
      onLoginSuccess={onAuth}
      bgImage={isImageCard ? card.src : undefined}
      accent={card.accent}
      badge={isImageCard ? `⚔ WARRIOR PATH · ${card.title}` : undefined}
      mantra={card.mantra}
      onGuest={() => setGuest(true)}
      guestLabel={t('Continue without account')}
    />
  )
}

const demoWrap = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '78vh',
  textAlign: 'center',
}