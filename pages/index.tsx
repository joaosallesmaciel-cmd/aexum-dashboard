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

const tools = [
  {
    category: 'Conteúdo',
    name: 'Gerador de Posts',
    description: 'Carrosséis, copy e hashtags gerados por IA com preview 1080×1080 em tempo real',
    href: '/posts',
    status: 'ativo',
    stat: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="2" y="2" width="16" height="16" rx="3"/>
        <path d="M6 7h8M6 10h5M6 13h3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    category: 'Identidade',
    name: 'Brands',
    description: 'Paleta, tipografia, tom de voz e análise de estilo por visão computacional',
    href: '/brands',
    status: 'ativo',
    stat: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <circle cx="10" cy="7" r="4"/>
        <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    category: 'Clientes',
    name: 'CRM',
    description: 'Funil de vendas, histórico de interações, tarefas e controle de pagamentos',
    href: '/crm',
    status: 'em breve',
    stat: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 16V10a7 7 0 1 1 14 0v6"/>
        <path d="M1 12h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2Z"/>
        <path d="M19 12h-3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2Z"/>
      </svg>
    ),
  },
]

export default function Dashboard() {
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
      <Head><title>Aexum — Dashboard</title></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          background: 'var(--surface)',
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>
              aexum
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.08em' }}>
              INTELLIGENCE SUITE
            </div>
          </div>

          {/* Nav */}
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

          {/* User */}
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

          {/* Page header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)',
                border: '1px solid rgba(200,240,96,0.3)', borderRadius: 4,
                padding: '2px 8px', letterSpacing: '0.1em',
              }}>
                ● ONLINE
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              Olá, {displayName.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
              Suas ferramentas de IA prontas para usar.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
            {[
              { label: 'Ferramentas ativas', value: '2', sub: 'de 3 módulos' },
              { label: 'Posts gerados', value: '—', sub: 'este mês' },
              { label: 'Brands cadastradas', value: '—', sub: 'no workspace' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '16px 20px',
              }}>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--border2)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Section title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Módulos
            </h2>
          </div>

          {/* Tool cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tools.map((tool, i) => {
              const isComingSoon = tool.status === 'em breve'
              return (
                <Link
                  key={tool.href}
                  href={isComingSoon ? '#' : tool.href}
                  style={{ display: 'block', textDecoration: 'none', pointerEvents: isComingSoon ? 'none' : 'auto' }}
                >
                  <div
                    style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '20px 24px',
                      display: 'flex', alignItems: 'center', gap: 20,
                      transition: 'border-color 0.15s, background 0.15s',
                      opacity: isComingSoon ? 0.5 : 1,
                      animationDelay: `${i * 60}ms`,
                    }}
                    className="fade-up"
                    onMouseEnter={e => {
                      if (!isComingSoon) {
                        e.currentTarget.style.borderColor = 'rgba(200,240,96,0.3)'
                        e.currentTarget.style.background = 'var(--surface2)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--surface)'
                    }}
                  >
                    {/* Icon box */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: isComingSoon ? 'var(--text-muted)' : 'var(--accent)',
                    }}>
                      {tool.icon}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                          {tool.name}
                        </span>
                        <span style={{
                          fontSize: 10, fontFamily: 'var(--font-mono)',
                          padding: '2px 7px', borderRadius: 4,
                          background: isComingSoon ? 'var(--surface2)' : 'rgba(200,240,96,0.1)',
                          color: isComingSoon ? 'var(--text-muted)' : 'var(--accent)',
                          border: `1px solid ${isComingSoon ? 'var(--border)' : 'rgba(200,240,96,0.2)'}`,
                          letterSpacing: '0.06em',
                        }}>
                          {tool.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {tool.category}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                        {tool.description}
                      </div>
                    </div>

                    {/* Arrow */}
                    {!isComingSoon && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>→</div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, color: 'var(--border2)', fontFamily: 'var(--font-mono)' }}>
              aexum intelligence suite · v0.1
            </span>
            <span style={{ fontSize: 11, color: 'var(--border2)', fontFamily: 'var(--font-mono)' }}>
              {user?.email}
            </span>
          </div>

        </main>
      </div>
    </>
  )
}
