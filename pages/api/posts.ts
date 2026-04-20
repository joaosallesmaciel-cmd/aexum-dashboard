import type { NextApiRequest, NextApiResponse } from 'next'
import { createPost, updatePost } from '../../lib/posts/actions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const post = await createPost(req.body)
      return res.status(201).json(post)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, ...fields } = req.body
      const post = await updatePost(id, fields)
      return res.status(200).json(post)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
