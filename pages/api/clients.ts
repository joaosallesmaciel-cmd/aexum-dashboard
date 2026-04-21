import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { type, name, document, email, phone, whatsapp, segment, origin, responsible, contract_value, stage, notes } = req.body
    const { data, error } = await supabase
      .from('clients')
      .insert({ owner_id: user.id, type, name, document, email, phone, whatsapp, segment, origin, responsible, contract_value, stage, notes })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
