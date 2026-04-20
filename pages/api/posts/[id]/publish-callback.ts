import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient } from '../../../../lib/supabase/server'

// Chamado pelo n8n após publicar no Instagram
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const post_id = req.query.id as string
  const { status, platform_post_id, error: publishError } = req.body

  if (!['published', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'status deve ser published ou failed' })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const update: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'published') {
      update.published_at = new Date().toISOString()
      update.platform = 'instagram'
      if (platform_post_id) update.platform_post_id = platform_post_id
    }
    if (status === 'failed' && publishError) {
      update.metrics = { publish_error: publishError }
    }

    const { data, error } = await supabase.from('posts').update(update).eq('id', post_id).select().single()
    if (error) throw new Error(error.message)

    return res.status(200).json({ post: data })
  } catch (err: any) {
    console.error('[publish-callback]', err)
    return res.status(500).json({ error: err.message })
  }
}
