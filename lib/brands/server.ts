import { createClient } from '@supabase/supabase-js'

// Cliente padrão (para uso futuro com autenticação)
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Cliente admin — bypassa RLS, usar APENAS em API routes
// NUNCA importar em componentes React com 'use client'
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}