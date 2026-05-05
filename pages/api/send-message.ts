import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const user = await getUserFromRequest(req, res)
  if (!user) return

  const { session_id, message, whatsapp_number } = req.body
  if (!session_id || !message || !whatsapp_number) {
    return res.status(400).json({ error: 'session_id, message e whatsapp_number são obrigatórios' })
  }

  const supabase = createAdminSupabaseClient()

  // Save message to DB
  await supabase.from('agent_messages').insert({
    session_id,
    owner_id: user.id,
    role: 'human',
    content: message,
  })

  // Get Z-API credentials
  const { data: config } = await supabase
    .from('agent_config')
    .select('zapi_instance, zapi_token, zapi_client_token')
    .eq('owner_id', user.id)
    .single()

  if (!config?.zapi_instance || !config?.zapi_token) {
    return res.status(200).json({ saved: true, sent: false, error: 'Z-API não configurada' })
  }

  // Send via Z-API
  try {
    console.log('=== DEBUG Z-API ===')
    console.log('CLIENT_TOKEN presente:', !!config.zapi_client_token)
    console.log('CLIENT_TOKEN valor:', config.zapi_client_token?.substring(0, 8) + '...')
    console.log('INSTANCE:', config.zapi_instance)

    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${config.zapi_instance}/token/${config.zapi_token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Client-Token': config.zapi_client_token ?? '' },
        body: JSON.stringify({ phone: whatsapp_number, message }),
      }
    )
    const responseText = await zapiRes.text()
    console.log('Z-API status:', zapiRes.status)
    console.log('Z-API response:', responseText)

    const zapiData = JSON.parse(responseText)
    if (!zapiRes.ok) {
      return res.status(200).json({ saved: true, sent: false, error: zapiData })
    }
    return res.json({ saved: true, sent: true })
  } catch (err: any) {
    console.error('[send-message] Z-API error:', err)
    return res.status(200).json({ saved: true, sent: false, error: err.message })
  }
}
