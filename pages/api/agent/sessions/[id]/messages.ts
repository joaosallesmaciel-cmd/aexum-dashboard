import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const { id } = req.query
  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    if (sessionError || !session) return res.status(404).json({ error: 'Sessão não encontrada' })

    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
