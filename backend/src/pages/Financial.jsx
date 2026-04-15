import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, DollarSign, TrendingUp, TrendingDown, X, ArrowUpCircle, ArrowDownCircle, Download, Filter, Calendar } from 'lucide-react'

export default function Financial() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
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
    setShowModal(false)
    setForm({ type: 'receita', amount: '', description: '', category: '', payment_method: '' })
    load()
  }

  const filtered = filterType === 'all' ? entries : entries.filter(e => e.type === filterType)
  const receitas = entries.filter(e => e.type === 'receita').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const despesas = entries.filter(e => e.type === 'despesa').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const saldo = receitas - despesas

  const categoryLabels = {
    mao_obra: 'Mão de Obra', material: 'Material', alimentacao: 'Alimentação',
    diarista: 'Diarista', imovel_venda: 'Venda Imóvel', imovel_comissao: 'Comissão',
    outro: 'Outro'
  }

  const methodLabels = {
    dinheiro: 'Dinheiro', pix: 'PIX', cartao_credito: 'Cartão Crédito', cartao_debito: 'Cartão Débito'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-subtitle">Controle suas receitas e despesas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} /> Nova Entrada
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <ArrowUpCircle size={28} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Entradas</p>
              <p className="text-2xl font-bold text-green-800">R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <ArrowDownCircle size={28} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">Saídas</p>
              <p className="text-2xl font-bold text-red-800">R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className={`stat-card bg-gradient-to-br ${saldo >= 0 ? 'from-blue-50 to-blue-100/50 border-blue-200' : 'from-gray-50 to-gray-100/50 border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${saldo >= 0 ? 'bg-blue-500' : 'bg-gray-500'} flex items-center justify-center shadow-lg ${saldo >= 0 ? 'shadow-blue-500/20' : 'shadow-gray-500/20'}`}>
              <DollarSign size={28} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-medium ${saldo >= 0 ? 'text-blue-700' : 'text-gray-700'}`}>Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-800' : 'text-gray-800'}`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'receita', 'despesa'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filterType === type ? 'bg-[#65B1B7] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {type === 'all' ? 'Todos' : type === 'receita' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Entrada</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input select">
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="label">Valor *</label>
                  <input placeholder="0,00" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input" required />
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <input placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input select">
                    <option value="">Selecione</option>
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Forma de Pagamento</label>
                  <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input select">
                    <option value="">Selecione</option>
                    {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
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
        <div className="card animate-pulse p-5"><div className="h-40 bg-gray-200 rounded-xl" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><DollarSign size={48} /><p className="font-medium text-gray-900 mt-4">Nenhuma entrada</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Forma</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td className="font-medium">{e.description || '—'}</td>
                  <td>
                    <span className={`badge ${e.type === 'receita' ? 'badge-success' : 'badge-danger'}`}>
                      {e.type === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="text-gray-500">{categoryLabels[e.category] || e.category || '—'}</td>
                  <td className="text-gray-500">{methodLabels[e.payment_method] || e.payment_method || '—'}</td>
                  <td className={`text-right font-bold ${e.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
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
