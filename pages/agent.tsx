import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

type Stage = 'new' | 'qualifying' | 'presenting' | 'scheduling' | 'followup' | 'converted' | 'lost'

interface Session {
  id: string
  whatsapp_number: string
  whatsapp_name: string | null
  stage: Stage
  last_message_at: string
  created_at: string
  client_id: string | null
  clients: { id: string; name: string } | null
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const STAGE_LABELS: Record<Stage, string> = {
  new: 'Novo',
  qualifying: 'Qualificando',
  presenting: 'Apresentando',
  scheduling: 'Agendando',
  followup: 'Follow-up',
  converted: 'Convertido',
  lost: 'Perdido',
}

const STAGE_COLORS: Record<Stage, string> = {
  new: '#6b7280',
  qualifying: '#3b82f6',
  presenting: '#8b5cf6',
  scheduling: '#f59e0b',
  followup: '#f97316',
  converted: '#22c55e',
  lost: '#ef4444',
}

function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
      background: STAGE_COLORS[stage] + '22',
      color: STAGE_COLORS[stage],
    }}>
      {STAGE_LABELS[stage]}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {[180, 100, 260, 80].map((w, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, width: w, borderRadius: 4, background: 'var(--surface2)', animation: 'pulse 1.5s ease infinite' }} />
        </td>
      ))}
    </tr>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AgentPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agentActive, setAgentActive] = useState(false)

  const [selected, setSelected] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgLoading, setMsgLoading] = useState(false)

  useEffect(() => {
    fetch('/api/agent/config', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d) setAgentActive(d.is_active) })

    fetch('/api/agent/sessions', { credentials: 'include' })
      .then(r => { if (!r.ok) throw new Error('Erro ao carregar'); return r.json() })
      .then(setSessions)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function openSession(session: Session) {
    setSelected(session)
    setMessages([])
    setMsgLoading(true)
    fetch(`/api/agent/sessions/${session.id}/messages`, { credentials: 'include' })
      .then(r => r.json())
      .then(setMessages)
      .finally(() => setMsgLoading(false))
  }

  const todayStr = new Date().toDateString()
  const leadsToday = sessions.filter(s => new Date(s.created_at).toDateString() === todayStr).length
  const converted = sessions.filter(s => s.stage === 'converted').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Head>
        <title>Agente — Aexum</title>
        <link rel="icon" type="image/svg+xml" href={faviconHref('dashboard')} />
      </Head>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '48px 48px' }}>
        <div style={{ maxWidth: 900 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1 }}>
                Agente
              </h1>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 11,
                fontFamily: 'var(--font-mono)', fontWeight: 600,
                background: agentActive ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                color: agentActive ? '#22c55e' : '#6b7280',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {agentActive ? 'ATIVO' : 'INATIVO'}
              </span>
            </div>
            <Link href="/settings" style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
              background: 'var(--surface)', fontWeight: 500,
            }}>
              Configurar →
            </Link>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
            {[
              { label: 'Total de conversas', value: loading ? '—' : sessions.length },
              { label: 'Leads capturados hoje', value: loading ? '—' : leadsToday },
              { label: 'Reuniões agendadas', value: loading ? '—' : converted },
            ].map(card => (
              <div key={card.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '20px 24px',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Sessions table */}
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Conversas recentes</div>

          {error ? (
            <div style={{ padding: 24, color: '#f87171', fontSize: 13 }}>{error}</div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nome / Número', 'Stage', 'Última mensagem', 'Data'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        Nenhuma conversa ainda — ative o agente nas{' '}
                        <Link href="/settings" style={{ color: 'var(--accent)' }}>configurações</Link>
                      </td>
                    </tr>
                  ) : sessions.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => openSession(s)}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{s.whatsapp_name || '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.whatsapp_number}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}><StageBadge stage={s.stage} /></td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {formatDate(s.last_message_at)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        {formatDate(s.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Drawer */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', zIndex: 50,
          }}>
            {/* Drawer header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.whatsapp_name || selected.whatsapp_number}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{selected.whatsapp_number}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
            </div>

            {/* Stage + CRM link */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <StageBadge stage={selected.stage} />
              {selected.client_id && (
                <Link href="/crm" style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 'auto' }}>Ver no CRM →</Link>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgLoading ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma mensagem nesta conversa.</div>
              ) : messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'assistant' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '8px 12px', borderRadius: m.role === 'assistant' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role === 'assistant' ? 'rgba(141,198,63,0.15)' : 'var(--surface2)',
                    color: 'var(--text)', fontSize: 13, lineHeight: 1.5,
                  }}>
                    {m.content}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                      {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
