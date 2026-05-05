import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { useUser } from '../lib/AuthContext'
import { faviconHref } from '../lib/favicons'

interface SessionItem {
  id: string
  whatsapp_number: string
  whatsapp_name: string | null
  last_message_at: string | null
  client_id: string | null
  is_paused: boolean
  clients: { id: string; name: string } | null
  last_message: { content: string; role: string; created_at: string } | null
}

type ChatMessage = {
  id: number
  type: 'human' | 'ai'
  content: string
}

function extractContent(message: any): string {
  const content = message.content
  if (typeof content === 'string' && content.trim() !== '') return content
  if (Array.isArray(content)) {
    const textBlock = content.find((c: any) => c.type === 'text' && c.text)
    if (textBlock) return textBlock.text
    if (message.text) return message.text
    if (message.response_metadata?.content) return message.response_metadata.content
    return ''
  }
  return ''
}

function timeAgo(iso: string | null) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

export default function Conversas() {
  const { user, supabase } = useUser()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SessionItem | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch sessions
  useEffect(() => {
    fetch('/api/conversas/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d) })
      .finally(() => setLoading(false))
  }, [])

  // Fetch messages from agent_chat_memory using whatsapp_number
  useEffect(() => {
    if (!selected) return
    setMessages([])
    setMsgLoading(true)

    supabase
      .from('agent_chat_memory')
      .select('id, message')
      .eq('session_id', selected.whatsapp_number)
      .order('id', { ascending: true })
      .then(({ data }) => {
        console.log('[RAW agent_chat_memory]', JSON.stringify(data?.slice(0, 6), null, 2))
        const normalized: ChatMessage[] = (data ?? [])
          .map((r: any) => ({
            id: r.id,
            type: (r.message?.type ?? '').toString().trim().toLowerCase() as 'human' | 'ai',
            content: extractContent(r.message),
          }))
          .filter((m: ChatMessage) => m.content !== '')

        const seen = new Set<string>()
        const deduped = normalized.filter((m: ChatMessage) => {
          const key = `${m.type}:${m.content.substring(0, 50)}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        console.log('Mensagens carregadas:', deduped.map(m => ({ id: m.id, type: m.type, preview: m.content.substring(0, 30) })))
        setMessages(deduped)
      })
      .finally(() => setMsgLoading(false))
  }, [selected?.id])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime — listen to agent_chat_memory for new messages
  useEffect(() => {
    if (!selected) return
    const channel = supabase
      .channel(`chat_memory_${selected.whatsapp_number}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_chat_memory',
          filter: `session_id=eq.${selected.whatsapp_number}`,
        },
        (payload: any) => {
          const r = payload.new
          const msg: ChatMessage = {
            id: r.id,
            type: r.message?.type,
            content: r.message?.content ?? '',
          }
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id))
            if (ids.has(msg.id)) return prev
            return [...prev, msg]
          })
          // Update session list preview
          setSessions(prev =>
            prev.map(s =>
              s.whatsapp_number === selected.whatsapp_number
                ? { ...s, last_message: { content: msg.content, role: msg.type, created_at: new Date().toISOString() }, last_message_at: new Date().toISOString() }
                : s
            )
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selected?.id])

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.whatsapp_name || '').toLowerCase().includes(q) ||
      (s.whatsapp_number || '').includes(q) ||
      (s.clients?.name || '').toLowerCase().includes(q)
    )
  })

  const displayName = (s: SessionItem) => s.whatsapp_name || s.clients?.name || s.whatsapp_number

  function msgStyle(type: string): { align: 'flex-start' | 'flex-end'; bg: string; color: string; label: string } {
    if (type === 'human') return { align: 'flex-start', bg: '#1a1a1a', color: '#ffffff', label: 'Cliente' }
    if (type === 'ai') return { align: 'flex-end', bg: '#89d957', color: '#000000', label: 'Bia' }
    return { align: 'flex-end', bg: '#2a5298', color: '#ffffff', label: 'Você' }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      <Head>
        <title>Conversas — Aexum</title>
        <link rel="icon" type="image/svg+xml" href={faviconHref('dashboard')} />
      </Head>
      <Sidebar />

      {/* LEFT PANEL */}
      <div style={{
        width: '30%', minWidth: 260, maxWidth: 380,
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', height: '100vh',
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 12 }}>Conversas</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou número..."
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma conversa encontrada.</div>
          ) : filtered.map(s => (
            <div
              key={s.id}
              onClick={() => setSelected(s)}
              style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: selected?.id === s.id ? 'rgba(137,217,87,0.07)' : 'transparent',
                borderLeft: selected?.id === s.id ? '3px solid #89d957' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (selected?.id !== s.id) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={e => { if (selected?.id !== s.id) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                  {displayName(s)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {timeAgo(s.last_message_at)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.last_message
                  ? s.last_message.content.slice(0, 40)
                  : s.whatsapp_number}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0 }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Selecione uma conversa para visualizar</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{displayName(selected)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selected.whatsapp_number}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}
              >×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msgLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '3px solid var(--border)',
                    borderTopColor: '#89d957',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma mensagem ainda nesta conversa.</div>
              ) : messages.map(m => {
                const { align, bg, color, label } = msgStyle(m.type)
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>
                      {label}
                    </div>
                    <div style={{
                      maxWidth: '72%', padding: '8px 12px',
                      borderRadius: align === 'flex-start' ? '2px 12px 12px 12px' : '12px 2px 12px 12px',
                      background: bg,
                      color,
                      fontSize: 13, lineHeight: 1.5,
                    }}>
                      {m.content}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
