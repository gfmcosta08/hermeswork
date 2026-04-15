import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', unit: '', quantity: '', purchase_price: '', min_threshold: '', location: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const r = await fetch(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setItems(Array.isArray(d) ? d : d.data || [])
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch(`${API}/inventory`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        quantity: parseFloat(form.quantity) || 0,
        purchase_price: parseFloat(form.purchase_price) || 0,
        min_threshold: parseFloat(form.min_threshold) || 0
      }),
    })
    setShowForm(false)
    setForm({ name: '', unit: '', quantity: '', purchase_price: '', min_threshold: '', location: '' })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🗃️ Estoque</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium hover:opacity-80">
          + Novo Item
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome do item" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
            <input placeholder="Unidade (un, kg, litro)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="Quantidade" type="number" step="0.001" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
            <input placeholder="Preço compra" type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
            <input placeholder="Mínimo" type="number" step="0.001" value={form.min_threshold} onChange={e => setForm({...form, min_threshold: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <input placeholder="Localização (deposito, balcão)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border rounded-xl px-4 py-2 text-sm w-full" />
          <button type="submit" className="px-6 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium">Salvar</button>
        </form>
      )}
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhum item no estoque</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">Nome</td><td className="px-4 py-3 font-medium">Quantidade</td><td className="px-4 py-3 font-medium">Mínimo</td><td className="px-4 py-3 font-medium">Preço Compra</td></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3">{i.quantity} {i.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{i.min_threshold} {i.unit}</td>
                  <td className="px-4 py-3 text-brand-ocre font-bold">R$ {parseFloat(i.purchase_price || 0).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}