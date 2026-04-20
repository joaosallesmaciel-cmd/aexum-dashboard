import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:            { label: 'Rascunho',     color: '#6b7280' },
  generating:       { label: 'Gerando',      color: '#f59e0b' },
  ready_for_review: { label: 'Para revisar', color: '#3b82f6' },
  approved:         { label: 'Aprovado',     color: '#8b5cf6' },
  scheduled:        { label: 'Agendado',     color: '#06b6d4' },
  published:        { label: 'Publicado',    color: '#4ade80' },
  failed:           { label: 'Falhou',       color: '#f87171' },
  archived:         { label: 'Arquivado',    color: '#4b5563' },
}

type Post = {
  id: string
  status: string
  format: string
  brief: { theme?: string }
  scheduled_at: string | null
  published_at: string | null
  created_at: string
  brand_id: string | null
  assets: any
  copy_variants: any[]
}

type Brand = { id: string; name: string }

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }
const surface: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }

export default function PostHistory() {
  const [posts, setPosts] = useState<Post[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBrand, setFilterBrand] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/posts/list').then(r => r.json()),
      fetch('/api/brands').then(r => r.json()),
    ]).then(([p, b]) => {
      setPosts(Array.isArray(p) ? p : [])
      setBrands(Array.isArray(b) ? b : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = posts.filter(p =>
    (!filterStatus || p.status === filterStatus) &&
    (!filterBrand || p.brand_id === filterBrand)
  )

  const brandName = (id: string | null) => brands.find(b => b.id === id)?.name ?? '—'

  const fmt = (iso: string | null) => iso
    ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'

  const selectStyle: React.CSSProperties = {
    ...mono, fontSize: 12, padding: '8px 12px', borderRadius: 6,
    background: 'var(--surface)', border: '1px solid var(--border2)',
    color: 'var(--text)', outline: 'none', cursor: 'pointer',
  }

  return (
    <>
      <Head><title>Histórico de Posts — Aexum</title></Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <Link href="/" style={{ ...mono, fontSize: 12, color: 'var(--text-muted)' }}>← dashboard</Link>
              <Link href="/posts" style={{ ...mono, fontSize: 12, color: 'var(--text-muted)' }}>/ gerador</Link>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Histórico de Posts
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
              {posts.length} {posts.length === 1 ? 'post gerado' : 'posts gerados'}
            </p>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <select style={selectStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select style={selectStyle} value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
              <option value="">Todas as brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Lista */}
          {loading ? (
            <p style={{ ...mono, fontSize: 13, color: 'var(--text-muted)' }}>carregando...</p>
          ) : filtered.length === 0 ? (
            <div style={{ ...surface, padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border2)' }}>
              <p style={{ fontSize: 14 }}>Nenhum post encontrado</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(post => {
                const st = STATUS_LABELS[post.status] ?? { label: post.status, color: '#6b7280' }
                const isOpen = expanded === post.id
                const slideUrls: string[] = (post.assets as any)?.slide_urls ?? []
                const variant = post.copy_variants?.[0]

                return (
                  <div key={post.id} style={{ ...surface, overflow: 'hidden' }}>
                    {/* Row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : post.id)}
                      style={{
                        width: '100%', padding: '16px 20px', background: 'transparent', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                      }}
                    >
                      {/* Status badge */}
                      <span style={{
                        ...mono, fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        background: `${st.color}18`, color: st.color, border: `1px solid ${st.color}40`,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        {st.label}
                      </span>

                      {/* Tema */}
                      <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {post.brief?.theme || '(sem tema)'}
                      </span>

                      {/* Brand */}
                      <span style={{ ...mono, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {brandName(post.brand_id)}
                      </span>

                      {/* Format */}
                      <span style={{ ...mono, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {post.format}
                      </span>

                      {/* Data */}
                      <span style={{ ...mono, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {post.scheduled_at ? `📅 ${fmt(post.scheduled_at)}` : fmt(post.created_at)}
                      </span>

                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {/* Expanded */}
                    {isOpen && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: slideUrls.length ? '1fr 1fr' : '1fr', gap: 16, paddingTop: 16 }}>

                          {/* Slides */}
                          {slideUrls.length > 0 && (
                            <div>
                              <div style={{ ...mono, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Slides</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {slideUrls.map((url, i) => (
                                  <img key={i} src={url} alt={`slide-${i+1}`}
                                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border2)' }} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Copy */}
                          {variant && (
                            <div>
                              <div style={{ ...mono, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Legenda</div>
                              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                                {variant.legenda_feed?.slice(0, 200)}{(variant.legenda_feed?.length ?? 0) > 200 ? '…' : ''}
                              </p>
                              {post.scheduled_at && (
                                <div style={{ marginTop: 12, ...mono, fontSize: 11, color: 'var(--text-muted)' }}>
                                  Agendado para: <span style={{ color: '#06b6d4' }}>{fmt(post.scheduled_at)}</span>
                                </div>
                              )}
                              {post.published_at && (
                                <div style={{ marginTop: 6, ...mono, fontSize: 11, color: '#4ade80' }}>
                                  Publicado em: {fmt(post.published_at)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
