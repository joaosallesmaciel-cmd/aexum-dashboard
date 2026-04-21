import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const { id: client_id } = req.query as { id: string }
  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('client_interactions')
      .select('*')
      .eq('client_id', client_id)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { type, content } = req.body
    const { data, error } = await supabase
      .from('client_interactions')
      .insert({ client_id, owner_id: user.id, type, content })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
