import { createAdminSupabaseClient } from '../supabase/server'

export type Brand = {
  id: string
  name: string
  slug: string
  niche: string | null
  target_audience: string | null
  tone_of_voice: string | null
  visual: {
    palette: {
      primary: string
      secondary: string
      accent: string
      text: string
    }
    typography: {
      display: string | null
      body: string | null
    }
    graphic_style: string
    recurring_elements: string
  }
  content_strategy: {
    pillars: string[]
    banned_words: string[]
    preferred_hashtags: string[]
    cta_style: string | null
  }
  is_active: boolean
  created_at: string
}

export async function listBrands(owner_id: string): Promise<Brand[]> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('owner_id', owner_id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw new Error(`Erro ao listar brands: ${error.message}`)
  return data ?? []
}

export async function getBrandById(id: string): Promise<Brand | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createBrand(input: {
  name: string
  niche?: string
  target_audience?: string
  tone_of_voice?: string
  visual?: Partial<Brand['visual']>
  content_strategy?: Partial<Brand['content_strategy']>
}, owner_id: string): Promise<Brand> {
  const supabase = createAdminSupabaseClient()

  const slug = input.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('brands')
    .insert({
      owner_id,
      name: input.name,
      slug,
      niche: input.niche ?? null,
      target_audience: input.target_audience ?? null,
      tone_of_voice: input.tone_of_voice ?? null,
      visual: input.visual ?? {},
      content_strategy: input.content_strategy ?? {},
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar brand: ${error.message}`)
  return data
}

export async function updateBrand(
  id: string,
  input: Partial<Omit<Brand, 'id' | 'created_at'>>
): Promise<Brand> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('brands')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar brand: ${error.message}`)
  return data
}