import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, hasSupabaseEnv } from './lib/supabase'
import AppRoutes from './routes'
import Login from './features/skin/screens/Login'
import { SkinProvider } from './features/skin/SkinContext'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!hasSupabaseEnv) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // No Supabase configured: show the app on sample data.
  if (!hasSupabaseEnv) {
    return (
      <SkinProvider>
        <AppRoutes />
      </SkinProvider>
    )
  }
  if (session === undefined) return <div className="center-screen muted">Loading…</div>
  if (!session) return <Login />

  return (
    <SkinProvider>
      <AppRoutes />
    </SkinProvider>
  )
}
