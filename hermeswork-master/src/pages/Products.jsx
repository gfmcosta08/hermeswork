import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const r = await fetch(`${API}/products`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setProducts(Array.isArray(d) ? d : d.data || [])
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch(`${API}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) || 0 }),
    })
    setShowForm(false)
    setForm({ name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: '' })
    load()
  }

  const typeColors = { produto_estoque: 'bg-blue-100', produto_final: 'bg-blue-50', servico: 'bg-purple-100', mao_de_obra: 'bg-orange-100', imovel: 'bg-green-100' }
  const typeLabels = { produto_estoque: 'Estoque', produto_final: 'Final', servico: 'Serviço', mao_de_obra: 'Mão de Obra', imovel: 'Imóvel' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📦 Produtos</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium hover:opacity-80">
          + Novo Produto
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome do produto" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
            <input placeholder="Preço" type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border rounded-xl px-4 py-2 text-sm">
              <option value="produto_estoque">Produto em Estoque</option>
              <option value="produto_final">Produto Final</option>
              <option value="servico">Serviço</option>
              <option value="mao_de_obra">Mão de Obra</option>
              <option value="imovel">Imóvel</option>
            </select>
            <input placeholder="Categoria" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Unidade (un, kg, litro)" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded-xl px-4 py-2 text-sm w-full" rows={3} />
          <button type="submit" className="px-6 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium">Salvar</button>
        </form>
      )}
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhum produto cadastrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-5 border border-black/5">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">{p.name}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${typeColors[p.type] || ''}`}>{typeLabels[p.type] || p.type}</span>
              </div>
              <div className="text-2xl font-bold text-brand-ocre">R$ {parseFloat(p.price || 0).toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-gray-400 mt-1">{p.category || 'Sem categoria'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}