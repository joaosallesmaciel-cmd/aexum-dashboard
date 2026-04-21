import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import type { NextApiRequest, NextApiResponse } from 'next'

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

// Extrai o usuário autenticado do cookie da request
export async function getUserFromRequest(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return req.cookies[name] },
        set(name, value, options) { res.setHeader('Set-Cookie', `${name}=${value}; Path=/`) },
        remove(name) { res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`) },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}