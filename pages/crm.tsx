import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUser } from '../lib/AuthContext'

const nav = [
  {
    label: 'Dashboard',
    href: '/',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Brands',
    href: '/brands',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="6" r="3"/>
        <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Gerador de Posts',
    href: '/posts',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="14" height="14" rx="2"/>
        <path d="M4 5h8M4 8h5M4 11h3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Histórico',
    href: '/posts/history',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6"/>
        <path d="M8 5v3.5l2 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'CRM',
    href: '/crm',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 13V8a6 6 0 1 1 12 0v5"/>
        <path d="M1 10h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2Z"/>
        <path d="M15 10h-2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2Z"/>
      </svg>
    ),
  },
]

const features = [
  { icon: '◈', label: 'Funil de vendas', desc: 'Kanban visual com etapas customizáveis por cliente' },
  { icon: '◉', label: 'Histórico de interações', desc: 'Registro de calls, emails e reuniões em linha do tempo' },
  { icon: '◎', label: 'Tarefas e follow-ups', desc: 'Lembretes automáticos e checklists por oportunidade' },
  { icon: '◇', label: 'Controle de pagamentos', desc: 'Status de propostas, contratos e recebimentos' },
]

export default function CRM() {
  const { user, signOut } = useUser()
  const router = useRouter()

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '—'
  const initials = displayName.slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <>
      <Head><title>CRM — Aexum</title></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          background: 'var(--surface)',
        }}>
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
              aexum
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.08em' }}>
              INTELLIGENCE SUITE
            </div>
          </div>

          <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nav.map(item => {
              const active = router.pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 7, textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'rgba(200,240,96,0.07)' : 'transparent',
                  transition: 'all 0.12s',
                }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = active ? 'var(--accent)' : 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(200,240,96,0.07)' : 'transparent'; e.currentTarget.style.color = active ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--surface2)',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--accent)', color: '#0e0e0e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800,
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  sair →
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, padding: '48px 48px', maxWidth: 860 }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
                CRM
              </h1>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)',
                padding: '3px 9px', borderRadius: 4,
                background: 'var(--surface2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                letterSpacing: '0.1em',
              }}>
                EM BREVE
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0, maxWidth: 480 }}>
              Gerencie clientes, oportunidades e relacionamentos — tudo integrado ao seu fluxo de trabalho.
            </p>
          </div>

          {/* Em construção card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '48px 40px',
            textAlign: 'center', marginBottom: 32,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>
              🔧
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Módulo em desenvolvimento
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto' }}>
              O CRM está sendo construído. Em breve você vai gerenciar clientes e oportunidades diretamente aqui.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {features.map(f => (
              <div key={f.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '16px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 16,
                opacity: 0.6,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }}>
                  {f.icon}
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </>
  )
}
