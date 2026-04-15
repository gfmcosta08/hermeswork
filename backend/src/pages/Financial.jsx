import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, Search, DollarSign, X, Check, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export default function Financial() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'receita', amount: '', description: '', category: '', payment_method: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const r = await fetch(`${API}/financial`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setEntries(Array.isArray(d) ? d : d.data || [])
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch(`${API}/financial`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    setShowForm(false)
    setForm({ type: 'receita', amount: '', description: '', category: '', payment_method: '' })
    load()
  }

  const receitas = entries.filter(e => e.type === 'receita').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const despesas = entries.filter(e => e.type === 'despesa').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const saldo = receitas - despesas

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle suas receitas e despesas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Nova Entrada</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center"><ArrowUpCircle size={24} className="text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Entradas</p>
              <p className="text-2xl font-bold text-green-600">R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center"><ArrowDownCircle size={24} className="text-red-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Saídas</p>
              <p className="text-2xl font-bold text-red-600">R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${saldo >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <DollarSign size={24} className={saldo >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Nova Entrada</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-black/5 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input placeholder="0,00" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
                    <option value="">Selecione</option>
                    <option value="mao_obra">Mão de Obra</option>
                    <option value="material">Material</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="diarista">Diarista</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input">
                    <option value="">Selecione</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão Crédito</option>
                    <option value="cartao_debito">Cartão Débito</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1"><Plus size={16} /> Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="card animate-pulse p-5"><div className="h-40 bg-gray-200 rounded-xl" /></div>
       : entries.length === 0 ? (
        <div className="card"><div className="empty-state"><DollarSign size={48} className="text-gray-300 mx-auto mb-3" /><p className="font-medium">Nenhuma entrada financeira</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Valor</th></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="font-medium">{e.description || '—'}</td>
                  <td><span className={`badge ${e.type === 'receita' ? 'badge-success' : 'badge-danger'}`}>{e.type}</span></td>
                  <td className="text-gray-500">{e.category || '—'}</td>
                  <td className={`font-bold ${e.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {e.type === 'receita' ? '+' : '-'} R$ {parseFloat(e.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
