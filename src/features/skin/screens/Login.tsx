import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

/** Email + password. Works the same in Safari and the Home Screen app (no email link needed). */
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const creds = { email: email.trim(), password }
    const { error } = mode === 'in'
      ? await supabase.auth.signInWithPassword(creds)
      : await supabase.auth.signUp(creds)
    setBusy(false)
    if (error) setErr(error.message) // on success App's onAuthStateChange takes over
  }

  return (
    <form className="center-screen" onSubmit={submit}>
      <h1 className="large-title">Skin Tracker</h1>
      <p className="muted">{mode === 'in' ? 'Sign in with your email and password.' : 'Make your account. Pick a password.'}</p>
      <input
        className="field" type="email" required autoComplete="email" inputMode="email"
        placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="field" type="password" required minLength={6}
        autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
        placeholder="Password (6+ characters)" value={password} onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn-primary" disabled={busy}>{busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
      {err && <p className="error">{err}</p>}
      <button type="button" className="btn-text" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr('') }}>
        {mode === 'in' ? 'First time? Create account' : 'Have an account? Sign in'}
      </button>
    </form>
  )
}
