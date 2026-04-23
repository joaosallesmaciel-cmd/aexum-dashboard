// PADRÃO: todo <main> adjacente à Sidebar deve ter padding: '48px 48px'
import Link from 'next/link'
import { useEffect, useState } from 'react'
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
    label: 'Configurações',
    href: '/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="2"/>
        <path d="M8 1.5A6.5 6.5 0 0 1 9.5 2l.5 1.5 1 .5 1.5-.5a6.5 6.5 0 0 1 1 1l-.5 1.5.5 1 1.5.5a6.5 6.5 0 0 1 0 2l-1.5.5-.5 1 .5 1.5a6.5 6.5 0 0 1-1 1L11 13l-1 .5-.5 1.5a6.5 6.5 0 0 1-2 0L7 13.5 6 13l-1.5.5a6.5 6.5 0 0 1-1-1l.5-1.5L3.5 10 2 9.5a6.5 6.5 0 0 1 0-2L3.5 7l.5-1L3.5 4.5a6.5 6.5 0 0 1 1-1L6 4l1-.5.5-1.5A6.5 6.5 0 0 1 8 1.5z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user, signOut } = useUser()
  const router = useRouter()

  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      document.body.classList.add('light')
      setIsDark(false)
    }
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.body.classList.toggle('light', !next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '—'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
      background: 'var(--surface)',
    }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: "'Astera', sans-serif", fontSize: 16, color: '#8DC63F', letterSpacing: '0.4em', lineHeight: 1 }}>
          AEXUM
        </div>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.08em' }}>
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

      <div style={{ padding: '8px 10px' }}>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 7, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13,
            fontFamily: 'var(--font-body)',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</span>
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface2)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--accent)', color: '#0e0e0e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 800, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <button
              onClick={signOut}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >sair →</button>
          </div>
        </div>
      </div>
    </aside>
  )
}
