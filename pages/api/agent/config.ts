import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('agent_config')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })
    return res.status(200).json(data ?? null)
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('agent_config')
      .insert({ owner_id: user.id, ...req.body })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  if (req.method === 'PATCH') {
    const { data, error } = await supabase
      .from('agent_config')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('owner_id', user.id)
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
