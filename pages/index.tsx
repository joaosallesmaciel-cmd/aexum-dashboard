import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMsg { role: 'user' | 'bia'; text: string }

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',
    price: 'R$ 297',
    period: '/mês',
    highlight: false,
    items: [
      '1 número WhatsApp',
      'Até 500 conversas/mês',
      'Base de conhecimento (5 docs)',
      'CRM integrado',
      'Suporte por email',
    ],
    cta: 'Começar grátis',
    ctaHref: '/register',
  },
  {
    name: 'Pro',
    price: 'R$ 597',
    period: '/mês',
    highlight: true,
    badge: 'Mais popular',
    items: [
      '1 número WhatsApp',
      'Conversas ilimitadas',
      'Base de conhecimento ilimitada',
      'CRM + relatórios avançados',
      'Handoff para humano',
      'Suporte prioritário',
      'API access',
    ],
    cta: 'Começar grátis',
    ctaHref: '/register',
  },
  {
    name: 'Agency',
    price: 'R$ 1.497',
    period: '/mês',
    highlight: false,
    items: [
      'Até 5 números WhatsApp',
      'Multi-tenant (revenda)',
      'White-label disponível',
      'Onboarding dedicado',
      'SLA garantido',
    ],
    cta: 'Falar com vendas',
    ctaHref: 'mailto:contato@aexum.com.br',
  },
]

const FAQS = [
  {
    q: 'Preciso instalar algum aplicativo?',
    a: 'Não. Tudo funciona pelo navegador. Seu WhatsApp fica conectado via QR code na nossa plataforma.',
  },
  {
    q: 'A IA fala só o que eu configurar?',
    a: 'Sim. A Bia responde apenas com base no conteúdo que você adicionar — preços, serviços, FAQs. Nunca inventa informações.',
  },
  {
    q: 'E se o cliente quiser falar com humano?',
    a: 'A IA detecta automaticamente e aciona o handoff. Você recebe notificação e assume a conversa.',
  },
  {
    q: 'Funciona com qualquer número de WhatsApp?',
    a: 'Sim, funciona com número pessoal ou comercial. Recomendamos usar um número exclusivo para o negócio.',
  },
  {
    q: 'Como é o suporte durante o teste?',
    a: 'Você tem acesso ao suporte por email e à nossa documentação completa durante os 14 dias.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. Sem multa, sem fidelidade. Cancele quando quiser direto pelo painel.',
  },
]

const NICHES = [
  { icon: '💆', title: 'Clínicas de Estética', desc: 'Agendamentos automáticos, confirmações e lembretes' },
  { icon: '🦷', title: 'Consultórios Odontológicos', desc: 'Triagem de pacientes e resposta a dúvidas frequentes' },
  { icon: '🏋️', title: 'Academias e Studios', desc: 'Matrículas, planos e retenção de alunos' },
  { icon: '🏠', title: 'Imobiliárias', desc: 'Qualificação de leads e agendamento de visitas' },
  { icon: '📱', title: 'Agências de Marketing', desc: 'Atendimento dos clientes finais com sua marca' },
  { icon: '🥗', title: 'Nutricionistas e Coaches', desc: 'Onboarding de pacientes e follow-up automatizado' },
]

const METRICS = [
  { value: '24/7', label: 'Atendimento ininterrupto' },
  { value: '<3s', label: 'Tempo médio de resposta' },
  { value: '-60%', label: 'Redução de custo por atendimento' },
  { value: '14 dias', label: 'Teste gratuito completo' },
]

const HERO_MSGS = [
  { role: 'user' as const, text: 'Olá! Qual o valor do procedimento de limpeza de pele?' },
  { role: 'bia' as const, text: 'Olá! A limpeza de pele profunda custa R$ 180. Inclui hidratação e dura cerca de 60 minutos. Quer agendar?' },
  { role: 'user' as const, text: 'Sim! Tem horário amanhã à tarde?' },
  { role: 'bia' as const, text: 'Temos às 14h e às 16h disponíveis. Qual prefere? Posso confirmar agora mesmo!' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'bia', text: 'Olá! 👋 Sou a Bia, atendente virtual de demonstração do Aexum. Pode me perguntar sobre preços, horários, serviços — respondo como responderia para seus clientes!' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const demoRef = useRef<HTMLDivElement>(null)
  const [demoVisible, setDemoVisible] = useState(false)

  // Auth check — redirect if logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace('/crm')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  // Hero WhatsApp animation
  useEffect(() => {
    if (!authChecked) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleMsgs(i)
      if (i >= HERO_MSGS.length) clearInterval(interval)
    }, 1200)
    return () => clearInterval(interval)
  }, [authChecked])

  // Intersection observer for demo lazy init
  useEffect(() => {
    if (!demoRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDemoVisible(true) },
      { threshold: 0.2 }
    )
    obs.observe(demoRef.current)
    return () => obs.disconnect()
  }, [authChecked])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMsgs])

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setChatMsgs(prev => [...prev, { role: 'bia', text: data.reply || data.error || 'Erro ao responder.' }])
    } catch {
      setChatMsgs(prev => [...prev, { role: 'bia', text: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (!authChecked) return null

  return (
    <>
      <Head>
        <title>Aexum — Seu WhatsApp que vende 24h por dia</title>
        <meta name="description" content="SaaS de atendimento inteligente via WhatsApp. IA treinada no seu negócio, CRM integrado, qualificação de leads automática." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>⚡</text></svg>" />
      </Head>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        @font-face {
          font-family: 'Astera';
          src: url('/fonts/Astera.ttf') format('truetype');
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Montserrat', sans-serif; color: #000; background: #fff; -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrollLeft {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .fade-up { animation: fadeInUp 0.6s ease forwards; }
        .nav-link {
          font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.7);
          transition: color 0.15s; cursor: pointer;
        }
        .nav-link:hover { color: #c5eb2d; }
        .btn-primary {
          background: #c5eb2d; color: #000; border: none;
          border-radius: 8px; padding: 12px 24px;
          font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
          display: inline-block;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(197,235,45,0.4); }
        .btn-outline {
          background: transparent; color: #000; border: 1.5px solid #000;
          border-radius: 8px; padding: 11px 24px;
          font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: transform 0.15s, background 0.15s;
          display: inline-block;
        }
        .btn-outline:hover { transform: translateY(-1px); background: rgba(0,0,0,0.04); }
        .btn-outline-white {
          background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.4);
          border-radius: 8px; padding: 11px 24px;
          font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: border-color 0.15s;
          display: inline-block;
        }
        .btn-outline-white:hover { border-color: #c5eb2d; color: #c5eb2d; }
        .plan-card {
          background: #fff; border: 1.5px solid #e5e5e5; border-radius: 16px;
          padding: 32px 28px; flex: 1; min-width: 260px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
        .plan-card.highlight { border-color: #c5eb2d; box-shadow: 0 4px 24px rgba(197,235,45,0.2); }
        .faq-item { border-bottom: 1px solid #e5e5e5; }
        .faq-btn {
          width: 100%; background: none; border: none; cursor: pointer;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 0; font-family: 'Montserrat', sans-serif;
          font-size: 15px; font-weight: 600; color: #000; text-align: left;
        }
        .faq-answer {
          overflow: hidden; transition: max-height 0.3s ease;
          font-size: 14px; color: #555; line-height: 1.7;
        }
        .niche-card {
          background: #fff; border: 1px solid #e5e5e5; border-radius: 12px;
          padding: 24px; transition: transform 0.15s, box-shadow 0.15s;
        }
        .niche-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .hero-msg {
          animation: msgIn 0.4s ease forwards;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 3px; }

        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .plans-grid { flex-direction: column !important; }
          .niches-grid { grid-template-columns: 1fr 1fr !important; }
          .metrics-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-h1 { font-size: 36px !important; }
          .hero-sub { font-size: 18px !important; }
          .hero-ctas { flex-direction: column !important; }
          .nav-links-desktop { display: none !important; }
          .hamburger { display: flex !important; }
          .section-title { font-size: 28px !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ fontFamily: "'Astera', sans-serif", fontSize: 22, color: '#c5eb2d', letterSpacing: '0.5em' }}>
            AEXUM
          </div>

          {/* Desktop links */}
          <div className="nav-links-desktop" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Como funciona', 'Para quem é', 'Planos', 'FAQ'].map(l => (
              <a key={l} className="nav-link" href={`#${l.toLowerCase().replace(/\s/g, '-').replace('ê', 'e').replace('ã', 'a')}`}>{l}</a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="nav-links-desktop" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/login" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c5eb2d')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
              Entrar
            </a>
            <a href="/register" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
              Teste grátis
            </a>
          </div>

          {/* Hamburger */}
          <button
            className="hamburger"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5 }}
            onClick={() => setMenuOpen(v => !v)}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, display: 'block' }} />
            ))}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {['Como funciona', 'Para quem é', 'Planos', 'FAQ'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g, '-')}`}
                style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}
                onClick={() => setMenuOpen(false)}>
                {l}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <a href="/login" className="btn-outline-white" style={{ flex: 1, textAlign: 'center', padding: '10px' }}>Entrar</a>
              <a href="/register" className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '10px' }}>Teste grátis</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{
        paddingTop: 120, paddingBottom: 80,
        background: 'linear-gradient(160deg, #f4f4f5 0%, #ffffff 60%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Dot grid bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
          backgroundSize: '28px 28px', opacity: 0.5,
        }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <div className="hero-grid" style={{ display: 'flex', alignItems: 'center', gap: 64 }}>

            {/* Left — copy */}
            <div style={{ flex: 1 }}>
              <div className="fade-up" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(197,235,45,0.12)', borderRadius: 20,
                padding: '4px 14px', marginBottom: 24,
                fontSize: 12, fontWeight: 600, color: '#5a7a00', letterSpacing: '0.04em',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c5eb2d', display: 'inline-block' }} />
                ATENDIMENTO INTELIGENTE VIA WHATSAPP
              </div>

              <h1 className="hero-h1 fade-up" style={{
                fontSize: 56, fontWeight: 900, lineHeight: 1.1, color: '#000',
                marginBottom: 24, letterSpacing: '-0.02em',
                animationDelay: '0.1s',
              }}>
                Seu WhatsApp que<br />
                <span style={{ color: '#5a7a00' }}>vende 24h</span> por dia.
              </h1>

              <p className="hero-sub fade-up" style={{
                fontSize: 20, color: '#555', lineHeight: 1.6, marginBottom: 36,
                maxWidth: 480, animationDelay: '0.2s',
              }}>
                CRM integrado, IA treinada no seu negócio. Qualifica leads, responde dúvidas e agenda reuniões — enquanto você foca no que importa.
              </p>

              <div className="hero-ctas fade-up" style={{ display: 'flex', gap: 12, marginBottom: 20, animationDelay: '0.3s' }}>
                <a href="/register" className="btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
                  Diagnóstico gratuito
                </a>
                <a href="#demo" className="btn-outline" style={{ fontSize: 15, padding: '13px 28px' }}>
                  Ver demonstração
                </a>
              </div>

              <p className="fade-up" style={{ fontSize: 12, color: '#888', animationDelay: '0.4s' }}>
                Sem cartão de crédito · Cancele quando quiser · Setup em 10 minutos
              </p>
            </div>

            {/* Right — WhatsApp mockup */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: 320, background: '#fff', borderRadius: 20,
                boxShadow: '0 8px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}>
                {/* WA Header */}
                <div style={{ background: '#075e54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#c5eb2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#000', flexShrink: 0 }}>B</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Bia — Aexum</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                      online agora
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{
                  background: '#ece5dd', padding: '16px 12px',
                  minHeight: 260, display: 'flex', flexDirection: 'column', gap: 8,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E")`,
                }}>
                  {HERO_MSGS.slice(0, visibleMsgs).map((m, i) => (
                    <div key={i} className="hero-msg" style={{
                      display: 'flex',
                      justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px', borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                        background: m.role === 'user' ? '#dcf8c6' : '#fff',
                        fontSize: 12.5, color: '#111', lineHeight: 1.5,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {visibleMsgs > 0 && visibleMsgs < HERO_MSGS.length && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ background: '#fff', borderRadius: '2px 12px 12px 12px', padding: '8px 14px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#999', display: 'inline-block', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* WA input */}
                <div style={{ background: '#f0f0f0', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '8px 14px', fontSize: 12, color: '#999' }}>
                    Mensagem
                  </div>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#075e54', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / SOCIAL PROOF ── */}
      <section style={{ background: '#000', padding: '40px 0', overflow: 'hidden' }}>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.12em', marginBottom: 24, textTransform: 'uppercase' }}>
          Empresas que já automatizaram seu atendimento
        </p>
        <div style={{ display: 'flex', overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
          <div style={{ display: 'flex', gap: 48, animation: 'scrollLeft 18s linear infinite', whiteSpace: 'nowrap', minWidth: 'max-content' }}>
            {[...['Clínica Estética', 'Odontologia', 'Academia', 'Imobiliária', 'Marketing Digital', 'Nutrição', 'Personal Trainer', 'Studio de Pilates', 'Psicologia', 'Advocacia'], ...['Clínica Estética', 'Odontologia', 'Academia', 'Imobiliária', 'Marketing Digital', 'Nutrição', 'Personal Trainer', 'Studio de Pilates', 'Psicologia', 'Advocacia']].map((name, i) => (
              <span key={i} style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', flexShrink: 0 }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={{ background: '#f4f4f5', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="section-title" style={{ fontSize: 36, fontWeight: 800, color: '#000', marginBottom: 12 }}>Como funciona</h2>
            <p style={{ fontSize: 16, color: '#666', maxWidth: 480, margin: '0 auto' }}>
              Configure em minutos. Sem código, sem complicação.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              {
                step: '01', icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c5eb2d" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"/>
                  </svg>
                ),
                title: 'Conecte seu WhatsApp',
                desc: 'Em 10 minutos seu número está ativo com a IA configurada para o seu negócio.',
              },
              {
                step: '02', icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c5eb2d" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                ),
                title: 'Treine com seu conteúdo',
                desc: 'Adicione seus preços, serviços, FAQs. A IA aprende e responde com precisão.',
              },
              {
                step: '03', icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c5eb2d" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ),
                title: 'Venda enquanto dorme',
                desc: 'Leads qualificados, agendamentos confirmados e clientes respondidos — 24 horas por dia.',
              },
            ].map((item) => (
              <div key={item.step} style={{
                background: '#fff', borderRadius: 16, padding: '32px 28px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(197,235,45,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#c5eb2d', fontWeight: 600, letterSpacing: '0.08em' }}>
                    PASSO {item.step}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#000', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" style={{ background: '#fff', padding: '96px 24px' }} ref={demoRef}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="section-title" style={{ fontSize: 36, fontWeight: 800, color: '#000', marginBottom: 12 }}>
              Teste agora. Sem cadastro.
            </h2>
            <p style={{ fontSize: 16, color: '#666' }}>
              Converse com a Bia, nossa agente demo, e veja como ela atenderia seus clientes.
            </p>
          </div>

          {/* Chat window */}
          <div style={{
            background: '#fff', borderRadius: 20,
            boxShadow: '0 8px 48px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden', maxWidth: 560, margin: '0 auto',
          }}>
            {/* Header */}
            <div style={{ background: '#075e54', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#c5eb2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#000', flexShrink: 0 }}>B</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Bia — Aexum Demo</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ background: '#ece5dd', padding: '16px 14px', height: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '78%', padding: '9px 13px',
                    borderRadius: m.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                    background: m.role === 'user' ? '#dcf8c6' : '#fff',
                    fontSize: 13.5, color: '#111', lineHeight: 1.55,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#fff', borderRadius: '2px 12px 12px 12px', padding: '9px 14px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#999', display: 'inline-block', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ background: '#f0f0f0', padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Digite uma mensagem..."
                style={{
                  flex: 1, background: '#fff', border: 'none', borderRadius: 20,
                  padding: '9px 16px', fontSize: 13.5, color: '#111',
                  fontFamily: "'Montserrat', sans-serif", outline: 'none',
                }}
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none',
                  background: chatLoading ? '#ccc' : '#075e54',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: chatLoading ? 'not-allowed' : 'pointer', flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ── */}
      <section id="para-quem-e" style={{ background: '#f4f4f5', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="section-title" style={{ fontSize: 36, fontWeight: 800, color: '#000', marginBottom: 12 }}>Para quem é</h2>
            <p style={{ fontSize: 16, color: '#666' }}>Feito para empresas de serviço que dependem do WhatsApp para vender.</p>
          </div>
          <div className="niches-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {NICHES.map(n => (
              <div key={n.title} className="niche-card">
                <div style={{ fontSize: 28, marginBottom: 12 }}>{n.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#000', marginBottom: 6 }}>{n.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ── */}
      <section style={{ background: '#000', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
            {METRICS.map(m => (
              <div key={m.value}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 700, color: '#c5eb2d', marginBottom: 8 }}>{m.value}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" style={{ background: '#f4f4f5', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="section-title" style={{ fontSize: 36, fontWeight: 800, color: '#000', marginBottom: 12 }}>Planos</h2>
            <p style={{ fontSize: 16, color: '#666' }}>Todos os planos incluem 14 dias grátis. Sem cartão de crédito.</p>
          </div>

          <div className="plans-grid" style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
            {PLANS.map(p => (
              <div key={p.name} className={`plan-card${p.highlight ? ' highlight' : ''}`} style={{ position: 'relative' }}>
                {p.badge && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#c5eb2d', color: '#000', fontSize: 11, fontWeight: 700,
                    padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: '#000' }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: '#888' }}>{p.period}</span>
                </div>
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 20, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.items.map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#333' }}>
                      <span style={{ color: '#c5eb2d', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
                <a href={p.ctaHref} className={p.highlight ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', textAlign: 'center', padding: '12px', display: 'block', fontSize: 14 }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 className="section-title" style={{ fontSize: 36, fontWeight: 800, color: '#000', marginBottom: 48, textAlign: 'center' }}>Perguntas frequentes</h2>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span style={{ fontSize: 20, color: '#c5eb2d', flexShrink: 0, marginLeft: 16, transition: 'transform 0.3s', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                </button>
                <div className="faq-answer" style={{ maxHeight: openFaq === i ? 200 : 0, paddingBottom: openFaq === i ? 16 : 0 }}>
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background: '#c5eb2d', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, color: '#000', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Pronto para vender enquanto dorme?
          </h2>
          <p style={{ fontSize: 18, color: '#3a5000', marginBottom: 40 }}>
            Configure em 10 minutos. Teste 14 dias grátis.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/register" style={{
              background: '#000', color: '#fff', border: 'none',
              borderRadius: 8, padding: '14px 32px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', transition: 'transform 0.15s', display: 'inline-block',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
              Criar conta grátis
            </a>
            <a href="https://cal.com/aexum/demo" target="_blank" rel="noopener noreferrer" style={{
              background: 'transparent', color: '#000', border: '2px solid rgba(0,0,0,0.3)',
              borderRadius: 8, padding: '13px 32px', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', display: 'inline-block', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#000')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)')}>
              Agendar uma demo
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ fontFamily: "'Astera', sans-serif", fontSize: 18, color: '#c5eb2d', letterSpacing: '0.5em' }}>
            AEXUM
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {['Termos de uso', 'Privacidade', 'Suporte'].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: '#666', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#999')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
                {l}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* Instagram */}
            <a href="#" style={{ color: '#555', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c5eb2d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" style={{ color: '#555', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c5eb2d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          </div>
        </div>
        <div style={{ maxWidth: 1140, margin: '20px auto 0', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, textAlign: 'center', fontSize: 12, color: '#444' }}>
          © 2026 Aexum. Todos os direitos reservados.
        </div>
      </footer>
    </>
  )
}
