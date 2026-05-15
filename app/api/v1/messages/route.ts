import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey } from '../../../../lib/api-keys'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const start = Date.now()
  const apiKey = req.headers.get('x-api-key')

  if (!apiKey) return NextResponse.json({ error: 'x-api-key header obrigatório' }, { status: 401 })

  const { valid, owner_id, key_id } = await validateApiKey(apiKey, supabaseAdmin)

  if (!valid || !owner_id) {
    await supabaseAdmin.from('api_logs').insert({
      owner_id: '00000000-0000-0000-0000-000000000000',
      endpoint: '/api/v1/messages',
      method: 'POST',
      status_code: 401,
      latency_ms: Date.now() - start,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      error_message: 'API key inválida'
    })
    return NextResponse.json({ error: 'API key inválida ou revogada' }, { status: 401 })
  }

  const { phone, message } = await req.json()
  if (!phone || !message) return NextResponse.json({ error: 'phone e message obrigatórios' }, { status: 400 })

  const { data: config } = await supabaseAdmin
    .from('agent_config')
    .select('zapi_instance, zapi_token, zapi_client_token')
    .eq('owner_id', owner_id)
    .single()

  if (!config) return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 })

  const zapiResp = await fetch(
    `https://api.z-api.io/instances/${config.zapi_instance}/token/${config.zapi_token}/send-text`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': config.zapi_client_token },
      body: JSON.stringify({ phone, message })
    }
  )

  const latency = Date.now() - start
  const status = zapiResp.ok ? 200 : 502

  await supabaseAdmin.from('api_logs').insert({
    owner_id, api_key_id: key_id,
    endpoint: '/api/v1/messages', method: 'POST',
    status_code: status, latency_ms: latency,
    ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    error_message: zapiResp.ok ? null : 'Erro na entrega via Z-API'
  })

  if (!zapiResp.ok) return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 502 })

  return NextResponse.json({ success: true, latency_ms: latency })
}
