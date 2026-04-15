import { useEffect, useState } from 'react'
import { API } from '../App'

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

  const categoryOptions = ['mao_obra', 'material', 'alimentacao', 'diarista', 'imovel_venda', 'imovel_comissao', 'outro']
  const methodOptions = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">💰 Financeiro</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium hover:opacity-80">
          + Nova Entrada
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="text-sm text-gray-500 mb-1">Entradas</div>
          <div className="text-2xl font-bold text-green-600">R$ {receitas.toFixed(2).replace('.', ',')}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="text-sm text-gray-500 mb-1">Saídas</div>
          <div className="text-2xl font-bold text-red-600">R$ {despesas.toFixed(2).replace('.', ',')}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="text-sm text-gray-500 mb-1">Saldo</div>
          <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {saldo.toFixed(2).replace('.', ',')}</div>
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border rounded-xl px-4 py-2 text-sm">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
            <input placeholder="Valor" type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
          </div>
          <input placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded-xl px-4 py-2 text-sm w-full" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded-xl px-4 py-2 text-sm">
              <option value="">Categoria</option>
              {categoryOptions.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
            <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="border rounded-xl px-4 py-2 text-sm">
              <option value="">Forma de pagamento</option>
              {methodOptions.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button type="submit" className="px-6 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium">Salvar</button>
        </form>
      )}
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhuma entrada financeira ainda</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">Descrição</td><td className="px-4 py-3 font-medium">Tipo</td><td className="px-4 py-3 font-medium">Categoria</td><td className="px-4 py-3 font-medium">Valor</td></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3">{e.description || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${e.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.type}</span></td>
                  <td className="px-4 py-3 text-gray-500">{e.category || '—'}</td>
                  <td className={`px-4 py-3 font-bold ${e.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>R$ {parseFloat(e.amount || 0).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}