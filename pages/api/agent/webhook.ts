import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Valida API key no header
  const apiKey = req.headers['x-api-key'] as string
  if (!apiKey) return res.status(401).json({ error: 'Missing API key' })

  // Busca owner pela api key
  const { data: keyData } = await supabase
    .from('api_keys')
    .select('owner_id')
    .eq('key_hash', apiKey)
    .single()

  if (!keyData) return res.status(401).json({ error: 'Invalid API key' })

  const owner_id = keyData.owner_id
  const { phone, name, message } = req.body

  if (!phone || !message) return res.status(400).json({ error: 'Missing phone or message' })

  // Verifica se cliente já existe
  const { data: existing } = await supabase
    .from('clients')
    .select('id, name')
    .eq('owner_id', owner_id)
    .eq('whatsapp', phone)
    .single()

  let clientId = existing?.id

  // Cria cliente se não existir
  if (!clientId) {
    const { data: newClient } = await supabase
      .from('clients')
      .insert({
        owner_id,
        name: name || phone,
        whatsapp: phone,
        type: 'pf',
        stage: 'lead',
        origin: 'whatsapp',
      })
      .select('id')
      .single()
    clientId = newClient?.id
  }

  // Busca ou cria sessão
  const { data: session } = await supabase
    .from('agent_sessions')
    .select('id, stage, context')
    .eq('owner_id', owner_id)
    .eq('whatsapp_number', phone)
    .single()

  let sessionId = session?.id

  if (!sessionId) {
    const { data: newSession } = await supabase
      .from('agent_sessions')
      .insert({
        owner_id,
        client_id: clientId,
        whatsapp_number: phone,
        whatsapp_name: name || phone,
        stage: 'qualifying',
      })
      .select('id')
      .single()
    sessionId = newSession?.id
  }

  // Salva mensagem do lead
  await supabase.from('agent_messages').insert({
    session_id: sessionId,
    owner_id,
    role: 'user',
    content: message,
  })

  // Salva interação no CRM
  if (clientId) {
    await supabase.from('client_interactions').insert({
      client_id: clientId,
      owner_id,
      type: 'whatsapp',
      content: `Lead: ${message}`,
    })
  }

  // Atualiza last_message_at da sessão
  await supabase
    .from('agent_sessions')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId)

  // Busca histórico de mensagens (últimas 10)
  const { data: history } = await supabase
    .from('agent_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(10)

  // Busca config do agente
  const { data: config } = await supabase
    .from('agent_config')
    .select('*')
    .eq('owner_id', owner_id)
    .single()

  // Retorna dados para o n8n continuar o fluxo com Claude
  return res.status(200).json({
    sessionId,
    clientId,
    history: history || [],
    config: config || {},
    phone,
    message,
  })
}
