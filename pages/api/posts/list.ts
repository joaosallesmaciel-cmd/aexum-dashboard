import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient } from '../../../lib/supabase/server'

const OWNER_ID = '00000000-0000-0000-0000-000000000001'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('posts')
      .select('id, status, format, post_type, brief, strategy, copy_variants, assets, scheduled_at, published_at, created_at, brand_id')
      .eq('owner_id', OWNER_ID)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)
    return res.status(200).json(data ?? [])
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
