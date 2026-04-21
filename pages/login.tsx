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

  return (
    <>
      <Head><title>Login — Aexum</title></Head>
      <div style={{
        minHeight: '100vh', background: 'var(--bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Aexum
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0 }}>
              acesse sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
            />

            {error && (
              <p style={{ color: '#ff6b6b', fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0 }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? 'entrando...' : 'entrar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20, fontFamily: 'var(--font-mono)' }}>
            não tem conta?{' '}
            <a href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>criar conta</a>
          </p>
        </div>
      </div>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '12px 14px', color: 'var(--text)',
  fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', width: '100%',
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  background: 'var(--accent)', color: '#000', border: 'none',
  borderRadius: 8, padding: '12px 14px', fontSize: 14, fontWeight: 700,
  fontFamily: 'var(--font-mono)', cursor: 'pointer', marginTop: 4,
}
