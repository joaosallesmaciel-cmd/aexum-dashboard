import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Rate limit: max 10 messages per IP per hour (in-memory)
const ipMap = new Map<string, { count: number; reset: number }>()

const DEMO_SYSTEM = `Você é Bia, atendente virtual de demonstração do Aexum.
Mostre como uma IA pode atender clientes de forma natural.
Responda perguntas sobre agendamentos, preços e serviços fictícios de uma clínica de estética.
Máximo 60 palavras por mensagem. Sem markdown. Sem asteriscos.`

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (entry) {
    if (now < entry.reset) {
      if (entry.count >= 10) {
        return NextResponse.json(
          { error: 'Limite de mensagens atingido. Tente novamente em 1 hora.' },
          { status: 429 }
        )
      }
      entry.count++
    } else {
      ipMap.set(ip, { count: 1, reset: now + 60 * 60 * 1000 })
    }
  } else {
    ipMap.set(ip, { count: 1, reset: now + 60 * 60 * 1000 })
  }

  let message: string
  try {
    const body = await req.json()
    message = body.message?.trim()
    if (!message) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: DEMO_SYSTEM,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[demo/chat]', err)
    return NextResponse.json({ error: 'Erro ao processar mensagem.' }, { status: 500 })
  }
}
