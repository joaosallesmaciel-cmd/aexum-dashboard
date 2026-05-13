import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
    i += chunkSize - overlap
  }
  return chunks.filter(c => c.trim().length > 0)
}

async function generateChunkContext(fullDocument: string, chunk: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `<document>
${fullDocument}
</document>
Aqui está o trecho que queremos situar dentro do documento completo:
<chunk>
${chunk}
</chunk>
Forneça um contexto sucinto (máximo 100 palavras) para situar este trecho dentro do documento, com objetivo de melhorar a recuperação por busca semântica. Responda apenas com o contexto sucinto, sem mais nada.`
    }]
  })
  return (response.content[0] as { type: string; text: string }).text
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function POST(req: NextRequest) {
  try {
    const { owner_id, document_id, name, content } = await req.json()

    if (!owner_id || !document_id || !name || !content) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const chunks = chunkText(content, 500, 50)
    const insertedChunks = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const context = await generateChunkContext(content, chunk)
      const contextualizedChunk = `${context}\n\n${chunk}`
      const embedding = await generateEmbedding(contextualizedChunk)

      const { data, error } = await supabase
        .from('knowledge_chunks')
        .insert({
          owner_id,
          document_id,
          source_name: name,
          content: chunk,
          contextualized_content: contextualizedChunk,
          embedding,
          chunk_index: i,
          token_count: chunk.split(/\s+/).length
        })
        .select('id')
        .single()

      if (error) throw error
      insertedChunks.push(data.id)
    }

    await supabase
      .from('knowledge_documents')
      .update({ status: 'ready', chunk_count: chunks.length })
      .eq('id', document_id)

    return NextResponse.json({ success: true, chunks_created: insertedChunks.length, document_id })

  } catch (error) {
    console.error('RAG ingest error:', error)
    return NextResponse.json({ error: 'Erro na ingestão do documento' }, { status: 500 })
  }
}
