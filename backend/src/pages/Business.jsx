import { useEffect, useState } from 'react'
import { API } from '../App'
import { Store, X, Check, Edit2, Save, Settings, Clock, Globe, Bell } from 'lucide-react'

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

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-48 bg-gray-200 rounded-2xl" /></div>

  const b = data?.data || data
  const config = b?.config || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie seu negócio</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-primary"><Edit2 size={16} /> Editar</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} className="btn-primary"><Save size={16} /> Salvar</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#86C9CD] to-[#65B1B7] flex items-center justify-center">
              <Store size={28} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Dados do Negócio</h3>
              <p className="text-sm text-gray-500">Informações básicas</p>
            </div>
          </div>

          {editing ? (
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segmento</label>
                <select value={form.segment} onChange={e => setForm({...form, segment: e.target.value})} className="input">
                  {segments.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-black/5">
                <span className="text-gray-500">Nome</span>
                <span className="font-medium">{b?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-black/5">
                <span className="text-gray-500">Segmento</span>
                <span className="font-medium capitalize">{b?.segment || '—'}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Telefone</span>
                <span className="font-medium">{b?.phone || '—'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Config */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D59846] to-[#9E7452] flex items-center justify-center">
              <Settings size={28} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Configurações</h3>
              <p className="text-sm text-gray-500">Horário e notificações</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-black/5">
              <Clock size={18} className="text-gray-400" />
              <span className="text-gray-500 flex-1">Horário</span>
              <span className="font-medium">{config.horario_funcionamento || '08:00-18:00'}</span>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-black/5">
              <Globe size={18} className="text-gray-400" />
              <span className="text-gray-500 flex-1">Moeda</span>
              <span className="font-medium">{config.currency || 'BRL'}</span>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-black/5">
              <Bell size={18} className="text-gray-400" />
              <span className="text-gray-500 flex-1">Notificações</span>
              <span className="font-medium">{config.notificacoes?.estoque_baixo ? 'Ativas' : 'Inativas'}</span>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Settings size={18} className="text-gray-400" />
              <span className="text-gray-500 flex-1">Agendamento</span>
              <span className="badge badge-info">{config.agendamento_tipo || 'gestor'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* uazapi Config */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Integração WhatsApp</h3>
            <p className="text-sm text-gray-500">Configuração do uazapi</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-green-800">Configure as credenciais do uazapi no painel de administração para ativar o envio de mensagens via WhatsApp.</p>
        </div>
      </div>
    </div>
  )
}
