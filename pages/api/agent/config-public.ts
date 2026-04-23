import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const apiKey = req.headers['x-api-key'] as string
  if (!apiKey) return res.status(401).json({ error: 'Missing API key' })

  const { data: keyData } = await supabase
    .from('api_keys')
    .select('owner_id')
    .eq('key_hash', apiKey)
    .single()

  if (!keyData) return res.status(401).json({ error: 'Invalid API key' })

  const { data: config } = await supabase
    .from('agent_config')
    .select('*')
    .eq('owner_id', keyData.owner_id)
    .single()

  return res.status(200).json(config || {})
}
