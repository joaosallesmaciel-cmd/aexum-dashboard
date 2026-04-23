import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('agent_sessions')
      .select('*, clients(id, name)')
      .eq('owner_id', user.id)
      .order('last_message_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
