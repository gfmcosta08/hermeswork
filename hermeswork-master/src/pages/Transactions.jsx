import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ customer_id: '', type: 'pedido', date_scheduled: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load(); loadContacts() }, [])
  async function load() {
    try {
      const r = await fetch(`${API}/transactions`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setTransactions(Array.isArray(d) ? d : d.data || [])
    } finally { setLoading(false) }
  }
  async function loadContacts() {
    const r = await fetch(`${API}/contacts`, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    setContacts(Array.isArray(d) ? d : d.data || [])
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

  const statusColors = { pendente: 'bg-yellow-100 text-yellow-700', confirmado: 'bg-blue-100 text-blue-700', cancelado: 'bg-red-100 text-red-700', concluido: 'bg-green-100 text-green-700' }
  const typeLabels = { agendamento: 'Agendamento', pedido: 'Pedido', encomenda: 'Encomenda', pergunta: 'Pergunta' }

  const getContactName = (id) => {
    const c = contacts.find(c => c.id === id)
    return c ? c.name || c.whatsapp_number : id
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📋 Transações</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium hover:opacity-80">
          + Nova Transação
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required>
              <option value="">Selecione o cliente</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name || c.whatsapp_number}</option>)}
            </select>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border rounded-xl px-4 py-2 text-sm">
              <option value="pedido">Pedido</option>
              <option value="agendamento">Agendamento</option>
              <option value="encomenda">Encomenda</option>
              <option value="pergunta">Pergunta</option>
            </select>
          </div>
          <input type="datetime-local" value={form.date_scheduled} onChange={e => setForm({...form, date_scheduled: e.target.value})} className="border rounded-xl px-4 py-2 text-sm w-full" />
          <button type="submit" className="px-6 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium">Salvar</button>
        </form>
      )}
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhuma transação ainda</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">ID</td><td className="px-4 py-3 font-medium">Cliente</td><td className="px-4 py-3 font-medium">Tipo</td><td className="px-4 py-3 font-medium">Status</td><td className="px-4 py-3 font-medium">Data</td></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{String(t.id).slice(0,8)}...</td>
                  <td className="px-4 py-3">{getContactName(t.customer_id)}</td>
                  <td className="px-4 py-3">{typeLabels[t.type] || t.type}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[t.status] || ''}`}>{t.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{t.date_created ? new Date(t.date_created).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}