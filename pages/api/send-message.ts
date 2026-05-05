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
    .select('zapi_instance, zapi_token')
    .eq('owner_id', user.id)
    .single()

  if (!config?.zapi_instance || !config?.zapi_token) {
    return res.status(200).json({ saved: true, sent: false, error: 'Z-API não configurada' })
  }

  // Send via Z-API
  try {
    const zapiRes = await fetch(
      `https://api.z-api.io/instances/${config.zapi_instance}/token/${config.zapi_token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: whatsapp_number, message }),
      }
    )
    const zapiData = await zapiRes.json()
    if (!zapiRes.ok) {
      return res.status(200).json({ saved: true, sent: false, error: zapiData })
    }
    return res.json({ saved: true, sent: true })
  } catch (err: any) {
    return res.status(200).json({ saved: true, sent: false, error: err.message })
  }
}
