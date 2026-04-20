import type { NextApiRequest, NextApiResponse } from 'next'
import Busboy from 'busboy'
import { createAdminSupabaseClient } from '../../../../lib/supabase/server'

export const config = { api: { bodyParser: false } }

function parseFile(req: NextApiRequest): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers })
    const chunks: Buffer[] = []
    let filename = 'file'
    let mimetype = 'application/octet-stream'
    busboy.on('file', (_, file, info) => {
      filename = info.filename
      mimetype = info.mimeType
      file.on('data', chunk => chunks.push(chunk))
    })
    busboy.on('finish', () => resolve({ buffer: Buffer.concat(chunks), filename, mimetype }))
    busboy.on('error', reject)
    req.pipe(busboy)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const brand_id = req.query.id as string

  try {
    const { buffer, filename, mimetype } = await parseFile(req)

    const supabase = createAdminSupabaseClient()
    const path = `references/${brand_id}/${Date.now()}-${filename}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(path, buffer, { contentType: mimetype, upsert: false })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage.from('brand-assets').getPublicUrl(path)
    const url = urlData.publicUrl

    const { data: brand } = await supabase.from('brands').select('assets').eq('id', brand_id).single()
    const existing: string[] = (brand?.assets as any)?.reference_images ?? []

    await supabase.from('brands').update({
      assets: { ...(brand?.assets ?? {}), reference_images: [...existing, url] },
    }).eq('id', brand_id)

    return res.status(201).json({ url })
  } catch (err: any) {
    console.error('[upload-reference]', err)
    return res.status(500).json({ error: err.message })
  }
}
