import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',
    price: 'R$ 297',
    period: '/mês',
    highlight: false,
    items: ['1 número WhatsApp', 'Até 500 conversas/mês', 'Base de conhecimento (5 docs)', 'CRM integrado', 'Suporte por email'],
    cta: 'Começar grátis',
    ctaHref: '/register',
  },
  {
    name: 'Pro',
    price: 'R$ 597',
    period: '/mês',
    highlight: true,
    badge: 'Mais popular',
    items: ['1 número WhatsApp', 'Conversas ilimitadas', 'Base de conhecimento ilimitada', 'CRM + relatórios avançados', 'Handoff para humano', 'Suporte prioritário', 'API access'],
    cta: 'Começar grátis',
    ctaHref: '/register',
  },
  {
    name: 'Agency',
    price: 'R$ 1.497',
    period: '/mês',
    highlight: false,
    items: ['Até 5 números WhatsApp', 'Multi-tenant (revenda)', 'White-label disponível', 'Onboarding dedicado', 'SLA garantido'],
    cta: 'Falar com vendas',
    ctaHref: 'https://wa.me/5511999999999',
  },
]

const FAQS = [
  { q: 'Preciso instalar algum aplicativo?', a: 'Não. Tudo funciona pelo navegador. Seu WhatsApp fica conectado via QR code na nossa plataforma.' },
  { q: 'A IA fala só o que eu configurar?', a: 'Sim. A Bia responde apenas com base no conteúdo que você adicionar — preços, serviços, FAQs. Nunca inventa informações.' },
  { q: 'E se o cliente quiser falar com humano?', a: 'A IA detecta automaticamente e aciona o handoff. Você recebe notificação e assume a conversa no mesmo painel.' },
  { q: 'Funciona com qualquer número de WhatsApp?', a: 'Sim, funciona com número pessoal ou comercial. Recomendamos usar um número exclusivo para o negócio.' },
  { q: 'Como é o suporte durante o teste?', a: 'Suporte por email e WhatsApp, segunda a sábado, com resposta em até 2 horas, durante os 14 dias de teste.' },
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Sem multa, sem fidelidade. Cancele quando quiser direto pelo painel.' },
]

const NICHES = [
  { icon: '💆', title: 'Clínicas de Estética', desc: 'Agendamentos automáticos, confirmações e lembretes' },
  { icon: '🦷', title: 'Consultórios Odontológicos', desc: 'Triagem de pacientes e resposta a dúvidas frequentes' },
  { icon: '🏋️', title: 'Academias e Studios', desc: 'Matrículas, planos e retenção de alunos' },
  { icon: '🏠', title: 'Imobiliárias', desc: 'Qualificação de leads e agendamento de visitas' },
  { icon: '📱', title: 'Agências de Marketing', desc: 'Atendimento dos clientes finais com sua marca' },
  { icon: '🥗', title: 'Nutricionistas e Coaches', desc: 'Onboarding de pacientes e follow-up automatizado' },
]

const TESTIMONIALS = [
  {
    name: 'Marcos Ribeiro',
    role: 'CEO',
    company: 'Varejo+ Distribuidora',
    text: 'Em 3 meses cortamos 70% do trabalho manual da equipe. O atendimento via WhatsApp da Aexum virou nosso melhor vendedor — nunca dorme e nunca perde um lead.',
    initial: 'M',
  },
  {
    name: 'Camila Santos',
    role: 'Diretora',
    company: 'NovaPME Serviços',
    text: 'Sempre achei que IA era coisa de grande empresa. A Aexum provou o contrário — em 2 semanas já tinha dashboard preditivo mostrando onde estava perdendo dinheiro.',
    initial: 'C',
  },
  {
    name: 'Rafael Lima',
    role: 'Fundador',
    company: 'Comercia Atacado',
    text: 'Testei 4 plataformas antes. A Aexum é a única que realmente entende a realidade do negócio brasileiro — preço justo, suporte em português e resultado rápido.',
    initial: 'R',
  },
]

const HERO_MSGS = [
  { role: 'user' as const, text: 'Olá! Qual o valor do procedimento de limpeza de pele?' },
  { role: 'bia' as const, text: 'Olá! A limpeza de pele profunda custa R$ 180. Inclui hidratação e dura cerca de 60 minutos. Quer agendar?' },
  { role: 'user' as const, text: 'Sim! Tem horário amanhã à tarde?' },
  { role: 'bia' as const, text: 'Temos às 14h e às 16h disponíveis. Qual prefere? Posso confirmar agora mesmo!' },
]

type ChatMsg = { role: 'user' | 'bia'; text: string }

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [visibleMsgs, setVisibleMsgs] = useState(0)
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([
    { role: 'bia', text: 'Olá! Sou a Bia, atendente virtual de demonstração do Aexum. Pode me perguntar sobre preços, horários ou serviços — respondo como responderia para seus clientes!' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Redirecionar usuários já logados silenciosamente, sem bloquear a landing
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/crm')
    })
  }, [router])

  useEffect(() => {
    let i = 0
    const t = setInterval(() => { i++; setVisibleMsgs(i); if (i >= HERO_MSGS.length) clearInterval(t) }, 1200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs])

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatMsgs(p => [...p, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setChatMsgs(p => [...p, { role: 'bia', text: data.reply || data.error || 'Erro ao responder.' }])
    } catch {
      setChatMsgs(p => [...p, { role: 'bia', text: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Aexum — Seu WhatsApp que vende 24h por dia</title>
        <meta name="description" content="IA de atendimento treinada no seu negócio, CRM integrado e qualificação automática de leads via WhatsApp. Setup em 5 minutos, 14 dias grátis." />
        <meta property="og:title" content="Aexum — Seu WhatsApp que vende 24h por dia" />
        <meta property="og:description" content="IA de atendimento treinada no seu negócio. Qualifica leads, agenda reuniões e responde clientes 24/7." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>⚡</text></svg>" />
      </Head>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
        @font-face { font-family:'Astera'; src:url('/fonts/Astera.ttf') format('truetype'); }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{font-family:'Montserrat',sans-serif;color:#000;background:#fff;-webkit-font-smoothing:antialiased;}
        a{color:inherit;text-decoration:none;}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scrollLeft{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        .fade-up{animation:fadeInUp .6s ease forwards;}
        .fade-up-1{animation:fadeInUp .6s .1s ease both;}
        .fade-up-2{animation:fadeInUp .6s .2s ease both;}
        .fade-up-3{animation:fadeInUp .6s .35s ease both;}
        .fade-up-4{animation:fadeInUp .6s .5s ease both;}

        .btn-lime{background:#c5eb2d;color:#000;border:none;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s;display:inline-block;text-align:center;}
        .btn-lime:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(197,235,45,.45);}
        .btn-dark{background:#000;color:#fff;border:none;border-radius:8px;padding:13px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:transform .15s,opacity .15s;display:inline-block;text-align:center;}
        .btn-dark:hover{transform:translateY(-2px);opacity:.85;}
        .btn-outline{background:transparent;color:#000;border:1.5px solid #000;border-radius:8px;padding:12px 28px;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:transform .15s,background .15s;display:inline-block;text-align:center;}
        .btn-outline:hover{transform:translateY(-2px);background:rgba(0,0,0,.04);}
        .btn-outline-w{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.35);border-radius:8px;padding:8px 20px;font-family:'Montserrat',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:border-color .15s,color .15s;display:inline-block;}
        .btn-outline-w:hover{border-color:#c5eb2d;color:#c5eb2d;}

        .plan-card{background:#fff;border:1.5px solid #e5e5e5;border-radius:20px;padding:36px 28px;flex:1;min-width:260px;transition:transform .2s,box-shadow .2s;}
        .plan-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.08);}
        .plan-card.hl{border-color:#c5eb2d;box-shadow:0 4px 24px rgba(197,235,45,.25);}

        .niche-card{background:#fff;border:1px solid #e5e5e5;border-radius:14px;padding:28px 24px;transition:transform .15s,box-shadow .15s;}
        .niche-card:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.07);}

        .faq-item{border-bottom:1px solid #e5e5e5;}
        .faq-btn{width:100%;background:none;border:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:22px 0;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;color:#000;text-align:left;gap:16px;}
        .faq-body{overflow:hidden;transition:max-height .35s ease,padding-bottom .35s ease;font-size:14px;color:#555;line-height:1.75;}

        .tcard{background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:28px 24px;box-shadow:0 2px 12px rgba(0,0,0,.05);}

        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-thumb{background:#d4d4d4;border-radius:3px;}

        @media(max-width:768px){
          .hero-grid{flex-direction:column!important;}
          .hero-h1{font-size:36px!important;line-height:1.15!important;}
          .hero-sub{font-size:17px!important;}
          .hero-ctas{flex-direction:column!important;}
          .nav-desktop{display:none!important;}
          .hamburger{display:flex!important;}
          .plans-grid{flex-direction:column!important;}
          .niches-grid{grid-template-columns:1fr 1fr!important;}
          .metrics-grid{grid-template-columns:1fr 1fr!important;gap:32px!important;}
          .tgrid{grid-template-columns:1fr!important;}
          .section-h{font-size:28px!important;}
          .cta-h{font-size:30px!important;}
          .cta-btns{flex-direction:column!important;align-items:center!important;}
          .footer-inner{flex-direction:column!important;align-items:flex-start!important;gap:24px!important;}
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(0,0,0,0.93)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth:1140, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ fontFamily:"'Astera',sans-serif", fontSize:20, color:'#c5eb2d', letterSpacing:'0.5em' }}>AEXUM</a>

          <div className="nav-desktop" style={{ display:'flex', gap:28, alignItems:'center' }}>
            {[['#como-funciona','Como funciona'],['#para-quem','Para quem é'],['#planos','Planos'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.65)', transition:'color .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#c5eb2d')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.65)')}>{label}</a>
            ))}
          </div>

          <div className="nav-desktop" style={{ display:'flex', gap:12, alignItems:'center' }}>
            <a href="/login" style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.6)', transition:'color .15s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.6)')}>Entrar</a>
            <a href="/register" className="btn-lime" style={{ padding:'9px 20px', fontSize:13 }}>Teste grátis</a>
          </div>

          <button className="hamburger" style={{ display:'none', background:'none', border:'none', cursor:'pointer', flexDirection:'column', gap:5 }}
            onClick={() => setMenuOpen(v=>!v)}>
            {[0,1,2].map(i=><span key={i} style={{ width:22, height:2, background:'#fff', borderRadius:2, display:'block' }}/>)}
          </button>
        </div>

        {menuOpen && (
          <div style={{ background:'#000', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'16px 24px', display:'flex', flexDirection:'column', gap:16 }}>
            {[['#como-funciona','Como funciona'],['#para-quem','Para quem é'],['#planos','Planos'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} style={{ fontSize:15, color:'rgba(255,255,255,0.8)', fontWeight:500 }} onClick={()=>setMenuOpen(false)}>{label}</a>
            ))}
            <div style={{ display:'flex', gap:12, paddingTop:8 }}>
              <a href="/login" className="btn-outline-w" style={{ flex:1, textAlign:'center', padding:'11px' }}>Entrar</a>
              <a href="/register" className="btn-lime" style={{ flex:1, textAlign:'center', padding:'11px', fontSize:13 }}>Teste grátis</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop:128, paddingBottom:96, background:'linear-gradient(155deg,#f4f4f5 0%,#ffffff 55%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,#d4d4d4 1px,transparent 1px)', backgroundSize:'28px 28px', opacity:.45, pointerEvents:'none' }}/>

        <div style={{ maxWidth:1140, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>
          <div className="hero-grid" style={{ display:'flex', alignItems:'center', gap:72 }}>

            {/* Copy */}
            <div style={{ flex:1 }}>
              <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(197,235,45,0.13)', borderRadius:20, padding:'5px 16px', marginBottom:28, fontSize:12, fontWeight:700, color:'#4a6000', letterSpacing:'0.05em' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:'#c5eb2d', display:'inline-block' }}/>
                ATENDIMENTO INTELIGENTE VIA WHATSAPP
              </div>

              <h1 className="hero-h1 fade-up-1" style={{ fontSize:58, fontWeight:900, lineHeight:1.08, color:'#000', marginBottom:24, letterSpacing:'-0.025em' }}>
                Pare de perder clientes<br />
                <span style={{ color:'#4a6000' }}>fora do horário.</span>
              </h1>

              <p className="hero-sub fade-up-2" style={{ fontSize:20, color:'#555', lineHeight:1.65, marginBottom:36, maxWidth:500 }}>
                IA treinada no seu negócio responde clientes, qualifica leads e agenda reuniões — 24 horas por dia, no WhatsApp deles.
              </p>

              <div className="hero-ctas fade-up-3" style={{ display:'flex', gap:14, marginBottom:22, flexWrap:'wrap' }}>
                <a href="https://wa.me/5511999999999" className="btn-lime">Diagnóstico gratuito</a>
                <a href="#demo" className="btn-outline">Ver demonstração</a>
              </div>

              <p className="fade-up-4" style={{ fontSize:12, color:'#888' }}>
                Sem cartão de crédito · Cancele quando quiser · Setup em 5 minutos
              </p>
            </div>

            {/* WhatsApp mockup */}
            <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
              <div style={{ width:320, background:'#fff', borderRadius:22, boxShadow:'0 20px 60px rgba(0,0,0,0.13), 0 4px 12px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                <div style={{ background:'#075e54', padding:'13px 16px', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'#c5eb2d', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15, color:'#000', flexShrink:0 }}>B</div>
                  <div>
                    <div style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Bia — Seu negócio</div>
                    <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11, display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block', animation:'blink 2s step-end infinite' }}/>
                      online agora
                    </div>
                  </div>
                </div>

                <div style={{ background:'#ece5dd', padding:'16px 12px', minHeight:268, display:'flex', flexDirection:'column', gap:9 }}>
                  {HERO_MSGS.slice(0, visibleMsgs).map((m, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', animation:'msgIn .4s ease forwards' }}>
                      <div style={{ maxWidth:'82%', padding:'9px 13px', borderRadius:m.role==='user'?'12px 2px 12px 12px':'2px 12px 12px 12px', background:m.role==='user'?'#dcf8c6':'#fff', fontSize:12.5, color:'#111', lineHeight:1.55, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {visibleMsgs > 0 && visibleMsgs < HERO_MSGS.length && (
                    <div style={{ display:'flex', justifyContent:'flex-start' }}>
                      <div style={{ background:'#fff', borderRadius:'2px 12px 12px 12px', padding:'10px 15px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                          {[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#aaa', display:'inline-block', animation:`pulse 1.2s ease ${i*.2}s infinite` }}/>)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ background:'#f0f0f0', padding:'9px 12px', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, background:'#fff', borderRadius:20, padding:'8px 14px', fontSize:12, color:'#999' }}>Mensagem</div>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#075e54', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF SCROLL ── */}
      <section style={{ background:'#000', padding:'36px 0', overflow:'hidden' }}>
        <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.14em', marginBottom:22, textTransform:'uppercase' }}>
          Empresas que já automatizaram seu atendimento
        </p>
        <div style={{ overflow:'hidden', maskImage:'linear-gradient(90deg,transparent 0%,black 12%,black 88%,transparent 100%)' }}>
          <div style={{ display:'flex', gap:56, animation:'scrollLeft 20s linear infinite', whiteSpace:'nowrap', minWidth:'max-content' }}>
            {[...['Clínica Estética','Odontologia','Academia','Imobiliária','Marketing Digital','Nutrição','Personal Trainer','Studio de Pilates','Psicologia','Advocacia','Consultoria'],
              ...['Clínica Estética','Odontologia','Academia','Imobiliária','Marketing Digital','Nutrição','Personal Trainer','Studio de Pilates','Psicologia','Advocacia','Consultoria']
            ].map((name, i) => (
              <span key={i} style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.3)', letterSpacing:'0.05em', flexShrink:0 }}>
                ✦ {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" style={{ background:'#f4f4f5', padding:'100px 24px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <h2 className="section-h" style={{ fontSize:38, fontWeight:800, color:'#000', marginBottom:14 }}>Como funciona</h2>
            <p style={{ fontSize:17, color:'#666', maxWidth:480, margin:'0 auto' }}>Configure em minutos. Sem código, sem complicação.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
            {[
              { n:'01', title:'Conecte seu WhatsApp', desc:'Em 5 minutos seu número está ativo com a IA configurada para o seu negócio via QR code.', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c5eb2d" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { n:'02', title:'Treine com seu conteúdo', desc:'Adicione seus preços, serviços e FAQs. A IA aprende e responde com precisão — nunca inventa informações.', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c5eb2d" strokeWidth="1.8" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
              { n:'03', title:'Venda enquanto dorme', desc:'Leads qualificados, agendamentos confirmados e clientes respondidos — 24 horas por dia, 7 dias por semana.', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c5eb2d" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
            ].map(item => (
              <div key={item.n} style={{ background:'#fff', borderRadius:18, padding:'32px 28px', boxShadow:'0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                  <div style={{ width:50, height:50, borderRadius:13, background:'rgba(197,235,45,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.icon}</div>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#c5eb2d', fontWeight:600, letterSpacing:'0.1em' }}>PASSO {item.n}</span>
                </div>
                <h3 style={{ fontSize:18, fontWeight:700, color:'#000', marginBottom:10 }}>{item.title}</h3>
                <p style={{ fontSize:14, color:'#666', lineHeight:1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" style={{ background:'#fff', padding:'100px 24px' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h2 className="section-h" style={{ fontSize:38, fontWeight:800, color:'#000', marginBottom:14 }}>Teste agora. Sem cadastro.</h2>
            <p style={{ fontSize:17, color:'#666' }}>Converse com a Bia e veja como ela atenderia seus clientes.</p>
          </div>

          <div style={{ background:'#fff', borderRadius:22, boxShadow:'0 12px 56px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)', overflow:'hidden' }}>
            <div style={{ background:'#075e54', padding:'13px 18px', display:'flex', alignItems:'center', gap:13 }}>
              <div style={{ width:42, height:42, borderRadius:'50%', background:'#c5eb2d', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:17, color:'#000', flexShrink:0 }}>B</div>
              <div>
                <div style={{ color:'#fff', fontWeight:600, fontSize:15 }}>Bia — Aexum Demo</div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', display:'inline-block' }}/>online
                </div>
              </div>
            </div>

            <div style={{ background:'#ece5dd', padding:'16px 14px', height:340, overflowY:'auto', display:'flex', flexDirection:'column', gap:9 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                  <div style={{ maxWidth:'78%', padding:'9px 14px', borderRadius:m.role==='user'?'12px 2px 12px 12px':'2px 12px 12px 12px', background:m.role==='user'?'#dcf8c6':'#fff', fontSize:13.5, color:'#111', lineHeight:1.6, boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display:'flex', justifyContent:'flex-start' }}>
                  <div style={{ background:'#fff', borderRadius:'2px 12px 12px 12px', padding:'10px 15px', boxShadow:'0 1px 2px rgba(0,0,0,0.1)' }}>
                    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                      {[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#aaa', display:'inline-block', animation:`pulse 1.2s ease ${i*.2}s infinite` }}/>)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            <div style={{ background:'#f0f0f0', padding:'10px 14px', display:'flex', gap:10, alignItems:'center' }}>
              <input
                value={chatInput}
                onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&sendChat()}
                placeholder="Digite uma mensagem..."
                style={{ flex:1, background:'#fff', border:'none', borderRadius:22, padding:'10px 17px', fontSize:13.5, color:'#111', fontFamily:"'Montserrat',sans-serif", outline:'none' }}
              />
              <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{ width:42, height:42, borderRadius:'50%', border:'none', background:chatLoading?'#ccc':'#075e54', display:'flex', alignItems:'center', justifyContent:'center', cursor:chatLoading?'not-allowed':'pointer', flexShrink:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ── */}
      <section id="para-quem" style={{ background:'#f4f4f5', padding:'100px 24px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 className="section-h" style={{ fontSize:38, fontWeight:800, color:'#000', marginBottom:14 }}>Para quem é</h2>
            <p style={{ fontSize:17, color:'#666' }}>Feito para empresas de serviço que dependem do WhatsApp para vender.</p>
          </div>
          <div className="niches-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {NICHES.map(n => (
              <div key={n.title} className="niche-card">
                <div style={{ fontSize:30, marginBottom:14 }}>{n.icon}</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#000', marginBottom:7 }}>{n.title}</h3>
                <p style={{ fontSize:13.5, color:'#666', lineHeight:1.65 }}>{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section style={{ background:'#fff', padding:'100px 24px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 className="section-h" style={{ fontSize:38, fontWeight:800, color:'#000', marginBottom:14 }}>O que nossos clientes dizem</h2>
            <p style={{ fontSize:17, color:'#666' }}>Resultados reais de quem já automatizou o atendimento.</p>
          </div>
          <div className="tgrid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="tcard">
                <div style={{ display:'flex', gap:4, marginBottom:18 }}>
                  {[0,1,2,3,4].map(i=><span key={i} style={{ color:'#c5eb2d', fontSize:16 }}>★</span>)}
                </div>
                <p style={{ fontSize:14.5, color:'#333', lineHeight:1.75, marginBottom:22, fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'#000', color:'#c5eb2d', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:15, flexShrink:0 }}>{t.initial}</div>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:'#000' }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÉTRICAS ── */}
      <section style={{ background:'#000', padding:'80px 24px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div className="metrics-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', textAlign:'center' }}>
            {[
              { v:'70%', l:'Das mensagens resolvidas pela IA' },
              { v:'24/7', l:'Atendimento ininterrupto' },
              { v:'<3s', l:'Tempo médio de resposta' },
              { v:'14 dias', l:'Teste gratuito completo' },
            ].map(m => (
              <div key={m.v} style={{ padding:'20px 16px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:42, fontWeight:700, color:'#c5eb2d', marginBottom:10 }}>{m.v}</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.55)', fontWeight:500, lineHeight:1.5 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" style={{ background:'#f4f4f5', padding:'100px 24px' }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 className="section-h" style={{ fontSize:38, fontWeight:800, color:'#000', marginBottom:14 }}>Planos</h2>
            <p style={{ fontSize:17, color:'#666' }}>Todos os planos incluem 14 dias grátis. Sem cartão de crédito.</p>
          </div>

          <div className="plans-grid" style={{ display:'flex', gap:24, alignItems:'stretch' }}>
            {PLANS.map(p => (
              <div key={p.name} className={`plan-card${p.highlight?' hl':''}`} style={{ position:'relative' }}>
                {p.badge && (
                  <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'#c5eb2d', color:'#000', fontSize:11, fontWeight:700, padding:'4px 16px', borderRadius:20, whiteSpace:'nowrap' }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ marginBottom:6, fontSize:12, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'0.1em' }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:28 }}>
                  <span style={{ fontSize:38, fontWeight:900, color:'#000', letterSpacing:'-0.02em' }}>{p.price}</span>
                  <span style={{ fontSize:14, color:'#888' }}>{p.period}</span>
                </div>
                <div style={{ borderTop:'1px solid #e5e5e5', paddingTop:22, marginBottom:28, display:'flex', flexDirection:'column', gap:12 }}>
                  {p.items.map(item => (
                    <div key={item} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:'#333' }}>
                      <span style={{ color:'#c5eb2d', fontWeight:700, flexShrink:0, marginTop:1 }}>✓</span>{item}
                    </div>
                  ))}
                </div>
                <a href={p.ctaHref} className={p.highlight?'btn-lime':'btn-outline'} style={{ width:'100%', padding:'13px', fontSize:14 }}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ background:'#fff', padding:'100px 24px' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <h2 className="section-h" style={{ fontSize:38, fontWeight:800, color:'#000', marginBottom:52, textAlign:'center' }}>Perguntas frequentes</h2>
          <div>
            {FAQS.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-btn" onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  <span>{f.q}</span>
                  <span style={{ fontSize:22, color:'#c5eb2d', flexShrink:0, transition:'transform .3s', transform:openFaq===i?'rotate(45deg)':'rotate(0)', lineHeight:1 }}>+</span>
                </button>
                <div className="faq-body" style={{ maxHeight:openFaq===i?200:0, paddingBottom:openFaq===i?18:0 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ background:'#c5eb2d', padding:'100px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:620, margin:'0 auto' }}>
          <h2 className="cta-h" style={{ fontSize:42, fontWeight:900, color:'#000', marginBottom:16, letterSpacing:'-0.025em', lineHeight:1.1 }}>
            Pronto para vender enquanto dorme?
          </h2>
          <p style={{ fontSize:18, color:'rgba(0,0,0,0.6)', marginBottom:44 }}>
            Configure em 5 minutos. Teste 14 dias grátis. Suporte em português.
          </p>
          <div className="cta-btns" style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="https://wa.me/5511999999999" className="btn-dark" style={{ fontSize:15 }}>
              Quero meu diagnóstico gratuito
            </a>
            <a href="/register" style={{ background:'rgba(0,0,0,0.08)', color:'#000', border:'none', borderRadius:8, padding:'13px 28px', fontSize:15, fontWeight:600, fontFamily:"'Montserrat',sans-serif", cursor:'pointer', display:'inline-block', transition:'background .15s' }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,0,0,0.14)')}
              onMouseLeave={e=>(e.currentTarget.style.background='rgba(0,0,0,0.08)')}>
              Criar conta grátis
            </a>
          </div>
          <p style={{ fontSize:12, color:'rgba(0,0,0,0.45)', marginTop:24 }}>
            Sem cartão · Cancele quando quiser · Suporte seg–sáb, resposta em até 2h
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#000', padding:'44px 24px' }}>
        <div className="footer-inner" style={{ maxWidth:1140, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20 }}>
          <div>
            <div style={{ fontFamily:"'Astera',sans-serif", fontSize:18, color:'#c5eb2d', letterSpacing:'0.5em', marginBottom:6 }}>AEXUM</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em' }}>INTELLIGENCE SUITE</div>
          </div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {['Termos de uso','Privacidade','Suporte'].map(l => (
              <a key={l} href="#" style={{ fontSize:13, color:'#555', transition:'color .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#888')}
                onMouseLeave={e=>(e.currentTarget.style.color='#555')}>{l}</a>
            ))}
          </div>
          <div style={{ display:'flex', gap:18, alignItems:'center' }}>
            {/* Instagram */}
            <a href="#" style={{ color:'#444', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#c5eb2d')} onMouseLeave={e=>(e.currentTarget.style.color='#444')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
            </a>
            {/* LinkedIn */}
            <a href="#" style={{ color:'#444', transition:'color .15s' }} onMouseEnter={e=>(e.currentTarget.style.color='#c5eb2d')} onMouseLeave={e=>(e.currentTarget.style.color='#444')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>
        <div style={{ maxWidth:1140, margin:'20px auto 0', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:20, textAlign:'center', fontSize:12, color:'#333' }}>
          © 2026 Aexum. Todos os direitos reservados.
        </div>
      </footer>
    </>
  )
}
