import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const user = await getUserFromRequest(req, res)
  if (!user) return

  const supabase = createAdminSupabaseClient()
  const { count, error } = await supabase
    .from('agent_messages')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ count: count ?? 0 })
}
