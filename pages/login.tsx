import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    background: 'var(--surface2)',
    border: `1px solid ${focusedField === field ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 8,
    padding: '13px 16px',
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
      <Head><title>Login — Aexum</title></Head>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--accent);
          margin-left: 2px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#0e0e0e',
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 32,
      }}>

        {/* Logo + tagline */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text)',
            marginBottom: 10,
          }}>
            aexum
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
          }}>
            inteligência que escala_<span className="cursor" />
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: '40px',
          boxShadow: '0 0 0 1px rgba(200,240,96,0.05), 0 24px 48px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle('email')}
            />
            <input
              type="password"
              placeholder="senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              style={inputStyle('password')}
            />

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
              {loading ? 'entrando...' : 'entrar'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--font-mono)',
          }}>
            não tem conta?{' '}
            <a href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>criar conta</a>
          </p>
        </div>

        {/* Footer */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          margin: 0,
          opacity: 0.5,
        }}>
          // powered by Aexum
        </p>
      </div>
    </>
  )
}
