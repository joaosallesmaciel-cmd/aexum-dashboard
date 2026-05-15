import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const cookieStore = cookies()
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 30)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data } = await supabaseAdmin
    .from('api_logs')
    .select('id, endpoint, method, status_code, input_tokens, output_tokens, latency_ms, error_message, created_at, api_key_id')
    .eq('owner_id', user.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data: stats } = await supabaseAdmin
    .from('api_logs')
    .select('status_code, input_tokens, output_tokens, latency_ms')
    .eq('owner_id', user.id)
    .gte('created_at', since.toISOString())

  const totalRequests = stats?.length || 0
  const successCount = stats?.filter(s => (s.status_code || 0) < 400).length || 0
  const totalTokens = stats?.reduce((acc, s) => acc + (s.input_tokens || 0) + (s.output_tokens || 0), 0) || 0
  const avgLatency = stats?.length
    ? Math.round(stats.reduce((acc, s) => acc + (s.latency_ms || 0), 0) / stats.length)
    : 0

  return NextResponse.json({ logs: data || [], summary: { totalRequests, successCount, totalTokens, avgLatency } })
}
