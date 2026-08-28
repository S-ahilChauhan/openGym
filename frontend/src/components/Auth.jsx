import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function Auth({ onLoginSuccess }) {
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
    <div style={styles.container}>
      <div style={styles.overlay} />
      <form onSubmit={handleAuth} style={styles.formSection}>
        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <div style={styles.inputWrapper}>
          <span style={styles.icon} aria-hidden="true">👤</span>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
        </div>
        <div style={styles.inputWrapper}>
          <span style={styles.icon} aria-hidden="true">🔒</span>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
        </div>

        <div style={styles.bottomCard}>
          {!isSignUp && <button type="button" onClick={handleForgotPassword} style={styles.forgotBtn}>Forgot Password?</button>}
          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Processing...' : isSignUp ? 'Create an account' : 'Login'}
          </button>
          <div style={styles.divider}>or</div>
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg('') }} style={styles.secondaryBtn}>
            {isSignUp ? 'Already have an account? Login' : 'Create an account'}
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundImage: "url('/baki-bg.jpg.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    zIndex: 9999, overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)', zIndex: 1 },
  formSection: {
    position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    alignItems: 'center', width: '100%', maxWidth: '420px', margin: '0 auto', boxSizing: 'border-box', paddingTop: '20px'
  },
  inputWrapper: {
    width: '88%', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(8px)',
    border: '1.5px solid rgba(255, 255, 255, 0.55)', borderRadius: '35px', padding: '0.85rem 1.2rem', marginBottom: '1rem', boxSizing: 'border-box'
  },
  icon: { color: '#aaa', marginRight: '12px', fontSize: '1rem' },
  input: { background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '1rem', width: '100%', letterSpacing: '0.3px' },
  bottomCard: {
    width: '100%', backgroundColor: 'rgba(235, 235, 235, 0.88)', backdropFilter: 'blur(20px)', borderTopLeftRadius: '38px',
    borderTopRightRadius: '38px', padding: '1.8rem 1.5rem 2.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column',
    alignItems: 'center', boxSizing: 'border-box', boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.35)'
  },
  forgotBtn: { background: 'none', border: 'none', color: '#333', fontSize: '0.9rem', marginBottom: '1.2rem', cursor: 'pointer', fontWeight: '500' },
  primaryBtn: { width: '100%', padding: '1rem', backgroundColor: '#1f1f1f', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.35)' },
  divider: { margin: '0.9rem 0', color: '#777', fontSize: '0.85rem' },
  secondaryBtn: { width: '100%', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.85)', color: '#222', border: '1.5px solid rgba(0, 0, 0, 0.1)', borderRadius: '30px', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
  error: { color: '#ff4d4f', backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: '0.5rem 1rem', borderRadius: '20px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }
}
