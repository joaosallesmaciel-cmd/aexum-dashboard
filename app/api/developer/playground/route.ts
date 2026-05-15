import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { message, history } = await req.json()
  if (!message) return NextResponse.json({ error: 'message obrigatório' }, { status: 400 })

  const { data: config } = await supabaseAdmin
    .from('agent_config')
    .select('agent_name, tone, company_name, company_description, products_services, value_proposition, pricing_info, prompt_extra')
    .eq('owner_id', user.id)
    .single()

  if (!config) return NextResponse.json({ error: 'Configuração do agente não encontrada' }, { status: 404 })

  const systemPrompt = `Você é ${config.agent_name}, atendente virtual da ${config.company_name}.
Tom de voz: ${config.tone}
Empresa: ${config.company_description}
Produtos/Serviços: ${config.products_services}
Proposta de valor: ${config.value_proposition}
Informações de preço: ${config.pricing_info}
${config.prompt_extra || ''}
MODO PLAYGROUND: Você está sendo testado pelo administrador. Responda normalmente como faria com um cliente real.`

  const messages = [...(history || []), { role: 'user' as const, content: message }]

  const start = Date.now()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: systemPrompt,
    messages
  })

  const latency = Date.now() - start
  const reply = (response.content[0] as { type: string; text: string }).text

  await supabaseAdmin.from('api_logs').insert({
    owner_id: user.id,
    endpoint: '/api/developer/playground',
    method: 'POST',
    status_code: 200,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    latency_ms: latency
  })

  return NextResponse.json({ reply, usage: { input_tokens: response.usage.input_tokens, output_tokens: response.usage.output_tokens, latency_ms: latency } })
}
