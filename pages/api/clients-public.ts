import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getOwner(apiKey: string) {
  const { data } = await supabase
    .from('api_keys')
    .select('owner_id')
    .eq('key_hash', apiKey)
    .single()
  return data?.owner_id
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = req.headers['x-api-key'] as string
  if (!apiKey) return res.status(401).json({ error: 'Missing API key' })

  const owner_id = await getOwner(apiKey)
  if (!owner_id) return res.status(401).json({ error: 'Invalid API key' })

  if (req.method === 'GET') {
    const { phone } = req.query
    const query = supabase.from('clients').select('*').eq('owner_id', owner_id)
    if (phone) query.eq('whatsapp', phone as string)
    const { data } = await query
    return res.status(200).json(data || [])
  }

  if (req.method === 'POST') {
    const { data } = await supabase
      .from('clients')
      .insert({ ...req.body, owner_id })
      .select()
      .single()
    return res.status(201).json(data)
  }

  return res.status(405).end()
}
