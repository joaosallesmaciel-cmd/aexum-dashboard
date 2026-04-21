import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient, getUserFromRequest } from '../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await getUserFromRequest(req, res)
    if (!user) return res.status(401).json({ error: 'Não autenticado' })

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('posts')
      .select('id, status, format, post_type, brief, strategy, copy_variants, assets, scheduled_at, published_at, created_at, brand_id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)
    return res.status(200).json(data ?? [])
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
