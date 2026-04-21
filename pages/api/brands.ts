import type { NextApiRequest, NextApiResponse } from 'next'
import { listBrands, createBrand } from '../../lib/brands/actions'
import { getUserFromRequest } from '../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  if (req.method === 'GET') {
    try {
      const brands = await listBrands(user.id)
      res.status(200).json(brands)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  else if (req.method === 'POST') {
    try {
      const brand = await createBrand(req.body, user.id)
      res.status(201).json(brand)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}
