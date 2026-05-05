import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '../lib/AuthContext'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

// ─── Types ───────────────────────────────────────────────────────────────────
type Stage = 'lead' | 'contato' | 'reuniao' | 'proposta' | 'negociacao' | 'fechado' | 'perdido'
type InteractionType = 'nota' | 'call' | 'email' | 'reuniao' | 'whatsapp'

interface Client {
  id: string
  type: 'pf' | 'pj'
  name: string
  document?: string
  email?: string
  phone?: string
  whatsapp?: string
  segment?: string
  origin?: string
  responsible?: string
  contract_value?: number
  stage: Stage
  notes?: string
  created_at: string
  updated_at: string
}

interface Interaction {
  id: string
  client_id: string
  type: InteractionType
  content: string
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGE_ORDER: Stage[] = ['lead', 'contato', 'reuniao', 'proposta', 'negociacao', 'fechado', 'perdido']
const STAGE_LABELS: Record<Stage, string> = {
  lead: 'Lead', contato: 'Contato', reuniao: 'Reunião',
  proposta: 'Proposta', negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido',
}
const STAGE_COLORS: Record<Stage, string> = {
  lead: '#6b7280', contato: '#3b82f6', reuniao: '#8b5cf6',
  proposta: '#f59e0b', negociacao: '#f97316', fechado: '#22c55e', perdido: '#ef4444',
}
const ORIGIN_LABELS: Record<string, string> = {
  indicacao: 'Indicação', instagram: 'Instagram', site: 'Site', evento: 'Evento', outro: 'Outro',
}
const INTERACTION_LABELS: Record<InteractionType, string> = {
  nota: 'Nota', call: 'Call', email: 'Email', reuniao: 'Reunião', whatsapp: 'WhatsApp',
}

const EMPTY_FORM = {
  type: 'pj' as 'pf' | 'pj',
  name: '', document: '', email: '', phone: '', whatsapp: '',
  segment: '', origin: '' as any, responsible: '',
  contract_value: '' as any, stage: 'lead' as Stage, notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v?: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR')
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span style={{
      fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 20,
      background: `${STAGE_COLORS[stage]}20`, color: STAGE_COLORS[stage],
      border: `1px solid ${STAGE_COLORS[stage]}40`,
    }}>
      {STAGE_LABELS[stage]}
    </span>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', span2 = false }: {
  label: string; value: any; onChange: (v: string) => void
  placeholder?: string; type?: string; span2?: boolean
}) {
  return (
    <div style={span2 ? { gridColumn: '1 / -1' } : {}}>
      <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ padding: '14px 16px', borderTop: i > 0 ? '1px solid var(--border)' : undefined, display: 'flex', gap: 16 }}>
          {[200, 60, 100, 80, 80, 70].map((w, j) => (
            <div key={j} style={{ height: 12, width: w, borderRadius: 4, background: 'var(--surface2)', opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nenhum cliente ainda</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Adicione seu primeiro cliente para começar a gerenciar o funil.</p>
      <button onClick={onNew} style={{ background: 'var(--accent)', color: '#0e0e0e', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
        + Novo Cliente
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function fmtDatePT() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function CRM() {
  const { user } = useUser()
  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'usuário'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const [view, setView] = useState<'lista' | 'kanban'>('lista')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all')
  const [showClosed, setShowClosed] = useState(false)
  const [dragClientId, setDragClientId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  // Drawer
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [interactionsLoading, setInteractionsLoading] = useState(false)
  const [newInteraction, setNewInteraction] = useState({ type: 'nota' as InteractionType, content: '' })
  const [addingInteraction, setAddingInteraction] = useState(false)
  const [editStage, setEditStage] = useState<Stage>('lead')
  const [deleting, setDeleting] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ id: number; type: string; content: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/clients', { credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao carregar clientes')
      setClients(await res.json())
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  async function fetchInteractions(clientId: string) {
    setInteractionsLoading(true)
    const res = await fetch(`/api/clients/${clientId}/interactions`, { credentials: 'include' })
    if (res.ok) setInteractions(await res.json())
    setInteractionsLoading(false)
  }

  // ── Drawer open/close ────────────────────────────────────────────────────
  function openDrawer(c: Client) {
    setSelectedClient(c); setEditStage(c.stage)
    setNoteText(c.notes || '')
    setNoteSaved(false)
    setChatMessages([])
    fetchInteractions(c.id)
    if (c.whatsapp) {
      setChatLoading(true)
      const digits = c.whatsapp.replace(/\D/g, '')
      const normalized = digits.startsWith('55') ? digits : `55${digits}`
      fetch(`/api/chat-messages?whatsapp_number=${encodeURIComponent(normalized)}`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => {
          const msgs = (d.messages || []).slice(-5)
          setChatMessages(msgs.map((m: any) => ({
            id: m.id,
            type: m.message?.type ?? '',
            content: m.message?.content ?? '',
          })))
        })
        .finally(() => setChatLoading(false))
    }
  }
  function closeDrawer() { setSelectedClient(null); setInteractions([]); setChatMessages([]) }

  async function saveNote() {
    if (!selectedClient) return
    await fetch(`/api/clients/${selectedClient.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: noteText }),
    })
    setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, notes: noteText } : c))
    setSelectedClient(prev => prev ? { ...prev, notes: noteText } : prev)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  // ── Create ───────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    const body = { ...form, contract_value: form.contract_value ? Number(form.contract_value) : null }
    const res = await fetch('/api/clients', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const newClient = await res.json()
      setClients(prev => [newClient, ...prev])
      setModalOpen(false); setForm({ ...EMPTY_FORM })
    }
    setSaving(false)
  }

  // ── Update stage ─────────────────────────────────────────────────────────
  async function handleUpdateStage() {
    if (!selectedClient) return
    const res = await fetch(`/api/clients/${selectedClient.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: editStage }),
    })
    if (res.ok) {
      const updated = await res.json()
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
      setSelectedClient(updated)
    }
  }

  // ── Drag & drop (kanban) ─────────────────────────────────────────────────
  async function handleDrop(targetStage: Stage) {
    setDragOverStage(null)
    if (!dragClientId) return
    const client = clients.find(c => c.id === dragClientId)
    if (!client || client.stage === targetStage) return
    const res = await fetch(`/api/clients/${dragClientId}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: targetStage }),
    })
    if (res.ok) {
      const updated = await res.json()
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    }
    setDragClientId(null)
  }

  // ── Move to next (kanban) ────────────────────────────────────────────────
  async function moveToNext(client: Client) {
    const idx = STAGE_ORDER.indexOf(client.stage)
    if (idx >= STAGE_ORDER.length - 1) return
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: STAGE_ORDER[idx + 1] }),
    })
    if (res.ok) {
      const updated = await res.json()
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    }
  }

  // ── Add interaction ──────────────────────────────────────────────────────
  async function handleAddInteraction() {
    if (!selectedClient || !newInteraction.content.trim()) return
    setAddingInteraction(true)
    const res = await fetch(`/api/clients/${selectedClient.id}/interactions`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInteraction),
    })
    if (res.ok) {
      const newInteraction = await res.json()
      setInteractions(prev => [newInteraction, ...prev])
      setNewInteraction({ type: 'nota', content: '' })
    }
    setAddingInteraction(false)
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selectedClient) return
    if (!confirm(`Deletar "${selectedClient.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    const res = await fetch(`/api/clients/${selectedClient.id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) { setClients(prev => prev.filter(c => c.id !== selectedClient.id)); closeDrawer() }
    setDeleting(false)
  }

  // ── Filtered ─────────────────────────────────────────────────────────────
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) &&
    (stageFilter === 'all' || c.stage === stageFilter)
  )

  const kanbanStages: Stage[] = showClosed
    ? STAGE_ORDER
    : ['lead', 'contato', 'reuniao', 'proposta', 'negociacao']

  // ── Input style helper ───────────────────────────────────────────────────
  const selectStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 7, padding: '8px 10px', fontSize: 13, color: 'var(--text)',
    fontFamily: 'var(--font-body)',
  }

  return (
    <>
      <Head><title>CRM — Aexum</title><link rel="icon" type="image/svg+xml" href={faviconHref('crm')} /></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
        <Sidebar />

        <main style={{ flex: 1, padding: '48px 48px', minWidth: 0 }}>

          {/* ── Welcome block ── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12,
              padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(137,217,87,0.3)',
              background: 'rgba(137,217,87,0.06)', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#89d957' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#89d957',
                boxShadow: '0 0 0 0 rgba(137,217,87,0.5)',
                animation: 'pulse-dot 1.8s ease infinite', display: 'inline-block' }} />
              ONLINE
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              {fmtDatePT()}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1 }}>
              Olá, {displayName} 👋
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Suas ferramentas de IA prontas para usar.
            </p>
          </div>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>CRM</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                {loading ? '...' : `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {(['lista', 'kanban'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: '7px 16px', fontSize: 12, fontFamily: 'var(--font-mono)',
                    border: 'none', cursor: 'pointer', letterSpacing: '0.04em',
                    background: view === v ? 'var(--surface2)' : 'transparent',
                    color: view === v ? 'var(--text)' : 'var(--text-muted)',
                  }}>{v.toUpperCase()}</button>
                ))}
              </div>
              <button onClick={() => setModalOpen(true)} style={{
                background: 'var(--accent)', color: '#0e0e0e', border: 'none',
                borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}>+ Novo Cliente</button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#1f1010', border: '1px solid #ef4444', borderRadius: 8, padding: '12px 16px', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* ── LISTA ── */}
          {view === 'lista' && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  placeholder="Buscar por nome..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', width: 220, outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['all', ...STAGE_ORDER] as const).map(s => {
                    const active = stageFilter === s
                    const color = s === 'all' ? 'var(--accent)' : STAGE_COLORS[s as Stage]
                    return (
                      <button key={s} onClick={() => setStageFilter(s as any)} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', border: `1px solid ${active ? color : 'var(--border)'}`,
                        background: active ? `${color}18` : 'transparent',
                        color: active ? color : 'var(--text-muted)',
                      }}>
                        {s === 'all' ? 'Todos' : STAGE_LABELS[s as Stage]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {loading ? <SkeletonTable /> : filtered.length === 0 ? <EmptyState onNew={() => setModalOpen(true)} /> : (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Nome', 'Tipo', 'Segmento', 'Stage', 'Valor', 'Data'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em' }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => (
                        <tr key={c.id} onClick={() => openDrawer(c)}
                          style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.name}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border)' }}>{c.type.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.segment || '—'}</td>
                          <td style={{ padding: '12px 16px' }}><StageBadge stage={c.stage} /></td>
                          <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmt(c.contract_value)}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fmtDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── KANBAN ── */}
          {view === 'kanban' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => setShowClosed(v => !v)} style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                  padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                }}>
                  {showClosed ? '◀ Ocultar Fechado/Perdido' : '▶ Mostrar Fechado/Perdido'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
                {kanbanStages.map(stage => {
                  const cols = clients.filter(c => c.stage === stage)
                  const total = cols.reduce((s, c) => s + (c.contract_value || 0), 0)
                  return (
                    <div key={stage} style={{ minWidth: 236, flex: '0 0 236px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', background: 'var(--surface)',
                        border: '1px solid var(--border)', borderBottom: 'none', borderRadius: '8px 8px 0 0',
                      }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[stage], display: 'inline-block' }} />
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{STAGE_LABELS[stage]}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{cols.length}</span>
                        </div>
                        {total > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmt(total)}</span>}
                      </div>
                      <div
                        onDragOver={e => { e.preventDefault(); setDragOverStage(stage) }}
                        onDragLeave={() => setDragOverStage(null)}
                        onDrop={() => handleDrop(stage)}
                        style={{
                          background: dragOverStage === stage ? `${STAGE_COLORS[stage]}15` : 'var(--surface2)',
                          border: `1px solid ${dragOverStage === stage ? STAGE_COLORS[stage] : 'var(--border)'}`,
                          borderRadius: '0 0 8px 8px', padding: 8,
                          display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120,
                          transition: 'background 0.15s, border-color 0.15s',
                        }}>
                        {cols.length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--border)', textAlign: 'center', padding: '24px 0', fontFamily: 'var(--font-mono)' }}>vazio</div>
                        )}
                        {cols.map(c => {
                          const nextIdx = STAGE_ORDER.indexOf(c.stage) + 1
                          const hasNext = nextIdx < STAGE_ORDER.length
                          return (
                            <div key={c.id}
                              draggable
                              onDragStart={() => setDragClientId(c.id)}
                              onDragEnd={() => setDragClientId(null)}
                              onClick={() => openDrawer(c)}
                              style={{
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 8, padding: '10px 12px',
                                cursor: 'grab', opacity: dragClientId === c.id ? 0.5 : 1,
                                transition: 'opacity 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{c.name}</div>
                              {c.segment && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{c.segment}</div>}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                                  {c.contract_value ? <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#89d957' }}>{fmt(c.contract_value)}</span> : null}
                                  {c.origin ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ORIGIN_LABELS[c.origin] || c.origin}</span> : null}
                                </div>
                                {hasNext && (
                                  <button onClick={e => { e.stopPropagation(); moveToNext(c) }}
                                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                                    title={`→ ${STAGE_LABELS[STAGE_ORDER[nextIdx]]}`}>→</button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>

        {/* ── MODAL Novo Cliente ── */}
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setForm({ ...EMPTY_FORM }) } }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, margin: 0 }}>Novo Cliente</h2>
                <button onClick={() => { setModalOpen(false); setForm({ ...EMPTY_FORM }) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>

              {/* Type toggle */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>TIPO</label>
                <div style={{ display: 'flex', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
                  {(['pf', 'pj'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                      padding: '6px 20px', fontSize: 12, fontFamily: 'var(--font-mono)', border: 'none', cursor: 'pointer',
                      background: form.type === t ? 'var(--accent)' : 'transparent',
                      color: form.type === t ? '#0e0e0e' : 'var(--text-muted)',
                      fontWeight: form.type === t ? 700 : 400,
                    }}>{t.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="NOME *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Nome completo" span2 />
                <Field label="EMAIL" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="email@exemplo.com" type="email" />
                <Field label="TELEFONE" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="(11) 9999-9999" />
                <Field label="WHATSAPP" value={form.whatsapp} onChange={v => setForm(f => ({ ...f, whatsapp: v }))} placeholder="(11) 9999-9999" />
                <Field label={form.type === 'pf' ? 'CPF' : 'CNPJ'} value={form.document} onChange={v => setForm(f => ({ ...f, document: v }))} placeholder={form.type === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'} />
                <Field label="SEGMENTO" value={form.segment} onChange={v => setForm(f => ({ ...f, segment: v }))} placeholder="Ex: Saúde, Varejo..." />
                <Field label="RESPONSÁVEL" value={form.responsible} onChange={v => setForm(f => ({ ...f, responsible: v }))} placeholder="Nome do responsável" />
                <Field label="VALOR ESTIMADO (R$)" value={form.contract_value} onChange={v => setForm(f => ({ ...f, contract_value: v }))} placeholder="0,00" type="number" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>ORIGEM</label>
                  <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} style={selectStyle}>
                    <option value="">Selecionar...</option>
                    {Object.entries(ORIGIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>STAGE INICIAL</label>
                  <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))} style={selectStyle}>
                    {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>NOTAS</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Observações..."
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => { setModalOpen(false); setForm({ ...EMPTY_FORM }) }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 20px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving || !form.name.trim()} style={{
                  background: 'var(--accent)', color: '#0e0e0e', border: 'none',
                  borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700,
                  cursor: saving ? 'wait' : 'pointer', opacity: saving || !form.name.trim() ? 0.6 : 1,
                  fontFamily: 'var(--font-display)',
                }}>
                  {saving ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DRAWER Detalhe ── */}
        {selectedClient && (
          <>
            <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} />
            <aside style={{
              position: 'fixed', right: 0, top: 0, bottom: 0, width: 420,
              background: 'var(--surface)', borderLeft: '1px solid var(--border)',
              zIndex: 91, overflowY: 'auto', display: 'flex', flexDirection: 'column',
            }}>
              {/* Header */}
              <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{selectedClient.name}</h2>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <StageBadge stage={selectedClient.stage} />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '2px 6px', background: 'var(--surface2)', borderRadius: 4, border: '1px solid var(--border)' }}>
                      {selectedClient.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22 }}>×</button>
              </div>

              <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Info */}
                <section>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>INFORMAÇÕES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Email', value: selectedClient.email },
                      { label: 'Telefone', value: selectedClient.phone },
                      { label: 'WhatsApp', value: selectedClient.whatsapp },
                      { label: 'Documento', value: selectedClient.document },
                      { label: 'Segmento', value: selectedClient.segment },
                      { label: 'Origem', value: selectedClient.origin ? (ORIGIN_LABELS[selectedClient.origin] || selectedClient.origin) : undefined },
                      { label: 'Responsável', value: selectedClient.responsible },
                      { label: 'Valor', value: selectedClient.contract_value ? fmt(selectedClient.contract_value) : undefined },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: 90 }}>{label}:</span>
                        <span style={{ fontSize: 13, color: value ? 'var(--text)' : 'var(--text-muted)' }}>{value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Notas */}
                <section>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>NOTAS</div>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={4}
                    placeholder="Observações sobre este cliente..."
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }}
                  />
                  <button onClick={saveNote} style={{
                    background: noteSaved ? 'rgba(137,217,87,0.15)' : '#89d957',
                    color: noteSaved ? '#89d957' : '#000',
                    border: noteSaved ? '1px solid #89d957' : 'none',
                    borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>
                    {noteSaved ? 'Salvo! ✓' : 'Salvar nota'}
                  </button>
                </section>

                {/* Conversas */}
                {selectedClient.whatsapp && (
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>CONVERSAS RECENTES</div>
                      <Link href="/conversas" style={{ fontSize: 11, color: '#89d957', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                        Ver completo →
                      </Link>
                    </div>
                    {chatLoading ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Carregando...</div>
                    ) : chatMessages.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Nenhuma mensagem encontrada.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {chatMessages.map(m => {
                          const isAi = m.type === 'ai'
                          const rawContent = typeof m.content === 'string' ? m.content : ''
                          return (
                            <div key={m.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
                              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isAi ? '#89d957' : 'var(--text-muted)', marginBottom: 3 }}>
                                {isAi ? 'Bia' : 'Cliente'}
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>
                                {rawContent.length > 80 ? rawContent.substring(0, 80) + '…' : rawContent}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* Move stage */}
                <section style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>MOVER ETAPA</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={editStage} onChange={e => setEditStage(e.target.value as Stage)}
                      style={{ ...selectStyle, background: 'var(--surface)', flex: 1 }}>
                      {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                    </select>
                    <button onClick={handleUpdateStage} disabled={editStage === selectedClient.stage} style={{
                      background: 'var(--accent)', color: '#0e0e0e', border: 'none',
                      borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                      cursor: editStage === selectedClient.stage ? 'default' : 'pointer',
                      opacity: editStage === selectedClient.stage ? 0.5 : 1,
                    }}>Mover</button>
                  </div>
                </section>

                {/* Interactions */}
                <section>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>INTERAÇÕES</div>

                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <select value={newInteraction.type} onChange={e => setNewInteraction(i => ({ ...i, type: e.target.value as InteractionType }))}
                        style={{ ...selectStyle, background: 'var(--surface)', width: 'auto', fontSize: 12 }}>
                        {Object.entries(INTERACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <textarea value={newInteraction.content} onChange={e => setNewInteraction(i => ({ ...i, content: e.target.value }))}
                      placeholder="Descreva a interação..." rows={2}
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                    <button onClick={handleAddInteraction} disabled={addingInteraction || !newInteraction.content.trim()} style={{
                      background: 'var(--accent)', color: '#0e0e0e', border: 'none',
                      borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', opacity: addingInteraction || !newInteraction.content.trim() ? 0.6 : 1,
                    }}>{addingInteraction ? 'Adicionando...' : '+ Adicionar'}</button>
                  </div>

                  {interactionsLoading ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Carregando...</div>
                  ) : interactions.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '16px 0' }}>Nenhuma interação ainda</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {interactions.map(i => (
                        <div key={i.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                              {INTERACTION_LABELS[i.type]}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtDate(i.created_at)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{i.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Delete */}
                <section style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <button onClick={handleDelete} disabled={deleting} style={{
                    background: 'none', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6,
                    padding: '5px 12px', fontSize: 11, color: 'rgba(239,68,68,0.7)',
                    cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    opacity: deleting ? 0.6 : 1,
                  }}>{deleting ? 'deletando...' : 'deletar cliente'}</button>
                </section>
              </div>
            </aside>
          </>
        )}
      </div>
    <style>{`
      @keyframes pulse-dot {
        0%,100%{box-shadow:0 0 0 0 rgba(137,217,87,0.5)}
        50%{box-shadow:0 0 0 6px rgba(137,217,87,0)}
      }
    `}</style>
    </>
  )
}
