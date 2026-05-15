import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

export async function POST(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key')
  if (internalKey !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { owner_id, event_type, payload } = await req.json()
  if (!owner_id || !event_type) {
    return NextResponse.json({ error: 'owner_id e event_type obrigatórios' }, { status: 400 })
  }

  const { data: webhooks } = await supabaseAdmin
    .from('webhook_configs')
    .select('id, url, secret')
    .eq('owner_id', owner_id)
    .eq('is_active', true)
    .contains('events', [event_type])

  if (!webhooks || webhooks.length === 0) return NextResponse.json({ dispatched: 0 })

  const payloadStr = JSON.stringify({
    event: event_type,
    timestamp: new Date().toISOString(),
    data: payload
  })

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const sig = generateSignature(payloadStr, wh.secret)
      const start = Date.now()
      try {
        const resp = await fetch(wh.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Aexum-Signature': sig,
            'X-Aexum-Event': event_type,
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000)
        })
        const duration = Date.now() - start
        const success = resp.status >= 200 && resp.status < 300
        await supabaseAdmin.from('webhook_deliveries').insert({
          webhook_config_id: wh.id, owner_id, event_type,
          payload: JSON.parse(payloadStr), response_status: resp.status,
          duration_ms: duration, success
        })
        await supabaseAdmin.from('webhook_configs').update({
          last_triggered_at: new Date().toISOString(),
          failure_count: success ? 0 : supabaseAdmin.rpc('increment', { row_id: wh.id })
        }).eq('id', wh.id)
      } catch {
        await supabaseAdmin.from('webhook_deliveries').insert({
          webhook_config_id: wh.id, owner_id, event_type,
          payload: JSON.parse(payloadStr), success: false, duration_ms: Date.now() - start,
        })
      }
    })
  )

  return NextResponse.json({ dispatched: webhooks.length })
}
