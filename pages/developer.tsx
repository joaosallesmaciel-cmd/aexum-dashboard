import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

type Tab = 'keys' | 'webhooks' | 'playground' | 'logs' | 'docs'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  permissions: string[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
  description: string | null
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  failure_count: number
  created_at: string
}

interface Log {
  id: string
  endpoint: string
  method: string
  status_code: number
  input_tokens: number
  output_tokens: number
  latency_ms: number
  error_message: string | null
  created_at: string
}

interface LogSummary {
  totalRequests: number
  successCount: number
  totalTokens: number
  avgLatency: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  usage?: { input_tokens: number; output_tokens: number; latency_ms: number }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer' }}
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div style={{ background: '#0d1117', borderRadius: 8, padding: 16, marginBottom: 12, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 8, right: 8 }}><CopyButton text={code} /></div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>{lang}</div>
      <pre style={{ margin: 0, fontSize: 12, color: '#e6edf3', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{code}</pre>
    </div>
  )
}

// ── API KEYS TAB ──────────────────────────────────────────────
function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/developer/keys', { credentials: 'include' })
    const data = await res.json()
    setKeys(data.keys || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createKey() {
    if (!name.trim()) return
    setCreating(true)
    const res = await fetch('/api/developer/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, description: desc })
    })
    const data = await res.json()
    if (data.key) { setNewKey(data.key); load() }
    setCreating(false)
  }

  async function revokeKey(id: string) {
    await fetch(`/api/developer/keys/${id}`, { method: 'DELETE', credentials: 'include' })
    setRevokeConfirm(null)
    load()
  }

  const activeCount = keys.filter(k => k.is_active).length

  return (
    <div>
      {/* Aviso */}
      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#f59e0b' }}>
        ⚠️ Sua chave é exibida apenas uma vez. Guarde-a em um local seguro imediatamente após a criação.
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{activeCount} de 5 chaves ativas</span>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          + Nova chave
        </button>
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'Prefixo', 'Status', 'Último uso', 'Criada em', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma chave criada ainda.</td></tr>
            ) : keys.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{k.name}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{k.key_prefix || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 20, background: k.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)', color: k.is_active ? '#22c55e' : '#6b7280' }}>
                    {k.is_active ? 'Ativa' : 'Revogada'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{k.last_used_at ? formatDate(k.last_used_at) : 'Nunca'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatDate(k.created_at)}</td>
                <td style={{ padding: '12px 16px' }}>
                  {k.is_active && (revokeConfirm === k.id ? (
                    <span style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => revokeKey(k.id)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
                      <button onClick={() => setRevokeConfirm(null)} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                    </span>
                  ) : (
                    <button onClick={() => setRevokeConfirm(k.id)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Revogar</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal criar */}
      {showModal && (
        <>
          <div onClick={() => { setShowModal(false); setNewKey(null); setName(''); setDesc('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: 480, zIndex: 50 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Nova API Key</h3>
            {newKey ? (
              <>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8, fontWeight: 600 }}>✓ Chave criada — copie agora, não será exibida novamente</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ fontSize: 12, flex: 1, wordBreak: 'break-all', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{newKey}</code>
                    <CopyButton text={newKey} />
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); setNewKey(null); setName(''); setDesc('') }}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500 }}>
                  Fechar
                </button>
              </>
            ) : (
              <>
                <input placeholder="Nome da chave (ex: Produção)" value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                <input placeholder="Descrição (opcional)" value={desc} onChange={e => setDesc(e.target.value)}
                  style={{ width: '100%', marginBottom: 20, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={createKey} disabled={creating || !name.trim()}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'Criando...' : 'Criar chave'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── WEBHOOKS TAB ──────────────────────────────────────────────
function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState(['handoff', 'new_lead', 'message_received'])
  const [creating, setCreating] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/developer/webhooks', { credentials: 'include' })
    const data = await res.json()
    setWebhooks(data.webhooks || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createWebhook() {
    if (!name.trim() || !url.trim()) return
    setCreating(true)
    const res = await fetch('/api/developer/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, url, events })
    })
    const data = await res.json()
    if (data.secret) { setNewSecret(data.secret); load() }
    setCreating(false)
  }

  function toggleEvent(e: string) {
    setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }

  const EVENT_LABELS: Record<string, string> = { handoff: 'Handoff', new_lead: 'Novo Lead', message_received: 'Mensagem recebida' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowModal(true)}
          style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          + Adicionar webhook
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'URL', 'Eventos', 'Status', 'Última entrega', 'Falhas'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</td></tr>
            ) : webhooks.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum webhook configurado.</td></tr>
            ) : webhooks.map(wh => (
              <tr key={wh.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{wh.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wh.url}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {wh.events.map(e => (
                      <span key={e} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{e}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 20, background: wh.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)', color: wh.is_active ? '#22c55e' : '#6b7280' }}>
                    {wh.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{wh.last_triggered_at ? formatDate(wh.last_triggered_at) : 'Nunca'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: wh.failure_count > 0 ? '#ef4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{wh.failure_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Instrução assinatura */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Verificação de assinatura</div>
        Verifique o header <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>X-Aexum-Signature</code> em cada entrega usando HMAC-SHA256 com o seu webhook secret.
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div onClick={() => { setShowModal(false); setNewSecret(null); setName(''); setUrl('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: 480, zIndex: 50 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Novo Webhook</h3>
            {newSecret ? (
              <>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8, fontWeight: 600 }}>✓ Secret gerado — copie agora</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code style={{ fontSize: 12, flex: 1, wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>{newSecret}</code>
                    <CopyButton text={newSecret} />
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); setNewSecret(null); setName(''); setUrl('') }}
                  style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 500 }}>
                  Fechar
                </button>
              </>
            ) : (
              <>
                <input placeholder="Nome (ex: Notificação de handoff)" value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                <input placeholder="URL de destino (https://...)" value={url} onChange={e => setUrl(e.target.value)}
                  style={{ width: '100%', marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Eventos</div>
                  {['handoff', 'new_lead', 'message_received'].map(e => (
                    <label key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} />
                      {EVENT_LABELS[e]}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={createWebhook} disabled={creating}
                    style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'Criando...' : 'Criar webhook'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── PLAYGROUND TAB ────────────────────────────────────────────
function PlaygroundTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim() || sending) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setSending(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const res = await fetch('/api/developer/playground', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: userMsg, history })
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error, usage: data.usage }])
    setSending(false)
  }

  return (
    <div>
      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#60a5fa' }}>
        ℹ️ Este playground usa a configuração atual do seu agente. Alterações nas configurações são refletidas imediatamente.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button onClick={() => setMessages([])} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          Limpar conversa
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 420, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Envie uma mensagem para testar seu agente
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'assistant' ? 'flex-start' : 'flex-end' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px', borderRadius: m.role === 'assistant' ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                background: m.role === 'assistant' ? 'var(--surface2)' : 'rgba(141,198,63,0.15)',
                fontSize: 13, lineHeight: 1.5, color: 'var(--text)'
              }}>
                {m.content}
              </div>
              {m.usage && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {m.usage.input_tokens} in · {m.usage.output_tokens} out · {m.usage.latency_ms}ms
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: 'var(--surface2)', fontSize: 13, color: 'var(--text-muted)' }}>...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Digite uma mensagem..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
          />
          <button onClick={send} disabled={sending || !input.trim()}
            style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── LOGS TAB ──────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState<Log[]>([])
  const [summary, setSummary] = useState<LogSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/developer/logs?days=${days}&limit=50`, { credentials: 'include' })
    const data = await res.json()
    setLogs(data.logs || [])
    setSummary(data.summary || null)
    setLoading(false)
  }

  useEffect(() => { load() }, [days])

  return (
    <div>
      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total de requests', value: summary.totalRequests },
            { label: 'Taxa de sucesso', value: summary.totalRequests ? `${Math.round(summary.successCount / summary.totalRequests * 100)}%` : '—' },
            { label: 'Total de tokens', value: summary.totalTokens.toLocaleString('pt-BR') },
            { label: 'Latência média', value: `${summary.avgLatency}ms` },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtro + refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <select value={days} onChange={e => setDays(Number(e.target.value))}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
          <option value={7}>Últimos 7 dias</option>
          <option value={14}>Últimos 14 dias</option>
          <option value={30}>Últimos 30 dias</option>
        </select>
        <button onClick={load} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
          Atualizar
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Horário', 'Endpoint', 'Método', 'Status', 'Tokens', 'Latência'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum log ainda.</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{formatDate(l.created_at)}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.endpoint}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.method}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 20, background: l.status_code < 400 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: l.status_code < 400 ? '#22c55e' : '#ef4444' }}>
                    {l.status_code}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{(l.input_tokens || 0) + (l.output_tokens || 0)}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{l.latency_ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── DOCS TAB ──────────────────────────────────────────────────
function DocsTab() {
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python'>('curl')

  const codeExamples = {
    curl: `curl -X POST https://aexum.com.br/api/v1/messages \\
  -H "x-api-key: SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "5511999999999", "message": "Olá, tudo bem?"}'`,
    js: `const response = await fetch('https://aexum.com.br/api/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': 'SUA_CHAVE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ phone: '5511999999999', message: 'Olá, tudo bem?' })
})
const data = await response.json()`,
    python: `import requests

response = requests.post(
  'https://aexum.com.br/api/v1/messages',
  headers={'x-api-key': 'SUA_CHAVE'},
  json={'phone': '5511999999999', 'message': 'Olá, tudo bem?'}
)`
  }

  const verifyCode = `const crypto = require('crypto')

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}`

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  )

  return (
    <div style={{ maxWidth: 720 }}>
      {section('Autenticação', (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Todas as requisições precisam do header:</p>
          <CodeBlock code="x-api-key: aexum_live_..." lang="Header" />
        </div>
      ))}

      {section('Enviar mensagem via API', (
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4 }}>POST https://aexum.com.br/api/v1/messages</code>
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['curl', 'js', 'python'] as const).map(l => (
              <button key={l} onClick={() => setCodeLang(l)}
                style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: codeLang === l ? 'var(--accent)' : 'var(--surface2)', color: codeLang === l ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: codeLang === l ? 600 : 400 }}>
                {l === 'curl' ? 'cURL' : l === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
          <CodeBlock code={codeExamples[codeLang]} lang={codeLang === 'curl' ? 'Shell' : codeLang === 'js' ? 'JavaScript' : 'Python'} />
        </div>
      ))}

      {section('Eventos de Webhook', (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Evento', 'Quando dispara', 'Payload'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { event: 'handoff', when: 'Agente transfere para humano', payload: '{"session_id":"...","phone":"..."}' },
                { event: 'new_lead', when: 'Novo lead registrado no CRM', payload: '{"client_id":"...","name":"..."}' },
                { event: 'message_received', when: 'A cada mensagem recebida', payload: '{"phone":"...","text":"..."}' },
              ].map(r => (
                <tr key={r.event} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.event}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{r.when}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{r.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {section('Verificar assinatura do webhook', (
        <CodeBlock code={verifyCode} lang="JavaScript" />
      ))}

      {section('Códigos de erro', (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {[
                { code: '400', desc: 'Dados inválidos ou faltando' },
                { code: '401', desc: 'API key inválida ou revogada' },
                { code: '429', desc: 'Rate limit atingido (100 req/min)' },
                { code: '500', desc: 'Erro interno — contato: suporte@aexum.com.br' },
              ].map(r => (
                <tr key={r.code} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ef4444', width: 60 }}>{r.code}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function DeveloperPage() {
  const [tab, setTab] = useState<Tab>('keys')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'keys', label: '🔑 API Keys' },
    { id: 'webhooks', label: '🔗 Webhooks' },
    { id: 'playground', label: '▶ Playground' },
    { id: 'logs', label: '📋 Logs' },
    { id: 'docs', label: '📖 Docs' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Head>
        <title>Developer — Aexum</title>
        <link rel="icon" type="image/svg+xml" href={faviconHref('dashboard')} />
      </Head>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '48px 48px' }}>
        <div style={{ maxWidth: 900 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>Área do Desenvolvedor</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Integre o Aexum Agent nos seus sistemas via API</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 16px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                  background: tab === t.id ? 'var(--surface)' : 'transparent',
                  color: tab === t.id ? 'var(--text)' : 'var(--text-muted)',
                  borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'keys' && <ApiKeysTab />}
          {tab === 'webhooks' && <WebhooksTab />}
          {tab === 'playground' && <PlaygroundTab />}
          {tab === 'logs' && <LogsTab />}
          {tab === 'docs' && <DocsTab />}
        </div>
      </main>
    </div>
  )
}
