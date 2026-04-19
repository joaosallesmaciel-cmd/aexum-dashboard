import { createClient } from '@supabase/supabase-js'

// Cliente padrão — para quando tivermos autenticação no futuro
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Cliente admin — bypassa RLS, usar APENAS em API routes do servidor
// NUNCA importar esse em componentes React ou arquivos com 'use client'
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}