import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, Search, Receipt, X, Check, Clock, User, Filter, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

const statusConfig = {
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: AlertCircle },
  confirmado: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle },
  cancelado: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  concluido: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
}

const typeLabels = { agendamento: 'Agendamento', pedido: 'Pedido', encomenda: 'Encomenda', pergunta: 'Pergunta' }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({ customer_id: '', type: 'pedido', date_scheduled: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const [t, c] = await Promise.all([
        fetch(`${API}/transactions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API}/contacts`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ])
      setTransactions(Array.isArray(t) ? t : t.data || [])
      setContacts(Array.isArray(c) ? c : c.data || [])
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch(`${API}/transactions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowModal(false)
    setForm({ customer_id: '', type: 'pedido', date_scheduled: '' })
    load()
  }

  async function updateStatus(id, action) {
    await fetch(`${API}/transactions/${id}/${action === 'confirm' ? 'confirm' : 'cancel'}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const getContactName = (id) => {
    const c = contacts.find(x => x.id === id)
    return c ? c.name || c.whatsapp_number : 'Cliente'
  }

  const filtered = filterStatus === 'all' ? transactions : transactions.filter(t => t.status === filterStatus)

  const statusCounts = {
    pendente: transactions.filter(t => t.status === 'pendente').length,
    confirmado: transactions.filter(t => t.status === 'confirmado').length,
    cancelado: transactions.filter(t => t.status === 'cancelado').length,
    concluido: transactions.filter(t => t.status === 'concluido').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transações</h1>
          <p className="page-subtitle">{transactions.length} transações</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Nova Transação
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${filterStatus === 'all' ? 'bg-[#65B1B7] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          Todos ({transactions.length})
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${filterStatus === status ? `${config.bg} ${config.text} border ${config.border}` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {statusLabels[status]} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {statusLabels = {'pendente': 'Pendente', 'confirmado': 'Confirmado', 'cancelado': 'Cancelado', 'concluido': 'Concluído'}}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Transação</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Cliente *</label>
                <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} className="input select" required>
                  <option value="">Selecione</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.whatsapp_number}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input select">
                  <option value="pedido">Pedido</option>
                  <option value="agendamento">Agendamento</option>
                  <option value="encomenda">Encomenda</option>
                  <option value="pergunta">Pergunta</option>
                </select>
              </div>
              <div>
                <label className="label">Data/Hora</label>
                <input type="datetime-local" value={form.date_scheduled} onChange={e => setForm({...form, date_scheduled: e.target.value})} className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1"><Plus size={16} /> Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse p-5"><div className="h-20 bg-gray-200 rounded-xl" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Receipt size={48} /><p className="font-medium text-gray-900 mt-4">Nenhuma transação</p></div></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const config = statusConfig[t.status] || statusConfig.pendente
            const StatusIcon = config.icon
            return (
              <div key={t.id} className="card p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <StatusIcon size={24} className={config.text} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="font-medium">{getContactName(t.customer_id)}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500">{typeLabels[t.type] || t.type}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {t.date_created ? new Date(t.date_created).toLocaleDateString('pt-BR') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${config.text.replace('text-', 'bg-').replace('700', '100')} border ${config.text.replace('text-', 'border-').replace('700', '200')}`}>
                      {t.status}
                    </span>
                    {t.status === 'pendente' && (
                      <button onClick={() => updateStatus(t.id, 'confirm')} className="btn btn-sm btn-secondary text-green-600">
                        <Check size={14} /> Confirmar
                      </button>
                    )}
                    {t.status === 'confirmado' && (
                      <button onClick={() => updateStatus(t.id, 'cancel')} className="btn btn-sm btn-danger">
                        <X size={14} /> Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
