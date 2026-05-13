import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

const OWNER_ID = '0dcc91a3-2b19-4189-98f2-444af7fc2c18'

interface KnowledgeDocument {
  id: string
  name: string
  source_type: string
  status: 'processing' | 'ready' | 'error'
  chunk_count: number
  created_at: string
}

interface SearchResult {
  id: string
  content: string
  contextualized_content: string
  source_name: string
  similarity: number
}

const STATUS_COLORS = {
  ready: '#22c55e',
  processing: '#f59e0b',
  error: '#ef4444',
}

const STATUS_LABELS = {
  ready: 'Pronto',
  processing: 'Processando',
  error: 'Erro',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualText, setManualText] = useState('')
  const [manualName, setManualName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  async function loadDocs() {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_documents?owner_id=eq.${OWNER_ID}&order=created_at.desc`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const data = await res.json()
    setDocs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadDocs() }, [])

  async function ingestDocument(name: string, content: string, source_type: string) {
    // 1. Criar registro no banco
    const res = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_documents`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ owner_id: OWNER_ID, name, source_type, status: 'processing', raw_content: content })
      }
    )
    const [doc] = await res.json()

    // 2. Chamar API de ingestão em background
    fetch('/api/rag/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_id: OWNER_ID, document_id: doc.id, name, content })
    })

    return doc
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    try {
      const content = await file.text()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt'
      const source_type = ['pdf', 'docx', 'txt'].includes(ext) ? ext : 'txt'
      await ingestDocument(file.name, content, source_type)
      await loadDocs()
    } finally {
      setUploading(false)
    }
  }

  async function handleManualAdd() {
    if (!manualText.trim() || !manualName.trim()) return
    setUploading(true)
    try {
      await ingestDocument(manualName, manualText, 'manual')
      setManualText('')
      setManualName('')
      setShowManual(false)
      await loadDocs()
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(
      `${supabaseUrl}/rest/v1/knowledge_documents?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      }
    )
    setDeleteConfirm(null)
    await loadDocs()
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, owner_id: OWNER_ID, match_count: 5, threshold: 0.5 })
      })
      const data = await res.json()
      setSearchResults(data.results || [])
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Head>
        <title>Conhecimento — Aexum</title>
        <link rel="icon" type="image/svg+xml" href={faviconHref('dashboard')} />
      </Head>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '48px 48px' }}>
        <div style={{ maxWidth: 900 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>Base de Conhecimento</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Documentos que treinam o seu agente de atendimento</p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? 'Processando...' : '+ Adicionar documento'}
            </button>
            <button
              onClick={() => setShowManual(!showManual)}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontWeight: 500, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              Adicionar texto
            </button>
            <input ref={fileRef} type="file" accept=".txt,.pdf,.docx" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
          </div>

          {/* Manual input */}
          {showManual && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <input
                placeholder="Nome do documento (ex: FAQ Preços)"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }}
              />
              <textarea
                placeholder="Cole aqui o texto, FAQ, cardápio, protocolo..."
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                rows={6}
                style={{ width: '100%', marginBottom: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
              <button onClick={handleManualAdd} disabled={uploading}
                style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Salvar e processar
              </button>
            </div>
          )}

          {/* Docs list */}
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Documentos</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 48 }}>
            {loading ? (
              <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
            ) : docs.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Nenhum documento ainda. Adicione um arquivo ou texto acima.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Nome', 'Tipo', 'Status', 'Chunks', 'Data', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{doc.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 20 }}>
                          {doc.source_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                          background: STATUS_COLORS[doc.status] + '22',
                          color: STATUS_COLORS[doc.status],
                          padding: '2px 8px', borderRadius: 20
                        }}>
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{doc.chunk_count}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{formatDate(doc.created_at)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {deleteConfirm === doc.id ? (
                          <span style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleDelete(doc.id)}
                              style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
                            <button onClick={() => setDeleteConfirm(null)}
                              style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                          </span>
                        ) : (
                          <button onClick={() => setDeleteConfirm(doc.id)}
                            style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Deletar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Search test */}
          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Testar base de conhecimento</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 0, marginBottom: 16 }}>Digite uma pergunta como seu cliente faria para ver quais trechos seriam injetados no agente.</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input
                placeholder="Ex: Qual o preço do plano básico?"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
              />
              <button onClick={handleSearch} disabled={searching}
                style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--surface2)', color: 'var(--text)', fontWeight: 500, fontSize: 13, border: '1px solid var(--border)', cursor: 'pointer' }}>
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {searchResults.map((r, i) => (
                  <div key={r.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Trecho {i + 1} — {r.source_name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#22c55e', fontWeight: 600 }}>
                        {(r.similarity * 100).toFixed(0)}% relevante
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{r.contextualized_content}</p>
                  </div>
                ))}
              </div>
            )}
            {searchResults.length === 0 && searchQuery && !searching && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum trecho relevante encontrado. Tente adicionar documentos ou ajustar a pergunta.</div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
