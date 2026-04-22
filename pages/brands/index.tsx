import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import type { Brand } from '../../lib/brands/actions'
import Sidebar from '../../components/Sidebar'

const GRAPHIC_STYLES = ['minimalista', 'moderno', 'bold', 'elegante', 'divertido', 'corporativo']
const TONES = ['profissional', 'descontraído', 'inspirador', 'educativo', 'provocativo', 'empático']

const emptyForm = {
  name: '',
  niche: '',
  target_audience: '',
  tone_of_voice: 'profissional',
  visual: {
    palette: { primary: '#161616', secondary: '#c8f060', accent: '#f0c060', text: '#f0ece4' },
    typography: { display: '', body: '' },
    graphic_style: 'minimalista',
    recurring_elements: '',
  },
  content_strategy: {
    pillars: ['', '', ''],
    banned_words: '',
    preferred_hashtags: '',
    cta_style: '',
  },
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { fetchBrands() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleUpload(brand_id: string, file: File) {
    if (file.size > 5 * 1024 * 1024) { showToast('Arquivo muito grande (máx 5MB)'); return }
    setUploading(u => ({ ...u, [brand_id]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/brands/${brand_id}/upload-reference`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error)
      await fetchBrands()
      showToast('Imagem adicionada ✓')
    } catch (e: any) {
      showToast(`Erro: ${e.message}`)
    } finally {
      setUploading(u => ({ ...u, [brand_id]: false }))
    }
  }

  async function handleAnalyze(brand_id: string) {
    setAnalyzing(a => ({ ...a, [brand_id]: true }))
    try {
      const res = await fetch(`/api/brands/${brand_id}/analyze-references`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast('Estilo analisado ✓')
    } catch (e: any) {
      showToast(`Erro: ${e.message}`)
    } finally {
      setAnalyzing(a => ({ ...a, [brand_id]: false }))
    }
  }

  async function fetchBrands() {
    setLoading(true)
    const res = await fetch('/api/brands')
    const data = await res.json()
    setBrands(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Nome da brand é obrigatório.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        niche: form.niche || null,
        target_audience: form.target_audience || null,
        tone_of_voice: form.tone_of_voice,
        visual: {
          ...form.visual,
          typography: {
            display: form.visual.typography.display || null,
            body: form.visual.typography.body || null,
          },
        },
        content_strategy: {
          pillars: form.content_strategy.pillars.filter(p => p.trim() !== ''),
          banned_words: form.content_strategy.banned_words.split(',').map(w => w.trim()).filter(Boolean),
          preferred_hashtags: form.content_strategy.preferred_hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean),
          cta_style: form.content_strategy.cta_style || null,
        },
      }

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) { const err = await res.json(); throw new Error(err.error) }

      await fetchBrands()
      setShowForm(false)
      setForm(emptyForm)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function updatePalette(key: string, value: string) {
    setForm(f => ({ ...f, visual: { ...f.visual, palette: { ...f.visual.palette, [key]: value } } }))
  }

  function updatePillar(i: number, value: string) {
    const pillars = [...form.content_strategy.pillars]
    pillars[i] = value
    setForm(f => ({ ...f, content_strategy: { ...f.content_strategy, pillars } }))
  }

  return (
    <>
      <Head><title>Brands — Aexum</title></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, padding: '48px 48px' }}>
        <div style={{ maxWidth: 960, margin: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  Brands
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '6px 0 0' }}>
                  {brands.length} {brands.length === 1 ? 'identidade cadastrada' : 'identidades cadastradas'}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(true); setError('') }}
                style={{
                  background: 'var(--accent)', color: '#0e0e0e', border: 'none',
                  borderRadius: 6, padding: '10px 20px', fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  letterSpacing: '0.01em',
                }}
              >
                + Nova Brand
              </button>
            </div>
          </div>

          {/* Grid de brands */}
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>carregando...</p>
          ) : brands.length === 0 ? (
            <div style={{
              border: '1px dashed var(--border2)', borderRadius: 10,
              padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.5 }}>◈</div>
              <p style={{ fontSize: 15, marginBottom: 6, color: 'var(--text-dim)' }}>Nenhuma brand cadastrada</p>
              <p style={{ fontSize: 13 }}>Clique em "Nova Brand" para começar</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {brands.map(brand => (
                <div key={brand.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 24,
                  transition: 'border-color 0.15s',
                }}>
                  {/* Paleta */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {Object.values(brand.visual?.palette ?? {}).map((color, i) => (
                      <div key={i} style={{
                        width: 18, height: 18, borderRadius: 4,
                        background: color as string, border: '1px solid var(--border2)',
                      }} />
                    ))}
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                    {brand.name}
                  </h3>
                  {brand.niche && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 14px' }}>{brand.niche}</p>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {brand.visual?.graphic_style && (
                      <span style={{
                        background: 'var(--surface2)', color: 'var(--text-dim)',
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {brand.visual.graphic_style}
                      </span>
                    )}
                    {brand.tone_of_voice && (
                      <span style={{
                        background: 'var(--surface2)', color: 'var(--text-dim)',
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {brand.tone_of_voice}
                      </span>
                    )}
                  </div>

                  {/* Referências Visuais */}
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      Referências Visuais
                    </div>

                    {/* Thumbnails */}
                    {((brand as any).assets?.reference_images ?? []).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {((brand as any).assets.reference_images as string[]).map((url: string, i: number) => (
                          <img key={i} src={url} alt={`ref-${i}`}
                            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border2)' }} />
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{
                        fontSize: 12, padding: '6px 12px', borderRadius: 6,
                        border: '1px solid var(--border2)', color: 'var(--text-muted)',
                        cursor: uploading[brand.id] ? 'wait' : 'pointer',
                        fontFamily: 'var(--font-mono)', background: 'var(--surface2)',
                        whiteSpace: 'nowrap',
                      }}>
                        {uploading[brand.id] ? 'Enviando…' : '＋ Adicionar referência'}
                        <input
                          type="file" accept="image/png,image/jpeg,image/webp"
                          style={{ display: 'none' }}
                          disabled={uploading[brand.id]}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(brand.id, f); e.target.value = '' }}
                        />
                      </label>

                      {((brand as any).assets?.reference_images ?? []).length > 0 && (
                        <button
                          onClick={() => handleAnalyze(brand.id)}
                          disabled={analyzing[brand.id]}
                          style={{
                            fontSize: 12, padding: '6px 12px', borderRadius: 6,
                            border: '1px solid var(--border2)', color: 'var(--text-muted)',
                            cursor: analyzing[brand.id] ? 'wait' : 'pointer',
                            fontFamily: 'var(--font-mono)', background: 'var(--surface2)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {analyzing[brand.id] ? 'Analisando…' : '🔍 Analisar estilo'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: '#1a2e1a', border: '1px solid #4ade80', color: '#4ade80',
          borderRadius: 8, padding: '10px 16px', fontSize: 13,
          fontFamily: 'var(--font-mono)',
        }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 100, overflowY: 'auto', padding: '48px 16px',
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 32, width: '100%', maxWidth: 560,
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: '0 0 28px', letterSpacing: '-0.02em' }}>
              Nova Brand
            </h2>

            {/* Identidade */}
            <SectionLabel>Identidade</SectionLabel>

            <FieldLabel>Nome da marca *</FieldLabel>
            <input
              style={inputStyle} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Aexum, Studio Bela, Dr. Paulo"
            />

            <FieldLabel>Nicho / Segmento</FieldLabel>
            <input
              style={inputStyle} value={form.niche}
              onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
              placeholder="Ex: Tecnologia B2B, Clínica estética"
            />

            <FieldLabel>Público-alvo</FieldLabel>
            <input
              style={inputStyle} value={form.target_audience}
              onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
              placeholder="Ex: Empreendedores 30–45 anos"
            />

            <FieldLabel>Tom de voz</FieldLabel>
            <select style={inputStyle} value={form.tone_of_voice} onChange={e => setForm(f => ({ ...f, tone_of_voice: e.target.value }))}>
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Visual */}
            <SectionLabel>Visual</SectionLabel>

            <FieldLabel>Paleta de cores</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {(['primary', 'secondary', 'accent', 'text'] as const).map((key, i) => {
                const labels = ['Primária', 'Secundária', 'Destaque', 'Texto']
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg)', borderRadius: 8, padding: '8px 12px',
                    border: '1px solid var(--border)',
                  }}>
                    <input
                      type="color"
                      value={form.visual.palette[key]}
                      onChange={e => updatePalette(key, e.target.value)}
                      style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'none', padding: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{labels[i]}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{form.visual.palette[key]}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <FieldLabel>Estilo gráfico</FieldLabel>
            <select style={inputStyle} value={form.visual.graphic_style} onChange={e => setForm(f => ({ ...f, visual: { ...f.visual, graphic_style: e.target.value } }))}>
              {GRAPHIC_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <FieldLabel>Fonte display (títulos)</FieldLabel>
            <input
              style={inputStyle} value={form.visual.typography.display ?? ''}
              onChange={e => setForm(f => ({ ...f, visual: { ...f.visual, typography: { ...f.visual.typography, display: e.target.value } } }))}
              placeholder="Ex: Playfair Display, Syne, Montserrat"
            />

            <FieldLabel>Elementos recorrentes</FieldLabel>
            <input
              style={inputStyle} value={form.visual.recurring_elements}
              onChange={e => setForm(f => ({ ...f, visual: { ...f.visual, recurring_elements: e.target.value } }))}
              placeholder="Ex: ícones lineares, formas orgânicas, gradiente"
            />

            {/* Conteúdo */}
            <SectionLabel>Estratégia de Conteúdo</SectionLabel>

            <FieldLabel>Pilares de conteúdo (até 3)</FieldLabel>
            {[0, 1, 2].map(i => (
              <input
                key={i} style={{ ...inputStyle, marginBottom: 8 }}
                value={form.content_strategy.pillars[i]}
                onChange={e => updatePillar(i, e.target.value)}
                placeholder={`Pilar ${i + 1} — Ex: Educação, Bastidores, Cases`}
              />
            ))}

            <FieldLabel>Hashtags preferidas (separadas por vírgula)</FieldLabel>
            <input
              style={inputStyle} value={form.content_strategy.preferred_hashtags}
              onChange={e => setForm(f => ({ ...f, content_strategy: { ...f.content_strategy, preferred_hashtags: e.target.value } }))}
              placeholder="Ex: #marketingdigital, #empreendedorismo"
            />

            <FieldLabel>CTA padrão</FieldLabel>
            <input
              style={inputStyle} value={form.content_strategy.cta_style ?? ''}
              onChange={e => setForm(f => ({ ...f, content_strategy: { ...f.content_strategy, cta_style: e.target.value } }))}
              placeholder="Ex: 'Me chama no direct', 'Salva esse post'"
            />

            {error && (
              <p style={{ color: '#f06060', fontSize: 13, fontFamily: 'var(--font-mono)', margin: '12px 0 0' }}>
                ✗ {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1, background: 'var(--surface2)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '12px',
                  fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, background: saving ? 'var(--border2)' : 'var(--accent)',
                  color: saving ? 'var(--text-muted)' : '#0e0e0e',
                  border: 'none', borderRadius: 6, padding: '12px',
                  fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'var(--accent)', fontSize: 11, fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase', letterSpacing: '0.1em',
      margin: '24px 0 14px', paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, marginTop: 12, fontFamily: 'var(--font-mono)' }}>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text)',
  fontSize: 14,
  padding: '10px 12px',
  boxSizing: 'border-box',
  marginBottom: 4,
  fontFamily: 'var(--font-body)',
  outline: 'none',
}
