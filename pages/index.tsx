import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useUser } from '../lib/AuthContext'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

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
    status: 'ativo',
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
  const { user, supabase } = useUser()
  const [postsCount, setPostsCount] = useState<number | null>(null)
  const [brandsCount, setBrandsCount] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
      .then(({ count }) => setPostsCount(count ?? 0))
    supabase.from('brands').select('*', { count: 'exact', head: true }).eq('owner_id', user.id)
      .then(({ count }) => setBrandsCount(count ?? 0))
  }, [user])

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '—'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  return (
    <>
      <Head><title>Aexum — Dashboard</title><link rel="icon" type="image/svg+xml" href={faviconHref('dashboard')} /></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
        <Sidebar />

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
              { label: 'Posts gerados', value: postsCount !== null ? String(postsCount) : '—', sub: 'total gerados' },
              { label: 'Brands cadastradas', value: brandsCount !== null ? String(brandsCount) : '—', sub: 'no workspace' },
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
