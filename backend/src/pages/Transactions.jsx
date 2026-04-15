import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, Search, Receipt, X, Check, Clock, User } from 'lucide-react'

const statusConfig = {
  pendente: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  confirmado: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  cancelado: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  concluido: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
}

const typeLabels = { agendamento: 'Agendamento', pedido: 'Pedido', encomenda: 'Encomenda', pergunta: 'Pergunta' }

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
    setShowForm(false)
    setForm({ customer_id: '', type: 'pedido', date_scheduled: '' })
    load()
  }

  async function updateStatus(id, status) {
    await fetch(`${API}/transactions/${id}/${status}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const getContactName = (id) => {
    const c = contacts.find(x => x.id === id)
    return c ? c.name || c.whatsapp_number : id
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transações</h1>
          <p className="page-subtitle">{transactions.length} transações</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Nova Transação</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Nova Transação</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-black/5 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} className="input" required>
                  <option value="">Selecione</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.whatsapp_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                  <option value="pedido">Pedido</option>
                  <option value="agendamento">Agendamento</option>
                  <option value="encomenda">Encomenda</option>
                  <option value="pergunta">Pergunta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora</label>
                <input type="datetime-local" value={form.date_scheduled} onChange={e => setForm({...form, date_scheduled: e.target.value})} className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1"><Plus size={16} /> Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="card animate-pulse p-5"><div className="h-20 bg-gray-200 rounded-xl" /></div>
       : transactions.length === 0 ? (
        <div className="card"><div className="empty-state"><Receipt size={48} className="text-gray-300 mx-auto mb-3" /><p className="font-medium">Nenhuma transação</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Status</th><th>Data</th><th></th></tr></thead>
            <tbody>
              {transactions.map(t => {
                const config = statusConfig[t.status] || statusConfig.pendente
                return (
                  <tr key={t.id}>
                    <td><div className="flex items-center gap-2"><User size={16} className="text-gray-400" />{getContactName(t.customer_id)}</div></td>
                    <td><span className="text-sm">{typeLabels[t.type] || t.type}</span></td>
                    <td><span className={`badge border ${config.text.replace('text-', 'bg-').replace('700', '100')} ${config.border}`}>{t.status}</span></td>
                    <td className="text-gray-500 text-sm"><Clock size={14} className="inline mr-1" />{t.date_created ? new Date(t.date_created).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        {t.status === 'pendente' && <button onClick={() => updateStatus(t.id, 'confirm')} className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">Confirmar</button>}
                        {t.status === 'confirmado' && <button onClick={() => updateStatus(t.id, 'cancel')} className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">Cancelar</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
