// PADRÃO: todo <main> adjacente à Sidebar deve ter padding: '48px 48px'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useUser } from '../lib/AuthContext'
import { Bot, MessageSquare, BookOpen, Code2 } from 'lucide-react'

const nav = [
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
  {
    label: 'Conversas',
    href: '/conversas',
    icon: <MessageSquare width={16} height={16} />,
  },
  {
    label: 'Conhecimento',
    href: '/conhecimento',
    icon: <BookOpen width={16} height={16} />,
  },
  {
    label: 'Agente',
    href: '/agent',
    icon: <Bot width={16} height={16} />,
  },
  {
    label: 'Developer',
    href: '/developer',
    icon: <Code2 width={16} height={16} />,
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user, signOut } = useUser()
  const router = useRouter()

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '—'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      borderRight: '1px solid var(--sidebar-border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      background: 'var(--sidebar-bg)',
    }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div style={{ fontFamily: "'Astera', sans-serif", fontSize: 16, color: '#c5eb2d', letterSpacing: '0.4em', lineHeight: 1 }}>
          AEXUM
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--sidebar-text-muted)', marginTop: 4, letterSpacing: '0.08em' }}>
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
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
              background: active ? 'rgba(197,235,45,0.1)' : 'transparent',
              transition: 'all 0.12s',
            }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(197,235,45,0.08)'
                  e.currentTarget.style.color = 'var(--sidebar-text)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = active ? 'rgba(197,235,45,0.1)' : 'transparent'
                e.currentTarget.style.color = active ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)'
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--sidebar-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(197,235,45,0.08)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#c5eb2d', color: '#000000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sidebar-text)' }}>{displayName}</div>
            <button
              onClick={signOut}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: 'var(--sidebar-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text-muted)'}
            >sair →</button>
          </div>
        </div>
      </div>
    </aside>
  )
}
