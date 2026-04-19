import type { NextApiRequest, NextApiResponse } from 'next'
import { listBrands, createBrand } from '../../lib/brands/actions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const brands = await listBrands()
      res.status(200).json(brands)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  else if (req.method === 'POST') {
    try {
      const brand = await createBrand(req.body)
      res.status(201).json(brand)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  else {
    res.status(405).json({ error: 'Método não permitido' })
  }
}
