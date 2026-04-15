import { useEffect, useState } from 'react'
import { API } from '../App'
import { Store, X, Check, Edit2, Save, Settings, Clock, Globe, Bell, Shield, Key, MessageSquare, Smartphone } from 'lucide-react'

const segments = ['alimentacao', 'oficina', 'estetica', 'imobiliario', 'distribuidora', 'outro']

export default function Business() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', segment: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const r = await fetch(`${API}/business`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setData(d)
      setForm({ name: d.name || '', phone: d.phone || '', segment: d.segment || '' })
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch(`${API}/business`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setEditing(false)
    load()
  }

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-2xl" />
      <div className="h-48 bg-gray-200 rounded-2xl" />
    </div>
  )

  const b = data?.data || data
  const config = b?.config || {}

  const SettingSection = ({ icon: Icon, title, description, children }) => (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#86C9CD]/10 flex items-center justify-center flex-shrink-0">
          <Icon size={24} className="text-[#65B1B7]" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie seu negócio e preferências</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-primary">
            <Edit2 size={16} /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} className="btn btn-primary"><Save size={16} /> Salvar</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <SettingSection icon={Store} title="Dados do Negócio" description="Informações básicas da sua empresa">
          {editing ? (
            <form className="space-y-4">
              <div>
                <label className="label">Nome</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
              </div>
              <div>
                <label className="label">Segmento</label>
                <select value={form.segment} onChange={e => setForm({...form, segment: e.target.value})} className="input select">
                  {segments.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Nome</span>
                <span className="font-medium">{b?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">Segmento</span>
                <span className="font-medium capitalize">{b?.segment || '—'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Telefone</span>
                <span className="font-medium">{b?.phone || '—'}</span>
              </div>
            </div>
          )}
        </SettingSection>

        {/* Operational Settings */}
        <SettingSection icon={Clock} title="Horário de Funcionamento" description="Quando seu negócio está aberto">
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Horário</span>
              <span className="font-medium">{config.horario_funcionamento || '08:00-18:00'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Moeda</span>
              <span className="font-medium">{config.currency || 'BRL'}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-500">Agendamento</span>
              <span className="badge badge-info">{config.agendamento_tipo || 'gestor'}</span>
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection icon={Bell} title="Notificações" description="Alertas e avisos importantes">
          <div className="space-y-4">
            {[
              { key: 'estoque_baixo', label: 'Estoque Baixo', desc: 'Quando produtos estão acabando' },
              { key: 'orcamento_respondido', label: 'Orçamento Respondido', desc: 'Quando fornecedores respondem' },
              { key: 'pagamento_pendente', label: 'Pagamento Pendente', desc: 'Quando há parcelas a receber' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition ${config.notificacoes?.[item.key] ? 'bg-[#86C9CD]' : 'bg-gray-200'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition mt-1 ${config.notificacoes?.[item.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* WhatsApp Integration */}
        <SettingSection icon={MessageSquare} title="Integração WhatsApp" description="Configuração do uazapi">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={16} className="text-white" />
              </div>
              <p className="font-medium text-green-800">Configurado</p>
            </div>
            <p className="text-sm text-green-700">O webhook está ativo e funcionando corretamente.</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Webhook URL</span>
              <span className="text-sm font-mono text-[#65B1B7]">/fw/webhook/{b?.id?.slice(0, 8) || '...'}</span>
            </div>
            <button className="btn btn-secondary btn-sm w-full">
              <Settings size={14} /> Configurar uazapi
            </button>
          </div>
        </SettingSection>
      </div>

      {/* Account Section */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#86C9CD] to-[#65B1B7] flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Segurança</h3>
            <p className="text-sm text-gray-500">Gerencie sua conta e acessos</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="btn btn-secondary justify-start">
            <Key size={16} /> Alterar Senha
          </button>
          <button className="btn btn-secondary justify-start">
            <Smartphone size={16} /> 2FA
          </button>
          <button className="btn btn-secondary justify-start text-red-600 hover:bg-red-50">
            <X size={16} /> Sair de Todos
          </button>
        </div>
      </div>
    </div>
  )
}
