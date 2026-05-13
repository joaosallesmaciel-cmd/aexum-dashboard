import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const { query, owner_id, match_count = 5, threshold = 0.7 } = await req.json()

    if (!query || !owner_id) {
      return NextResponse.json({ error: 'query e owner_id obrigatórios' }, { status: 400 })
    }

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    const queryEmbedding = embeddingResponse.data[0].embedding

    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding,
      owner_id_param: owner_id,
      match_threshold: threshold,
      match_count: match_count
    })

    if (error) throw error

    return NextResponse.json({ results: data || [] })

  } catch (error) {
    console.error('RAG search error:', error)
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }
}
