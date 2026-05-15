import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { faviconHref } from '../lib/favicons'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Status = 'verifying' | 'success' | 'error'

export default function ConfirmEmail() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!router.isReady) return

    async function verify() {
      try {
        // Supabase pode enviar via hash: #access_token=...&type=signup
        // ou via query: ?token_hash=...&type=email
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        const params = new URLSearchParams(hash.replace('#', ''))

        const tokenHash = (router.query.token_hash as string) || params.get('access_token') || ''
        const type = (router.query.type as string) || params.get('type') || ''

        if (!tokenHash) {
          setErrorMsg('Link de confirmação inválido ou expirado.')
          setStatus('error')
          return
        }

        let error: any = null

        if (type === 'signup' || type === 'email') {
          // token_hash flow (PKCE)
          const res = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type === 'signup' ? 'signup' : 'email',
          })
          error = res.error
        } else if (params.get('access_token')) {
          // hash flow — session já vem no hash, só precisa setar
          const res = await supabase.auth.getSession()
          error = res.error
        } else {
          setErrorMsg('Tipo de confirmação desconhecido.')
          setStatus('error')
          return
        }

        if (error) {
          setErrorMsg(error.message || 'Erro ao confirmar email.')
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/crm'), 2000)
        }
      } catch (e: any) {
        setErrorMsg(e?.message || 'Erro inesperado.')
        setStatus('error')
      }
    }

    verify()
  }, [router.isReady, router.query])

  return (
    <>
      <Head>
        <title>Confirmação de Email — Aexum</title>
        <link rel="icon" type="image/svg+xml" href={faviconHref('login')} />
      </Head>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 40px; height: 40px;
          border: 3px solid #e5e5e5;
          border-top-color: #c5eb2d;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#f4f4f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Montserrat', sans-serif",
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Astera', sans-serif",
            fontSize: 28,
            color: '#c5eb2d',
            letterSpacing: '0.5em',
            lineHeight: 1,
          }}>
            AEXUM
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#999999',
            letterSpacing: '0.08em',
            marginTop: 6,
          }}>
            INTELLIGENCE SUITE
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '48px 40px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          {status === 'verifying' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div className="spinner" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#000000', marginBottom: 8 }}>
                Verificando...
              </div>
              <div style={{ fontSize: 14, color: '#666666' }}>
                Confirmando seu email, aguarde.
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#c5eb2d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 28, color: '#000000', fontWeight: 700,
              }}>
                ✓
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#000000', marginBottom: 8 }}>
                Email confirmado!
              </div>
              <div style={{ fontSize: 14, color: '#666666' }}>
                Redirecionando para o dashboard...
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#ef4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 28, color: '#ffffff', fontWeight: 700,
              }}>
                ✗
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#000000', marginBottom: 8 }}>
                Erro na confirmação
              </div>
              <div style={{ fontSize: 14, color: '#666666', marginBottom: 28 }}>
                {errorMsg}
              </div>
              <button
                onClick={() => router.push('/login')}
                style={{
                  background: '#c5eb2d',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'Montserrat', sans-serif",
                  cursor: 'pointer',
                }}
              >
                Ir para o login
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
