import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--border2)',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'var(--font-body)',
  background: 'var(--surface2)',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontFamily: 'var(--font-mono)',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  marginBottom: '6px',
}

type Brand = {
  name: string
  colorPrimary: string
  colorSecondary: string
  colorAccent: string
  colorText: string
  fontDisplay: string
  fontBody: string
  graphicStyle: string
  recurringElements: string
}

type BrandRecord = {
  id: string
  name: string
  visual: {
    palette: { primary: string; secondary: string; accent: string; text: string }
    typography: { display: string | null; body: string | null }
    graphic_style: string
    recurring_elements: string
  }
}

type Slide = {
  numero: number
  headline: string
  corpo: string
  hierarquia_visual: string
  layout: string
  cor_fundo: string
  cor_texto_principal: string
  elementos_graficos: string[]
}

type PostOutput = {
  angulo: string
  slides: Slide[]
  legenda_feed: string
  hashtags: string[]
  cta: string
  observacoes_execucao: string
}

export default function Posts() {
  const [brand, setBrand] = useState<Brand>({
    name: 'Minha Marca',
    colorPrimary: '#1a1a2e',
    colorSecondary: '#e94560',
    colorAccent: '#f5f5f5',
    colorText: '#ffffff',
    fontDisplay: 'Playfair Display',
    fontBody: 'Inter',
    graphicStyle: 'editorial',
    recurringElements: 'linhas finas, numeração em serif, espaço negativo',
  })

  const [params, setParams] = useState({
    theme: '',
    voice: 'Autoritativo',
    visualStyle: 'Minimalista',
    contentType: 'Educativo',
    format: 'Post único',
    slideCount: 3,
  })

  const [output, setOutput] = useState<PostOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [brandOpen, setBrandOpen] = useState(true)
  const [savedBrands, setSavedBrands] = useState<BrandRecord[]>([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [postId, setPostId] = useState<string | null>(null)
  const [postSaved, setPostSaved] = useState(false)
  const [slideUrls, setSlideUrls] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('aexum-brand')
      if (saved) setBrand(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem('aexum-brand', JSON.stringify(brand)) } catch {}
  }, [brand])

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(data => { setSavedBrands(Array.isArray(data) ? data : []); setBrandsLoading(false) })
      .catch(() => setBrandsLoading(false))
  }, [])

  const handleBrandSelect = (id: string) => {
    setSelectedBrandId(id || null)
    const found = savedBrands.find(b => b.id === id)
    if (!found) return
    setBrand({
      name: found.name,
      colorPrimary: found.visual.palette.primary,
      colorSecondary: found.visual.palette.secondary,
      colorAccent: found.visual.palette.accent,
      colorText: found.visual.palette.text,
      fontDisplay: found.visual.typography.display ?? brand.fontDisplay,
      fontBody: found.visual.typography.body ?? brand.fontBody,
      graphicStyle: found.visual.graphic_style,
      recurringElements: found.visual.recurring_elements,
    })
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const buildRenderUrl = (slide: Slide) => {
    const p = new URLSearchParams({
      bg:       slide.cor_fundo              || brand.colorPrimary,
      tc:       slide.cor_texto_principal    || brand.colorText,
      ac:       brand.colorSecondary,
      headline: slide.headline,
      corpo:    slide.corpo,
      brand:    brand.name,
      num:      String(slide.numero),
      total:    String(output?.slides.length ?? 1),
    })
    return `/api/render-slide?${p}`
  }

  const formatMap: Record<string, 'single' | 'carousel' | 'story' | 'reel'> = {
    'Post único': 'single', 'Carrossel': 'carousel', 'Story': 'story',
  }
  const postTypeMap: Record<string, 'educational' | 'entertainment' | 'promotional' | 'behind_scenes' | 'engagement'> = {
    'Educativo': 'educational', 'Entretenimento': 'entertainment', 'Promocional': 'promotional',
    'Bastidores': 'behind_scenes', 'Engajamento': 'engagement',
  }

  const generate = async () => {
    if (!params.theme.trim()) { setError('Informe o tema do post'); return }
    setError(''); setLoading(true); setOutput(null); setCurrentSlide(0); setPostSaved(false); setPostId(null); setSlideUrls([])

    const slides = params.format === 'Carrossel' ? params.slideCount : 1

    const userPrompt = `IDENTIDADE VISUAL:
- Nome: ${brand.name}
- Cores: primária ${brand.colorPrimary}, secundária ${brand.colorSecondary}, destaque ${brand.colorAccent}, texto ${brand.colorText}
- Fontes: display "${brand.fontDisplay}", corpo "${brand.fontBody}"
- Estilo: ${brand.graphicStyle}
- Elementos: ${brand.recurringElements}

PARÂMETROS:
- Tema: ${params.theme}
- Tom: ${params.voice}
- Visual: ${params.visualStyle}
- Tipo: ${params.contentType}
- Formato: ${params.format}${slides > 1 ? ` (${slides} slides)` : ''}

Gere ${slides} slide(s). Use APENAS as cores da paleta fornecida.
${params.visualStyle === 'Minimalista' ? 'Máximo 3 elementos por slide, muito espaço negativo.' : 'Use a paleta completa com camadas visuais.'}
${params.contentType === 'Educativo' ? 'Estruture em: problema → insight → solução.' : ''}
Legenda: 150–300 caracteres. Hashtags: 15–20.`

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: `Você é um designer especialista em redes sociais. Responda SOMENTE com JSON válido, sem markdown, sem blocos de código, sem texto fora do JSON. Estrutura obrigatória:
{
  "angulo": "string",
  "slides": [{ "numero": 1, "headline": "max 7 palavras", "corpo": "max 3 linhas", "hierarquia_visual": "string", "layout": "string", "cor_fundo": "#hex", "cor_texto_principal": "#hex", "elementos_graficos": ["string"] }],
  "legenda_feed": "string 150-300 chars",
  "hashtags": ["string"],
  "cta": "string",
  "observacoes_execucao": "string"
}`,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: 2000,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na API')

      const text = data.content
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('')
        .trim()

      const cleaned = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setOutput(parsed)

      // Salvar no Supabase
      try {
        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: selectedBrandId ?? null,
            format: formatMap[params.format] ?? 'single',
            post_type: postTypeMap[params.contentType] ?? 'educational',
            brief: { theme: params.theme, tone: params.voice, style: params.visualStyle },
            strategy: { angle: parsed.angulo },
            copy_variants: [parsed],
          }),
        })
        const saved = await saveRes.json()
        if (saveRes.ok && saved.id) {
          setPostId(saved.id); setPostSaved(true)
          // salvar slides no Storage (não-bloqueante)
          fetch('/api/save-slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ post_id: saved.id, slides: parsed.slides, brand }),
          })
            .then(r => r.json())
            .then(d => { if (d.urls) setSlideUrls(d.urls) })
            .catch(e => console.error('[save-slides]', e))
        } else {
          console.error('[posts] save error:', saved)
        }
      } catch (saveErr) {
        console.error('[posts] save exception:', saveErr)
      }
    } catch (e) {
      console.error(e)
      setError('Erro ao gerar. Verifique a API key nas variáveis de ambiente do Vercel.')
    } finally {
      setLoading(false)
    }
  }

  const renderPreview = (slide: Slide) => {
    if (!slide) return null
    const bg = slide.cor_fundo || brand.colorPrimary
    const tc = slide.cor_texto_principal || brand.colorText
    const ac = brand.colorSecondary
    return (
      <svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="1080" height="1080" fill={bg} />
        <line x1="80" y1="80" x2="200" y2="80" stroke={ac} strokeWidth="2" />
        <line x1="80" y1="80" x2="80" y2="200" stroke={ac} strokeWidth="2" />
        <line x1="880" y1="1000" x2="1000" y2="1000" stroke={ac} strokeWidth="2" />
        <line x1="1000" y1="880" x2="1000" y2="1000" stroke={ac} strokeWidth="2" />
        {(output?.slides?.length ?? 0) > 1 && (
          <text x="80" y="160" fontFamily="serif" fontSize="72" fontWeight="300" fill={ac} opacity="0.8">
            {String(slide.numero).padStart(2, '0')}
          </text>
        )}
        <foreignObject x="80" y="380" width="920" height="300">
          <div
            // @ts-ignore
            xmlns="http://www.w3.org/1999/xhtml"
            style={{ fontFamily: 'serif', fontSize: '84px', fontWeight: 600, lineHeight: 1.05, color: tc, letterSpacing: '-0.02em' }}
          >
            {slide.headline}
          </div>
        </foreignObject>
        <foreignObject x="80" y="720" width="920" height="200">
          <div
            // @ts-ignore
            xmlns="http://www.w3.org/1999/xhtml"
            style={{ fontFamily: 'sans-serif', fontSize: '32px', fontWeight: 400, lineHeight: 1.4, color: tc, opacity: 0.85 }}
          >
            {slide.corpo}
          </div>
        </foreignObject>
        <text x="80" y="1000" fontFamily="sans-serif" fontSize="22" fontWeight="500" fill={tc} opacity="0.5" letterSpacing="0.1em">
          {brand.name.toUpperCase()}
        </text>
        {(output?.slides?.length ?? 0) > 1 && output?.slides.map((_, i) => (
          <circle key={i} cx={960 - ((output?.slides?.length ?? 1) - 1 - i) * 28} cy={1000} r="6"
            fill={i === slide.numero - 1 ? ac : tc} opacity={i === slide.numero - 1 ? 1 : 0.3} />
        ))}
      </svg>
    )
  }

  return (
    <>
      <Head><title>Gerador de Posts — Aexum</title></Head>
      <style>{`
        input:focus, select:focus, textarea:focus {
          border-color: var(--accent) !important;
          background: var(--surface) !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Topbar */}
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          background: 'rgba(14,14,14,0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border2)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)' }}>
            posts
          </span>
        </div>

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Título */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '36px',
              fontWeight: '800',
              letterSpacing: '-0.03em',
              marginBottom: '4px',
            }}>
              Gerador de Posts
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              Instagram · briefing + copy + preview
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* COLUNA ESQUERDA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Brand Selector */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Brand</label>
                    <select
                      disabled={brandsLoading}
                      onChange={e => handleBrandSelect(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 12px',
                        border: '1px solid #2a2a3e', borderRadius: '8px',
                        fontSize: '13px', background: '#0f0f1a',
                        color: 'white', outline: 'none',
                        cursor: brandsLoading ? 'wait' : 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <option value="">{brandsLoading ? 'Carregando brands...' : '— selecione uma brand —'}</option>
                      {savedBrands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <a href="/brands" target="_blank" rel="noopener noreferrer" style={{
                    padding: '10px 12px', border: '1px solid #2a2a3e', borderRadius: '8px',
                    fontSize: '13px', background: '#0f0f1a', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'none',
                  }}>＋ Nova brand</a>
                </div>
                {!brandsLoading && savedBrands.length === 0 && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Nenhuma brand cadastrada. Crie uma em{' '}
                    <a href="/brands" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>/brands</a>
                  </div>
                )}
              </div>

              {/* Identidade Visual */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  onClick={() => setBrandOpen(!brandOpen)}
                  style={{
                    width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', background: 'transparent', border: 'none',
                    cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}
                >
                  <span>Identidade Visual</span>
                  <span style={{ color: 'var(--accent)' }}>{brandOpen ? '▲' : '▼'}</span>
                </button>

                {brandOpen && (
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Nome da marca</label>
                      <input style={inputStyle} value={brand.name} onChange={e => setBrand({ ...brand, name: e.target.value })} />
                    </div>

                    <div>
                      <label style={labelStyle}>Paleta de cores</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {([
                          ['colorPrimary', 'Primária'],
                          ['colorSecondary', 'Secundária'],
                          ['colorAccent', 'Destaque'],
                          ['colorText', 'Texto'],
                        ] as [keyof Brand, string][]).map(([key, lbl]) => (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="color" value={brand[key] as string}
                              onChange={e => setBrand({ ...brand, [key]: e.target.value })}
                              style={{ width: '30px', height: '30px', border: '1px solid var(--border2)', borderRadius: '4px', cursor: 'pointer', padding: 0, background: 'transparent' }} />
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{lbl}</div>
                              <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{brand[key] as string}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={labelStyle}>Fonte display</label>
                        <input style={inputStyle} value={brand.fontDisplay} onChange={e => setBrand({ ...brand, fontDisplay: e.target.value })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Fonte corpo</label>
                        <input style={inputStyle} value={brand.fontBody} onChange={e => setBrand({ ...brand, fontBody: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Estilo gráfico</label>
                      <select style={inputStyle} value={brand.graphicStyle} onChange={e => setBrand({ ...brand, graphicStyle: e.target.value })}>
                        <option value="editorial">Editorial</option>
                        <option value="flat">Flat</option>
                        <option value="organico">Orgânico</option>
                        <option value="tech">Tech</option>
                        <option value="brutalism">Brutalism</option>
                        <option value="minimalista">Minimalista</option>
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Elementos recorrentes</label>
                      <textarea style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
                        value={brand.recurringElements}
                        onChange={e => setBrand({ ...brand, recurringElements: e.target.value })}
                        placeholder="linhas finas, formas geométricas..." />
                    </div>
                  </div>
                )}
              </div>

              {/* Parâmetros */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Parâmetros do Post
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Tema</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                      value={params.theme}
                      onChange={e => setParams({ ...params, theme: e.target.value })}
                      placeholder="Ex: Por que a maioria dos negócios falha no primeiro ano"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Tom de voz</label>
                    <select style={inputStyle} value={params.voice} onChange={e => setParams({ ...params, voice: e.target.value })}>
                      {['Inspiracional', 'Educativo', 'Descontraído', 'Autoritativo', 'Empático', 'Provocativo'].map(v =>
                        <option key={v}>{v}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>Estilo</label>
                      <select style={inputStyle} value={params.visualStyle} onChange={e => setParams({ ...params, visualStyle: e.target.value })}>
                        <option>Minimalista</option>
                        <option>Denso</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Tipo</label>
                      <select style={inputStyle} value={params.contentType} onChange={e => setParams({ ...params, contentType: e.target.value })}>
                        {['Educativo', 'Entretenimento', 'Promocional', 'Bastidores', 'Engajamento'].map(v =>
                          <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>Formato</label>
                      <select style={inputStyle} value={params.format} onChange={e => setParams({ ...params, format: e.target.value })}>
                        <option>Post único</option>
                        <option>Carrossel</option>
                        <option>Story</option>
                      </select>
                    </div>
                    {params.format === 'Carrossel' && (
                      <div>
                        <label style={labelStyle}>Slides</label>
                        <input type="number" min={2} max={10} style={inputStyle}
                          value={params.slideCount} onChange={e => setParams({ ...params, slideCount: parseInt(e.target.value) || 2 })} />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={generate}
                  disabled={loading}
                  style={{
                    width: '100%', marginTop: '16px', padding: '13px',
                    background: loading ? 'var(--border2)' : 'var(--accent)',
                    color: loading ? 'var(--text-muted)' : '#0e0e0e',
                    border: 'none', borderRadius: '6px',
                    fontSize: '13px', fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.02em',
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                      Gerando...
                    </>
                  ) : '✦ Gerar post'}
                </button>

                {error && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div>
              {!output && !loading && (
                <div style={{
                  background: 'var(--surface)', border: '1px dashed var(--border2)',
                  borderRadius: '10px', padding: '80px 40px',
                  textAlign: 'center', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', marginBottom: '6px', color: 'var(--text-dim)' }}>
                    Seu post aparece aqui
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                    Preencha o tema e clique em Gerar post
                  </div>
                </div>
              )}

              {loading && (
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '80px 40px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '28px', animation: 'spin 1s linear infinite', display: 'inline-block', color: 'var(--accent)' }}>⟳</div>
                  <div style={{ marginTop: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    Interpretando tema · definindo hierarquia · gerando copy...
                  </div>
                </div>
              )}

              {output && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Ângulo */}
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '20px',
                    borderLeft: '3px solid var(--accent)',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Ângulo editorial
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600', lineHeight: 1.4 }}>
                      {output.angulo}
                    </div>
                  </div>

                  {postSaved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#4ade80' }}>
                      <span>💾</span>
                      <span>Salvo no Supabase{postId ? ` · ${postId.slice(0, 8)}…` : ''}</span>
                    </div>
                  )}

                  {/* Preview + Briefing */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Preview 1:1
                        </span>
                        {output.slides.length > 1 && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {output.slides.map((_, i) => (
                              <button key={i} onClick={() => setCurrentSlide(i)} style={{
                                width: '22px', height: '22px', borderRadius: '4px', border: '1px solid',
                                borderColor: i === currentSlide ? 'var(--accent)' : 'var(--border2)',
                                background: i === currentSlide ? 'var(--accent)' : 'transparent',
                                color: i === currentSlide ? '#0e0e0e' : 'var(--text-muted)',
                                fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                              }}>{i + 1}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ aspectRatio: '1/1', background: '#0a0a0a', borderRadius: '6px', overflow: 'hidden' }}>
                        <img
                          src={slideUrls[currentSlide] || buildRenderUrl(output.slides[currentSlide])}
                          alt={`Slide ${currentSlide + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
                        Briefing · Slide {currentSlide + 1}
                      </div>
                      {output.slides[currentSlide] && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                          <div>
                            <div style={labelStyle}>Headline</div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', lineHeight: 1.2, color: 'var(--text)' }}>
                              {output.slides[currentSlide].headline}
                            </div>
                          </div>
                          <div>
                            <div style={labelStyle}>Corpo</div>
                            <div style={{ lineHeight: 1.5, color: 'var(--text-dim)' }}>
                              {output.slides[currentSlide].corpo}
                            </div>
                          </div>
                          <div>
                            <div style={labelStyle}>Layout</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                              {output.slides[currentSlide].layout}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                              ['Fundo', output.slides[currentSlide].cor_fundo],
                              ['Texto', output.slides[currentSlide].cor_texto_principal],
                            ].map(([lbl, hex]) => (
                              <div key={lbl}>
                                <div style={labelStyle}>{lbl}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: '1px solid var(--border2)', background: hex }} />
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)' }}>{hex}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={labelStyle}>Elementos</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {output.slides[currentSlide].elementos_graficos?.map((el, i) => (
                                <span key={i} style={{
                                  fontSize: '11px', padding: '3px 8px',
                                  background: 'var(--surface2)', borderRadius: '4px',
                                  color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                  border: '1px solid var(--border)',
                                }}>{el}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Legenda */}
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Legenda · {output.legenda_feed.length} chars
                      </span>
                      <button onClick={() => copyText(output.legenda_feed, 'legenda')}
                        style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)', color: copied === 'legenda' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {copied === 'legenda' ? '✓ copiado' : 'copiar'}
                      </button>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-dim)', background: 'var(--surface2)', padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                      {output.legenda_feed}
                    </div>
                  </div>

                  {/* CTA + Hashtags */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>CTA</div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--accent)', lineHeight: 1.4 }}>→ {output.cta}</div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Hashtags ({output.hashtags.length})
                        </span>
                        <button onClick={() => copyText(output.hashtags.map(h => h.startsWith('#') ? h : '#' + h).join(' '), 'tags')}
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)', color: copied === 'tags' ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {copied === 'tags' ? '✓ copiado' : 'copiar'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {output.hashtags.map((tag, i) => (
                          <span key={i} style={{
                            fontSize: '11px', padding: '3px 8px',
                            background: 'rgba(200,240,96,0.06)', borderRadius: '10px',
                            color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                            border: '1px solid rgba(200,240,96,0.12)',
                          }}>
                            {tag.startsWith('#') ? tag : '#' + tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {output.observacoes_execucao && (
                    <div style={{ background: 'rgba(240,192,96,0.05)', border: '1px solid rgba(240,192,96,0.15)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Notas de execução
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#c8a84a' }}>
                        {output.observacoes_execucao}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
