import Head from 'next/head'
import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { faviconHref } from '../lib/favicons'

type Tab = 'identidade' | 'script' | 'disponibilidade' | 'integracoes' | 'api'

interface ApiKey {
  id: string
  name: string
  last_used_at: string | null
  created_at: string
}

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
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [keyCopied, setKeyCopied] = useState(false)
  const [webhookCopied, setWebhookCopied] = useState(false)

  const WEBHOOK_URL = 'https://aexum.com.br/api/agent/webhook'

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
    fetch('/api/agent/keys', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setApiKeys(d) })
  }, [])

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

  async function generateApiKey() {
    if (!newKeyName.trim()) return
    setGeneratingKey(true)
    const res = await fetch('/api/agent/keys', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    const data = await res.json()
    if (data.key) {
      setGeneratedKey(data.key)
      setApiKeys(prev => [{ id: data.id, name: data.name, created_at: data.created_at, last_used_at: null }, ...prev])
      setNewKeyName('')
    }
    setGeneratingKey(false)
  }

  async function deleteApiKey(id: string) {
    await fetch(`/api/agent/keys?id=${id}`, { method: 'DELETE', credentials: 'include' })
    setApiKeys(prev => prev.filter(k => k.id !== id))
  }

  function copyText(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'identidade', label: 'Identidade' },
    { key: 'script', label: 'Script de Vendas' },
    { key: 'disponibilidade', label: 'Disponibilidade' },
    { key: 'integracoes', label: 'Integrações' },
    { key: 'api', label: 'API & n8n' },
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

              {/* Tab: API & n8n */}
              {tab === 'api' && (
                <div>
                  {/* Webhook URL */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Webhook URL</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        readOnly
                        value={WEBHOOK_URL}
                        style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg)' }}
                      />
                      <button
                        onClick={() => copyText(WEBHOOK_URL, setWebhookCopied)}
                        style={{
                          padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)',
                          background: webhookCopied ? 'rgba(141,198,63,0.1)' : 'var(--surface2)',
                          color: webhookCopied ? '#8DC63F' : 'var(--text-muted)',
                          cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                        }}
                      >
                        {webhookCopied ? 'Copiado ✓' : 'Copiar'}
                      </button>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Configure esta URL no n8n como destino do webhook da Z-API
                    </p>
                  </div>

                  {/* API Keys */}
                  <div style={{ marginBottom: 24, fontSize: 13, fontWeight: 600 }}>Chaves de API para n8n</div>

                  {/* Generate new key */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      placeholder='Ex: "n8n produção"'
                      onKeyDown={e => { if (e.key === 'Enter') generateApiKey() }}
                    />
                    <button
                      onClick={generateApiKey}
                      disabled={generatingKey || !newKeyName.trim()}
                      style={{
                        padding: '10px 16px', borderRadius: 8, border: 'none',
                        background: 'var(--accent)', color: '#0e0e0e',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      {generatingKey ? '...' : '+ Gerar chave'}
                    </button>
                  </div>

                  {/* Generated key display */}
                  {generatedKey && (
                    <div style={{ marginBottom: 24, padding: 16, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ padding: '8px 12px', borderRadius: 6, background: '#0e0e0e', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#8DC63F', wordBreak: 'break-all', letterSpacing: '0.04em' }}>
                          {generatedKey}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>⚠</span> Copie agora — esta chave não será exibida novamente
                        </div>
                        <button
                          onClick={() => copyText(generatedKey, setKeyCopied)}
                          style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: keyCopied ? 'rgba(141,198,63,0.15)' : 'var(--surface2)',
                            color: keyCopied ? '#8DC63F' : 'var(--text-muted)',
                            cursor: 'pointer', fontSize: 12,
                          }}
                        >
                          {keyCopied ? 'Copiado ✓' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Keys list */}
                  {apiKeys.length > 0 && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      {apiKeys.map((k, i) => (
                        <div key={k.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 16px', borderBottom: i < apiKeys.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                              Criada em {new Date(k.created_at).toLocaleDateString('pt-BR')}
                              {k.last_used_at && ` · Último uso: ${new Date(k.last_used_at).toLocaleDateString('pt-BR')}`}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteApiKey(k.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: '4px 8px' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {apiKeys.length === 0 && !generatedKey && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma chave gerada ainda.</p>
                  )}
                </div>
              )}

              {/* Save button — hidden on API tab */}
              {tab !== 'api' && (
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
