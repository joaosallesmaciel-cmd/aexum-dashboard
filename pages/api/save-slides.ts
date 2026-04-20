import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient } from '../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { post_id, slides, brand } = req.body
  if (!post_id || !slides?.length) return res.status(400).json({ error: 'post_id e slides são obrigatórios' })

  try {
    const supabase = createAdminSupabaseClient()
    const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`
    const urls: string[] = []

    for (const slide of slides) {
      const params = new URLSearchParams({
        bg:       slide.cor_fundo              || brand.colorPrimary,
        tc:       slide.cor_texto_principal    || brand.colorText,
        ac:       brand.colorSecondary,
        headline: slide.headline,
        corpo:    slide.corpo,
        brand:    brand.name,
        num:      String(slide.numero),
        total:    String(slides.length),
      })

      const imgRes = await fetch(`${baseUrl}/api/render-slide?${params}`)
      if (!imgRes.ok) throw new Error(`render-slide falhou: ${imgRes.status}`)

      const buffer = Buffer.from(await imgRes.arrayBuffer())
      const path = `slides/${post_id}/slide-${slide.numero}.png`

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(path, buffer, { contentType: 'image/png', upsert: true })

      if (uploadError) throw new Error(`Upload: ${uploadError.message}`)

      const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
      urls.push(urlData.publicUrl)
    }

    await supabase
      .from('posts')
      .update({ assets: { slide_urls: urls }, updated_at: new Date().toISOString() })
      .eq('id', post_id)

    return res.status(200).json({ urls })
  } catch (err: any) {
    console.error('[save-slides]', err)
    return res.status(500).json({ error: err.message })
  }
}
