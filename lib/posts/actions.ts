import { createAdminSupabaseClient } from '../supabase/server'

export type PostInput = {
  brand_id?: string
  format: 'single' | 'carousel' | 'story' | 'reel'
  post_type: 'educational' | 'entertainment' | 'promotional' | 'behind_scenes' | 'engagement'
  brief: { theme: string; tone: string; style: string; extra_context?: string }
  strategy?: { angle?: string }
  copy_variants?: any[]
}

export async function createPost(input: PostInput, owner_id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars não configuradas (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  }
  const supabase = createAdminSupabaseClient()
  const { brand_id, ...rest } = input
  const { data, error } = await supabase
    .from('posts')
    .insert({
      owner_id,
      status: 'ready_for_review',
      ...(brand_id ? { brand_id } : {}),
      ...rest,
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar post: ${error.message}`)
  return data
}

export async function updatePost(id: string, input: Partial<PostInput> & { status?: string }) {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar post: ${error.message}`)
  return data
}
