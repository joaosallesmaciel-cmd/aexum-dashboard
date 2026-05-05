import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { faviconHref } from '../lib/favicons'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const bullets = [
  'Atendente de IA no WhatsApp, 24/7',
  'CRM com funil de vendas visual',
  'Monitoramento de conversas em tempo real',
]

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${focusedField === field ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  })

  return (
    <>
      <Head><title>Login — Aexum</title><link rel="icon" type="image/svg+xml" href={faviconHref('login')} /></Head>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 0.85em;
          background: var(--accent);
          margin-left: 3px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }
        @media (max-width: 767px) {
          .left-col { display: none !important; }
          .right-col { width: 100% !important; max-width: 440px !important; }
          .split-wrap { justify-content: center !important; }
        }
      `}</style>

      {/* Root */}
      <div style={{ minHeight: '100vh', background: '#0e0e0e', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

        {/* Grid de linhas SVG */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Gradientes radiais */}
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,240,96,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,240,96,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* Split layout */}
        <div className="split-wrap" style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', width: '100%', maxWidth: 1100, margin: '0 auto', padding: '48px 48px', gap: 80, boxSizing: 'border-box' }}>

          {/* Coluna esquerda — marketing */}
          <div className="left-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Logo */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontFamily: "'Astera', sans-serif",
                fontSize: 48,
                color: '#8DC63F',
                letterSpacing: '0.6em',
                lineHeight: 1,
                fontWeight: 'normal',
              }}>
                AEXUM
              </div>
            </div>

            {/* Tagline */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-muted)', marginBottom: 28, display: 'flex', alignItems: 'center' }}>
              inteligência que escala<span className="cursor" />
            </div>

            {/* Descrição */}
            <p style={{ fontSize: 15, color: 'var(--text-dim, #8a8a8a)', lineHeight: 1.7, margin: '0 0 36px', maxWidth: 420 }}>
              Dashboards inteligentes, geração de conteúdo com IA e CRM unificados para agências que querem crescer sem contratar.
            </p>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 48 }}>
              {bullets.map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)', fontSize: 12, flexShrink: 0 }}>✦</span>
                  {b}
                </div>
              ))}
            </div>

            {/* Rodapé */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', opacity: 0.4 }}>
              // powered by Aexum
            </div>
          </div>

          {/* Coluna direita — card de login */}
          <div className="right-col" style={{ width: 400, flexShrink: 0 }}>
            <div style={{ position: 'relative', background: 'rgba(22,22,22,0.85)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(200,240,96,0.15)', borderRadius: 20, padding: 40, boxShadow: '0 0 0 1px rgba(200,240,96,0.05), 0 32px 64px rgba(0,0,0,0.5)' }}>
              {/* Brilho topo */}
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,240,96,0.4), transparent)', borderRadius: '20px 20px 0 0' }} />

              {/* Título */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>Entrar</h1>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>Acesse seu workspace</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>EMAIL</div>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle('email')}
                  />
                </div>

                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>SENHA</div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    style={inputStyle('password')}
                  />
                </div>

                {error && (
                  <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'var(--font-mono)', margin: 0 }}>
                    // {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? 'rgba(200,240,96,0.6)' : 'var(--accent)',
                    color: '#0e0e0e',
                    border: 'none',
                    borderRadius: 8,
                    padding: '13px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    marginTop: 4,
                    transition: 'background 0.15s',
                  }}
                >
                  {loading ? 'entrando...' : 'Entrar →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20, marginBottom: 0, fontFamily: 'var(--font-mono)' }}>
                não tem conta?{' '}
                <a href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>criar conta</a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
