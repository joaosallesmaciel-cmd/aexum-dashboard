import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromRequest, createAdminSupabaseClient } from '../../../../../lib/supabase/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getUserFromRequest(req, res)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const { id } = req.query
  const supabase = createAdminSupabaseClient()

  if (req.method === 'GET') {
    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    if (sessionError || !session) return res.status(404).json({ error: 'Sessão não encontrada' })

    const [{ data: agentMsgs }, { data: memoryMsgs }] = await Promise.all([
      supabase
        .from('agent_messages')
        .select('id, session_id, role, content, created_at, input_tokens, output_tokens')
        .eq('session_id', id)
        .order('created_at', { ascending: true }),
      supabase
        .from('agent_chat_memory')
        .select('id, session_id, message, created_at')
        .eq('session_id', id)
        .order('created_at', { ascending: true }),
    ])

    const fromMemory = (memoryMsgs ?? []).map((r: any) => ({
      id: `mem-${r.id}`,
      session_id: r.session_id,
      role: r.message?.role ?? 'assistant',
      content: r.message?.content ?? '',
      created_at: r.created_at,
    }))

    const all = [...(agentMsgs ?? []), ...fromMemory]
    all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return res.status(200).json(all)
  }

  return res.status(405).json({ error: 'Método não permitido' })
}
