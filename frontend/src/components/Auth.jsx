import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Auth({ onLoginSuccess, bgImage, accent = '#7C8CF8', badge, mantra, onGuest, guestLabel = 'Continue without account' }) {
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
        else setErrorMsg('Account created. Check your email for a confirmation link.')
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
    setErrorMsg(error ? error.message : 'Password reset link sent to your email.')
  }

  return (
    <div
      style={{
        ...styles.container,
        backgroundImage: bgImage ? `url('${bgImage}')` : 'none',
        backgroundColor: bgImage ? undefined : '#0a0a0c',
      }}
    >
      <div style={styles.overlay} />

      {/* Optional top badge + mantra, sits above the bottom sheet, doesn't affect its layout */}
      {(badge || mantra) && (
        <div style={styles.topHeader}>
          {badge && (
            <div style={{ ...styles.badgeText, color: accent }}>{badge}</div>
          )}
          <div style={styles.title}>openGym</div>
          {mantra && <div style={styles.mantraText}>"{mantra}"</div>}
        </div>
      )}

      <form onSubmit={handleAuth} style={styles.formSection}>
        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <div style={styles.inputsSection}>
          <div style={styles.inputPill}>
            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
          </div>
          <div style={styles.inputPill}>
            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
          </div>
        </div>

        <div style={styles.bottomCard}>
          {!isSignUp && <button type="button" onClick={handleForgotPassword} style={styles.forgotBtn}>Forgot Password?</button>}
          <button type="submit" disabled={loading} style={{ ...styles.loginBtn, backgroundColor: '#262626' }}>
            {loading ? 'Processing...' : isSignUp ? 'Create an account' : 'Login'}
          </button>
          <div style={styles.divider}>or</div>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg('') }} style={styles.createAccountBtn}>
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
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100dvh',
    backgroundSize: 'cover', backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    zIndex: 9999, overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)', zIndex: 1 },
  topHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: '2.2rem 1.5rem 0',
  },
  badgeText: { fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '6px' },
  title: { fontSize: '1.7rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', margin: '2px 0' },
  mantraText: { fontSize: '0.78rem', color: '#ddd', fontStyle: 'italic', marginTop: '4px', maxWidth: '280px' },
  formSection: {
    position: 'relative', zIndex: 2, width: '100%', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column',
    justifyContent: 'flex-end', alignItems: 'center', boxSizing: 'border-box'
  },
  inputsSection: {
    width: '100%', padding: '0 1.5rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem'
  },
  inputPill: {
    display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255, 255, 255, 0.65)', borderRadius: '40px', padding: '0.85rem 1.25rem', boxSizing: 'border-box'
  },
  icon: { width: '18px', height: '18px', color: '#d1d1d1', marginRight: '12px', flexShrink: 0 },
  input: { background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.98rem', width: '100%', letterSpacing: '0.2px' },
  bottomCard: {
    width: '100%', backgroundColor: 'rgba(230, 230, 230, 0.92)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', borderTopLeftRadius: '36px',
    borderTopRightRadius: '36px', padding: '1.4rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)'
  },
  forgotBtn: { background: 'none', border: 'none', color: '#444', fontSize: '0.85rem', marginBottom: '1rem', cursor: 'pointer', fontWeight: '400' },
  loginBtn: { width: '100%', padding: '0.95rem', color: '#fff', border: 'none', borderRadius: '35px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)' },
  divider: { margin: '0.65rem 0', color: '#888', fontSize: '0.82rem' },
  createAccountBtn: { width: '100%', padding: '0.95rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#2a2a2a', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '35px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' },
  guestLink: { background: 'none', border: 'none', color: '#555', fontSize: '0.82rem', fontWeight: 600, marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' },
  error: { color: '#ff4d4f', backgroundColor: 'rgba(0, 0, 0, 0.65)', padding: '0.4rem 0.9rem', borderRadius: '16px', marginBottom: '0.75rem', fontSize: '0.82rem', textAlign: 'center' }
}