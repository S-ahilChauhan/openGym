// frontend/src/components/Auth.jsx
import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Auth({
  onLoginSuccess,
  bgImage,
  accent = '#FBBF24',
  badge = 'WARRIOR PATH',
  title = 'THE SUN-BEARER',
  mantra = 'Who decided that? I decide.',
  onGuest,
  guestLabel = 'Continue without account'
}) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAuth = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user && data.session && onLoginSuccess) onLoginSuccess(data.user)
        else setErrorMsg('Account created. Check your email for confirmation.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        if (onLoginSuccess) onLoginSuccess(data.user)
      }
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Enter your email first.')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setErrorMsg(error ? error.message : 'Password reset link sent.')
  }

  return (
    <div
      style={{
        ...styles.container,
        backgroundImage: bgImage ? `url('${bgImage}')` : 'none',
        backgroundColor: bgImage ? undefined : '#070709',
      }}
    >
      {/* Background Dimmer & Contrast Shield */}
      <div style={styles.overlay} />

      {/* Top Header - Sits cleanly at the top with a dark halo for legibility */}
      <div style={styles.topHeader}>
        {badge && (
          <div style={{ ...styles.badgeText, color: accent }}>
            ⚔️ {badge}
          </div>
        )}
        <div style={styles.titleText}>{title}</div>
        {mantra && <div style={styles.mantraText}>"{mantra}"</div>}
      </div>

      {/* Bottom Auth Section */}
      <form onSubmit={handleAuth} style={styles.formSection}>
        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <div style={styles.inputsSection}>
          <div style={{ ...styles.inputPill, focusBorderColor: accent }}>
            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.inputPill, focusBorderColor: accent }}>
            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
        </div>

        {/* Bottom Drawer Actions */}
        <div style={styles.bottomCard}>
          {!isSignUp && (
            <button type="button" onClick={handleForgotPassword} style={styles.forgotBtn}>
              Forgot Password?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.loginBtn,
              backgroundColor: accent,
              color: '#000000',
              boxShadow: `0 4px 18px ${accent}44`
            }}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create an account ⚔️' : 'Login ⚔️'}
          </button>

          <div style={styles.divider}>or</div>

          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg('') }}
            style={styles.createAccountBtn}
          >
            {isSignUp ? 'Already have an account? Login' : 'Create an account'}
          </button>

          {onGuest && (
            <button type="button" onClick={onGuest} style={styles.guestLink}>
              {guestLabel}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100dvh',
    backgroundSize: 'cover',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    zIndex: 9999,
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box'
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 0.7) 70%, #000000 100%)',
    zIndex: 1,
    pointerEvents: 'none'
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '2.5rem 1.25rem 1rem',
    pointerEvents: 'none'
  },
  badgeText: {
    fontSize: '0.68rem',
    fontWeight: 800,
    letterSpacing: '1.6px',
    textTransform: 'uppercase',
    marginBottom: '4px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
  },
  titleText: {
    fontSize: '1.85rem',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    color: '#ffffff',
    margin: '2px 0',
    textShadow: '0 2px 14px rgba(0, 0, 0, 0.9)'
  },
  mantraText: {
    fontSize: '0.78rem',
    color: '#e0e0e0',
    fontStyle: 'italic',
    marginTop: '2px',
    maxWidth: '320px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)'
  },
  formSection: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    boxSizing: 'border-box'
  },
  inputsSection: {
    width: '100%',
    padding: '0 1.25rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    marginBottom: '0.9rem'
  },
  inputPill: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.65)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '32px',
    padding: '0.75rem 1.15rem',
    boxSizing: 'border-box'
  },
  icon: {
    width: '18px',
    height: '18px',
    color: '#a1a1aa',
    marginRight: '10px',
    flexShrink: 0
  },
  input: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '0.92rem',
    width: '100%',
    letterSpacing: '0.2px'
  },
  bottomCard: {
    width: '100%',
    backgroundColor: 'rgba(18, 18, 24, 0.92)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
    borderTopLeftRadius: '32px',
    borderTopRightRadius: '32px',
    padding: '1.2rem 1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
    boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.7)'
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '0.78rem',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    fontWeight: '500'
  },
  loginBtn: {
    width: '100%',
    padding: '0.85rem',
    border: 'none',
    borderRadius: '26px',
    fontSize: '0.95rem',
    fontWeight: '800',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'transform 0.1s ease'
  },
  divider: {
    margin: '0.5rem 0',
    color: '#555',
    fontSize: '0.75rem'
  },
  createAccountBtn: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '26px',
    fontSize: '0.92rem',
    fontWeight: '700',
    cursor: 'pointer'
  },
  guestLink: {
    background: 'none',
    border: 'none',
    color: '#777',
    fontSize: '0.78rem',
    fontWeight: 600,
    marginTop: '0.85rem',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  error: {
    color: '#ff4d4f',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    border: '1px solid rgba(255, 77, 79, 0.4)',
    padding: '0.35rem 0.85rem',
    borderRadius: '12px',
    marginBottom: '0.65rem',
    fontSize: '0.78rem',
    textAlign: 'center'
  }
}