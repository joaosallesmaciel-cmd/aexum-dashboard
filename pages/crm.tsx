import Head from 'next/head'
import Sidebar from '../components/Sidebar'

const features = [
  { icon: '◈', label: 'Funil de vendas', desc: 'Kanban visual com etapas customizáveis por cliente' },
  { icon: '◉', label: 'Histórico de interações', desc: 'Registro de calls, emails e reuniões em linha do tempo' },
  { icon: '◎', label: 'Tarefas e follow-ups', desc: 'Lembretes automáticos e checklists por oportunidade' },
  { icon: '◇', label: 'Controle de pagamentos', desc: 'Status de propostas, contratos e recebimentos' },
]

export default function CRM() {
  return (
    <>
      <Head><title>CRM — Aexum</title></Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
        <Sidebar />

        <main style={{ flex: 1, padding: '48px 48px', maxWidth: 860 }}>

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
