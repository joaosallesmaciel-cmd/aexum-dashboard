import Head from 'next/head'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

type Tab = 'identidade' | 'script' | 'disponibilidade' | 'integracoes'

const DAYS = [
  { key: 'mon', label: 'Seg' },
  { key: 'tue', label: 'Ter' },
  { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' },
  { key: 'fri', label: 'Sex' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text)', fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.6,
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
  letterSpacing: '0.06em', marginBottom: 6, display: 'block',
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState<Tab>('identidade')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasConfig, setHasConfig] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const [form, setForm] = useState({
    is_active: false,
    agent_name: '',
    segment: '',
    company_name: '',
    company_description: '',
    tone: 'professional',
    products_services: '',
    qualification_questions: '',
    objections_script: '',
    forbidden_topics: '',
    working_hours_start: '08:00',
    working_hours_end: '18:00',
    working_days: ['mon', 'tue', 'wed', 'thu', 'fri'] as string[],
    off_hours_message: 'Olá! No momento estou fora do horário de atendimento. Retorno em breve!',
    transfer_to_human_trigger: '',
    zapi_instance: '',
    zapi_token: '',
    calendar_email: '',
    notification_email: '',
    notification_whatsapp: '',
  })

  useEffect(() => {
    fetch('/api/agent/config', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data) {
          setHasConfig(true)
          setForm(prev => ({ ...prev, ...data }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function set(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleDay(day: string) {
    setForm(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day],
    }))
  }

  async function save() {
    setSaving(true)
    const method = hasConfig ? 'PATCH' : 'POST'
    await fetch('/api/agent/config', {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setHasConfig(true)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'identidade', label: 'Identidade' },
    { key: 'script', label: 'Script de Vendas' },
    { key: 'disponibilidade', label: 'Disponibilidade' },
    { key: 'integracoes', label: 'Integrações' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Head>
        <title>Configurações — Aexum</title>
        <link rel="icon" type="image/svg+xml" href={faviconHref('dashboard')} />
      </Head>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '48px 48px' }}>
        <div style={{ maxWidth: 720 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, lineHeight: 1.1 }}>
                Configurações
              </h1>
              <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
                Configure seu agente de atendimento autônomo
              </p>
            </div>
            <button
              onClick={() => set('is_active', !form.is_active)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: form.is_active ? 'rgba(141,198,63,0.1)' : 'var(--surface2)',
                color: form.is_active ? '#8DC63F' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: form.is_active ? '#8DC63F' : 'var(--text-muted)',
              }} />
              {form.is_active ? 'Agente ativo' : 'Agente inativo'}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 16px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? 'var(--text)' : 'var(--text-muted)',
                  borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, fontFamily: 'var(--font-body)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</div>
          ) : (
            <>
              {/* Tab: Identidade */}
              {tab === 'identidade' && (
                <div>
                  <Field label="NOME DO AGENTE">
                    <input style={inputStyle} value={form.agent_name} onChange={e => set('agent_name', e.target.value)} placeholder="Ex: Sofia" />
                  </Field>
                  <Field label="SEGMENTO DO NEGÓCIO">
                    <textarea style={textareaStyle} value={form.segment} onChange={e => set('segment', e.target.value)} placeholder="Ex: Agência de marketing digital para PMEs" />
                  </Field>
                  <Field label="NOME DA EMPRESA">
                    <input style={inputStyle} value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="Ex: Aexum" />
                  </Field>
                  <Field label="DESCRIÇÃO DA EMPRESA">
                    <textarea style={textareaStyle} value={form.company_description} onChange={e => set('company_description', e.target.value)} placeholder="Descreva sua empresa em poucas linhas..." />
                  </Field>
                  <Field label="TOM DE VOZ">
                    <select
                      style={inputStyle}
                      value={form.tone}
                      onChange={e => set('tone', e.target.value)}
                    >
                      <option value="formal">Formal</option>
                      <option value="professional">Profissional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Amigável</option>
                    </select>
                  </Field>
                </div>
              )}

              {/* Tab: Script de Vendas */}
              {tab === 'script' && (
                <div>
                  <Field label="O QUE SUA EMPRESA VENDE">
                    <textarea style={{ ...textareaStyle, minHeight: 120 }} value={form.products_services} onChange={e => set('products_services', e.target.value)} placeholder="Descreva seus produtos e serviços..." />
                  </Field>
                  <Field label="PERGUNTAS DE QUALIFICAÇÃO">
                    <textarea style={{ ...textareaStyle, minHeight: 120 }} value={form.qualification_questions} onChange={e => set('qualification_questions', e.target.value)} placeholder="Ex: Qual o tamanho da sua equipe? Qual seu principal desafio hoje?" />
                  </Field>
                  <Field label="COMO RESPONDER OBJEÇÕES">
                    <textarea style={{ ...textareaStyle, minHeight: 120 }} value={form.objections_script} onChange={e => set('objections_script', e.target.value)} placeholder="Ex: Se disser que é caro, responda..." />
                  </Field>
                  <Field label="TÓPICOS PROIBIDOS">
                    <textarea style={textareaStyle} value={form.forbidden_topics} onChange={e => set('forbidden_topics', e.target.value)} placeholder="Ex: Não mencionar concorrentes, não prometer prazos" />
                  </Field>
                </div>
              )}

              {/* Tab: Disponibilidade */}
              {tab === 'disponibilidade' && (
                <div>
                  <Field label="DIAS DE ATENDIMENTO">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {DAYS.map(d => {
                        const active = form.working_days.includes(d.key)
                        return (
                          <button
                            key={d.key}
                            onClick={() => toggleDay(d.key)}
                            style={{
                              padding: '6px 14px', borderRadius: 20, border: '1px solid',
                              borderColor: active ? 'var(--accent)' : 'var(--border)',
                              background: active ? 'rgba(141,198,63,0.1)' : 'transparent',
                              color: active ? '#8DC63F' : 'var(--text-muted)',
                              fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400,
                            }}
                          >
                            {d.label}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Field label="HORÁRIO INÍCIO">
                      <input type="time" style={inputStyle} value={form.working_hours_start} onChange={e => set('working_hours_start', e.target.value)} />
                    </Field>
                    <Field label="HORÁRIO FIM">
                      <input type="time" style={inputStyle} value={form.working_hours_end} onChange={e => set('working_hours_end', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="MENSAGEM FORA DO HORÁRIO">
                    <textarea style={textareaStyle} value={form.off_hours_message} onChange={e => set('off_hours_message', e.target.value)} />
                  </Field>
                  <Field label="GATILHO PARA TRANSFERIR PARA HUMANO">
                    <input style={inputStyle} value={form.transfer_to_human_trigger} onChange={e => set('transfer_to_human_trigger', e.target.value)} placeholder='Ex: "falar com humano", "atendente"' />
                  </Field>
                </div>
              )}

              {/* Tab: Integrações */}
              {tab === 'integracoes' && (
                <div>
                  <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(141,198,63,0.06)', border: '1px solid rgba(141,198,63,0.2)', marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
                    As integrações permitem que o agente envie e receba mensagens via WhatsApp (Z-API) e agende compromissos via Google Calendar.
                  </div>
                  <Field label="Z-API INSTANCE ID">
                    <input style={inputStyle} value={form.zapi_instance} onChange={e => set('zapi_instance', e.target.value)} placeholder="Ex: 3ABC123DEF456" />
                  </Field>
                  <Field label="Z-API TOKEN">
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showToken ? 'text' : 'password'}
                        style={{ ...inputStyle, paddingRight: 80 }}
                        value={form.zapi_token}
                        onChange={e => set('zapi_token', e.target.value)}
                        placeholder="••••••••••••••••"
                      />
                      <button
                        onClick={() => setShowToken(v => !v)}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {showToken ? 'ocultar' : 'mostrar'}
                      </button>
                    </div>
                  </Field>
                  <Field label="EMAIL DO GOOGLE CALENDAR">
                    <input style={inputStyle} value={form.calendar_email} onChange={e => set('calendar_email', e.target.value)} placeholder="Ex: agenda@suaempresa.com" />
                  </Field>
                  <Field label="EMAIL PARA NOTIFICAÇÕES">
                    <input style={inputStyle} value={form.notification_email} onChange={e => set('notification_email', e.target.value)} placeholder="Ex: contato@suaempresa.com" />
                  </Field>
                  <Field label="WHATSAPP PARA NOTIFICAÇÕES">
                    <input style={inputStyle} value={form.notification_whatsapp} onChange={e => set('notification_whatsapp', e.target.value)} placeholder="Ex: 5511999999999" />
                  </Field>
                </div>
              )}

              {/* Save button */}
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    background: saved ? 'rgba(141,198,63,0.15)' : 'var(--accent)',
                    color: saved ? '#8DC63F' : '#0e0e0e',
                    fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-display)', transition: 'all 0.2s',
                  }}
                >
                  {saving ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar alterações'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
