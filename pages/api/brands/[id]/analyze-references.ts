import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminSupabaseClient } from '../../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const brand_id = req.query.id as string
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada' })

  try {
    const supabase = createAdminSupabaseClient()
    const { data: brand, error } = await supabase.from('brands').select('assets').eq('id', brand_id).single()
    if (error) throw new Error(error.message)

    const images: string[] = (brand?.assets as any)?.reference_images ?? []
    if (!images.length) return res.status(400).json({ error: 'Nenhuma imagem de referência encontrada' })

    const analyses: string[] = []

    for (const url of images) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'url', url } },
              { type: 'text', text: 'Analise o design deste post/slide. Descreva em 3-5 linhas:\n- Layout e composição (onde ficam título, corpo, elementos)\n- Hierarquia visual e tipografia\n- Uso de espaço negativo\n- Estilo gráfico predominante\nSeja específico e técnico. Responda em português.' },
            ],
          }],
        }),
      })

      const data = await response.json()
      const text = data.content?.find((b: any) => b.type === 'text')?.text ?? ''
      if (text) analyses.push(`Referência ${analyses.length + 1}:\n${text}`)
    }

    const style_analysis = analyses.join('\n\n')

    await supabase.from('brands').update({
      assets: { ...(brand?.assets ?? {}), style_analysis },
    }).eq('id', brand_id)

    return res.status(200).json({ style_analysis })
  } catch (err: any) {
    console.error('[analyze-references]', err)
    return res.status(500).json({ error: err.message })
  }
}
