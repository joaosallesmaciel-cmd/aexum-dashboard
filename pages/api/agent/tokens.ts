import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await getUserFromRequest(req, res)
  if (!user) return

  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('agent_messages')
    .select('input_tokens, output_tokens')
    .eq('owner_id', user.id)

  if (error) return res.status(500).json({ error: error.message })

  const input_tokens = (data ?? []).reduce((sum, r) => sum + (r.input_tokens ?? 0), 0)
  const output_tokens = (data ?? []).reduce((sum, r) => sum + (r.output_tokens ?? 0), 0)

  res.json({ input_tokens, output_tokens, total: input_tokens + output_tokens })
}
