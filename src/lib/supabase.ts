import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabaseEnv = Boolean(url && key)

// Placeholder values keep the module importable when .env is missing; App shows a setup notice instead.
export const supabase = createClient(url || 'http://localhost', key || 'missing')
