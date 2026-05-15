import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { generateApiKey } from '../../../../lib/api-keys'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUser() {
  const cookieStore = cookies()
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, key_prefix, permissions, is_active, last_used_at, created_at, description')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { name, description, permissions } = await req.json()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const { count } = await supabaseAdmin
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('is_active', true)

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'Limite de 5 chaves ativas atingido' }, { status: 400 })
  }

  const { fullKey, keyHash, keyPrefix } = generateApiKey()

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      owner_id: user.id,
      name,
      description,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: permissions || ['read', 'write'],
      is_active: true
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao criar chave' }, { status: 500 })

  return NextResponse.json({ id: data.id, key: fullKey, key_prefix: keyPrefix })
}
