import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { useUser } from '../lib/AuthContext'
import { faviconHref } from '../lib/favicons'
import { PauseCircle, PlayCircle } from 'lucide-react'

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

type NormalizedMessage = {
  id: string
  role: 'user' | 'assistant' | 'human'
  content: string
  timestamp: string | null
  source: 'agent_messages' | 'agent_chat_memory'
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

function formatTime(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function mergeMessages(
  agentMsgs: any[],
  memoryMsgs: any[]
): NormalizedMessage[] {
  const fromAgent: NormalizedMessage[] = agentMsgs.map(r => ({
    id: r.id,
    role: r.role as 'user' | 'human',
    content: r.content,
    timestamp: r.created_at,
    source: 'agent_messages',
  }))

  const fromMemory: NormalizedMessage[] = memoryMsgs.map(r => ({
    id: 'memory-' + r.id,
    role: (r.message?.role ?? 'assistant') as 'assistant',
    content: r.message?.content ?? '',
    timestamp: null,
    source: 'agent_chat_memory',
  }))

  // Interleave: each agent message is followed by the corresponding memory message
  const result: NormalizedMessage[] = []
  const maxLen = Math.max(fromAgent.length, fromMemory.length)
  for (let i = 0; i < maxLen; i++) {
    if (fromAgent[i]) result.push(fromAgent[i])
    if (fromMemory[i]) result.push(fromMemory[i])
  }
  return result
}

export default function Conversas() {
  const { user, supabase } = useUser()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SessionItem | null>(null)
  const [messages, setMessages] = useState<NormalizedMessage[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [pausing, setPausing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch sessions
  useEffect(() => {
    fetch('/api/conversas/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d) })
      .finally(() => setLoading(false))
  }, [])

  // Fetch messages from both tables when session selected
  useEffect(() => {
    if (!selected) return
    setMessages([])
    setMsgLoading(true)

    Promise.all([
      supabase
        .from('agent_messages')
        .select('id, role, content, created_at')
        .eq('session_id', selected.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('agent_chat_memory')
        .select('id, session_id, message')
        .eq('session_id', selected.id)
        .order('id', { ascending: true }),
    ]).then(([messagesResult, memoryResult]) => {
      const merged = mergeMessages(
        messagesResult.data ?? [],
        memoryResult.data ?? []
      )
      setMessages(merged)
    }).finally(() => setMsgLoading(false))
  }, [selected?.id])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime — update session list on new messages
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('conversas_sessions')
      .on(
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'agent_messages', filter: `owner_id=eq.${user.id}` },
        (payload: any) => {
          const msg = payload.new
          setSessions(prev => {
            const updated = prev.map(s =>
              s.id === msg.session_id
                ? { ...s, last_message: msg, last_message_at: msg.created_at }
                : s
            )
            return [...updated].sort((a, b) =>
              new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
            )
          })
          // Refresh messages if this session is open
          if (msg.session_id === selected?.id) {
            setMessages(prev => {
              const norm: NormalizedMessage = {
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.created_at,
                source: 'agent_messages',
              }
              if (prev.some(m => m.id === norm.id)) return prev
              return [...prev, norm]
            })
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, selected?.id])

  // Toggle is_paused
  async function togglePause() {
    if (!selected || pausing) return
    const next = !selected.is_paused
    setPausing(true)
    setSelected(s => s ? { ...s, is_paused: next } : s)
    setSessions(prev => prev.map(s => s.id === selected.id ? { ...s, is_paused: next } : s))
    const { error } = await supabase
      .from('agent_sessions')
      .update({ is_paused: next })
      .eq('id', selected.id)
    if (error) {
      setSelected(s => s ? { ...s, is_paused: !next } : s)
      setSessions(prev => prev.map(s => s.id === selected.id ? { ...s, is_paused: !next } : s))
    }
    setPausing(false)
  }

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.whatsapp_name || '').toLowerCase().includes(q) ||
      (s.whatsapp_number || '').includes(q) ||
      (s.clients?.name || '').toLowerCase().includes(q)
    )
  })

  const displayName = (s: SessionItem) => s.whatsapp_name || s.clients?.name || s.whatsapp_number

  function msgStyle(role: string): { align: 'flex-start' | 'flex-end'; bg: string; color: string; label: string } {
    if (role === 'user') return { align: 'flex-start', bg: '#1a1a1a', color: '#ffffff', label: 'Cliente' }
    if (role === 'assistant') return { align: 'flex-end', bg: '#89d957', color: '#000000', label: 'Bia' }
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {s.is_paused && (
                    <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
                      ⏸ pausado
                    </span>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {timeAgo(s.last_message_at)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.last_message
                  ? `${s.last_message.role === 'assistant' ? '🤖 ' : ''}${s.last_message.content}`
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
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={togglePause}
                  disabled={pausing}
                  title={selected.is_paused ? 'Retomar agente' : 'Pausar agente'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)',
                    background: selected.is_paused ? 'rgba(251,191,36,0.1)' : 'var(--surface2)',
                    color: selected.is_paused ? '#fbbf24' : 'var(--text-muted)',
                    fontSize: 12, cursor: pausing ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)', opacity: pausing ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {selected.is_paused
                    ? <><PlayCircle width={14} height={14} /> Retomar</>
                    : <><PauseCircle width={14} height={14} /> Pausar</>
                  }
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}
                >×</button>
              </div>
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
                const { align, bg, color, label } = msgStyle(m.role)
                const time = formatTime(m.timestamp)
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
                      {time && (
                        <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                          {time}
                        </div>
                      )}
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
