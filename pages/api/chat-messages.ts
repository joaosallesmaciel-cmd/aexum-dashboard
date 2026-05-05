import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient } from '../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { whatsapp_number } = req.query
  if (!whatsapp_number || typeof whatsapp_number !== 'string') {
    return res.status(400).json({ error: 'whatsapp_number required' })
  }

  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('agent_chat_memory')
    .select('id, message')
    .eq('session_id', whatsapp_number)
    .order('id', { ascending: true })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ messages: data })
}
