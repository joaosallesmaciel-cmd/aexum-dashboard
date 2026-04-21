import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  return (
    <>
      <Head><title>Criar conta — Aexum</title></Head>
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
              criar conta
            </p>
          </div>

          {done ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 24, textAlign: 'center',
            }}>
              <p style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 14, margin: 0 }}>
                conta criada! verifique seu email para confirmar.
              </p>
            </div>
          ) : (
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
                placeholder="senha (mín. 6 caracteres)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />

              {error && (
                <p style={{ color: '#ff6b6b', fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0 }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} style={btnStyle}>
                {loading ? 'criando...' : 'criar conta'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 20, fontFamily: 'var(--font-mono)' }}>
            já tem conta?{' '}
            <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>entrar</a>
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
