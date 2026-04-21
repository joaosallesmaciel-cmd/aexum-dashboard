import Head from 'next/head'
import Link from 'next/link'
import { useUser } from '../lib/AuthContext'

const tools = [
  {
    category: 'Instagram',
    name: 'Gerador de Posts',
    description: 'Crie posts para Instagram com briefing visual, copy e preview renderizado',
    href: '/posts',
  },
  {
    category: 'Clientes',
    name: 'CRM',
    description: 'Gerencie clientes, funil de vendas, histórico de interações, tarefas e pagamentos',
    href: '/crm',
  },
  {
    category: 'Brands',
    name: 'Identidade Visual',
    description: 'Cadastre e gerencie identidades de marca com paleta, tipografia e estratégia de conteúdo',
    href: '/brands',
  },
]

export default function Dashboard() {
  const { user, signOut } = useUser()

  return (
    <>
      <Head><title>Aexum — Dashboard</title></Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)', padding: '56px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                Dashboard
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '6px 0 0', fontFamily: 'var(--font-mono)' }}>
                {tools.length} ferramentas ativas
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px',
                letterSpacing: '0.05em', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.email}
              </span>
              <button onClick={signOut} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                padding: '4px 10px', fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)', cursor: 'pointer', letterSpacing: '0.05em',
              }}>
                sair
              </button>
            </div>
          </div>

          {/* Tool cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tools.map(tool => (
              <Link key={tool.href} href={tool.href} style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '22px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>● ativo</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{tool.category}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.01em' }}>
                      {tool.name}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                      {tool.description}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>→</div>
                </div>
              </Link>
            ))}

            {/* Próxima ferramenta */}
            <div style={{
              border: '1px dashed var(--border)', borderRadius: 10, padding: '20px 24px',
              color: 'var(--text-muted)', fontSize: 13, textAlign: 'center',
              fontFamily: 'var(--font-mono)', cursor: 'default',
            }}>
              + próxima ferramenta
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
