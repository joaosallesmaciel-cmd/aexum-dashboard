import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient } from '../../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const post_id = req.query.id as string
  const { scheduled_at } = req.body

  if (!scheduled_at) return res.status(400).json({ error: 'scheduled_at é obrigatório' })

  try {
    const supabase = createAdminSupabaseClient()

    // Buscar o post completo para enviar ao n8n
    const { data: post, error } = await supabase
      .from('posts')
      .update({ scheduled_at, status: 'scheduled', updated_at: new Date().toISOString() })
      .eq('id', post_id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Disparar webhook n8n (não-bloqueante)
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id,
          scheduled_at,
          format: post.format,
          copy_variants: post.copy_variants,
          assets: post.assets,
          brief: post.brief,
          callback_url: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/posts/${post_id}/publish-callback`,
        }),
      }).catch(e => console.error('[n8n webhook]', e))
    }

    return res.status(200).json({ post })
  } catch (err: any) {
    console.error('[schedule]', err)
    return res.status(500).json({ error: err.message })
  }
}
