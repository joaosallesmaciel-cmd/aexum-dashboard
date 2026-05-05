import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const user = await getUserFromRequest(req, res)
  if (!user) return

  const supabase = createAdminSupabaseClient()

  const [{ data: sessions }, { data: lastMsgs }] = await Promise.all([
    supabase
      .from('agent_sessions')
      .select('id, whatsapp_number, whatsapp_name, last_message_at, client_id, clients(id, name)')
      .eq('owner_id', user.id)
      .order('last_message_at', { ascending: false }),
    supabase
      .from('agent_messages')
      .select('session_id, content, role, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(500),
  ])

  const lastBySession: Record<string, { content: string; role: string; created_at: string }> = {}
  for (const msg of lastMsgs ?? []) {
    if (!lastBySession[msg.session_id]) lastBySession[msg.session_id] = msg
  }

  const result = (sessions ?? []).map(s => ({
    ...s,
    last_message: lastBySession[s.id] ?? null,
  }))

  res.json(result)
}
