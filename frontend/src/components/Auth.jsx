import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function Auth({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user && data.session && onLoginSuccess) onLoginSuccess(data.user)
        else setErrorMsg('Check your email for a confirmation link before logging in.')
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

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>{isSignUp ? 'Create Account' : 'Log In to OpenGym'}</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <form onSubmit={handleAuth}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              display: 'block', width: '100%', padding: '0.75rem', marginBottom: '1rem',
              color: '#ffffff', backgroundColor: '#1e1e1e', border: '1px solid #333333',
              borderRadius: '6px', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              display: 'block', width: '100%', padding: '0.75rem', marginBottom: '1rem',
              color: '#ffffff', backgroundColor: '#1e1e1e', border: '1px solid #333333',
              borderRadius: '6px', outline: 'none', fontSize: '1rem', boxSizing: 'border-box'
            }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem' }}>
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => { setIsSignUp(!isSignUp); setErrorMsg('') }}
        style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', width: '100%', textAlign: 'center' }}
      >
        {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}
