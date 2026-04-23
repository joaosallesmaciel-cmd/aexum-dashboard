import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../lib/supabase/server'

function generateKey() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, last_used_at, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  if (req.method === 'POST') {
    const { name } = req.body
    if (!name) return res.status(400).json({ error: 'Nome obrigatório' })

    const key = generateKey()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({ owner_id: user.id, name, key_hash: key })
      .select('id, name, created_at')
      .single()
    if (error) return res.status(500).json({ error: error.message })

    return res.status(201).json({ ...data, key })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
