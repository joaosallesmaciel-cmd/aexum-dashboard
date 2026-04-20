import { createAdminSupabaseClient } from '../supabase/server'

const OWNER_ID = '00000000-0000-0000-0000-000000000001'

export type PostInput = {
  brand_id?: string
  format: 'single' | 'carousel' | 'story' | 'reel'
  post_type: 'educational' | 'entertainment' | 'promotional' | 'behind_scenes' | 'engagement'
  brief: { theme: string; tone: string; style: string; extra_context?: string }
  strategy?: { angle?: string }
  copy_variants?: any[]
}

export async function createPost(input: PostInput) {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({ owner_id: OWNER_ID, status: 'generating', ...input })
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
