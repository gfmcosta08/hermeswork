import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, Search, Package, X, Edit2, Trash2, Check } from 'lucide-react'

const typeColors = {
  produto_estoque: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  produto_final: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  servico: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  mao_de_obra: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  imovel: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
}

const typeLabels = {
  produto_estoque: 'Estoque',
  produto_final: 'Final',
  servico: 'Serviço',
  mao_de_obra: 'Mão de Obra',
  imovel: 'Imóvel',
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: ''
  })
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
    const payload = { ...form, price: parseFloat(form.price) || 0 }

    if (editingId) {
      await fetch(`${API}/products/${editingId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`${API}/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: '' })
    load()
  }

  function handleEdit(product) {
    setForm({
      name: product.name,
      price: product.price,
      type: product.type,
      category: product.category || '',
      unit: product.unit || '',
      description: product.description || ''
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este produto?')) return
    await fetch(`${API}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    load()
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">{products.length} produtos cadastrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: '' }) }}
          className="btn-primary">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar produto..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-11 max-w-md" />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-black/5 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input placeholder="Nome do produto" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                  <input placeholder="0,00" type="number" step="0.01" value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input placeholder="Categoria" value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <input placeholder="un, kg, litro" value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea placeholder="Descrição do produto" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="input" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">
                  {editingId ? <><Check size={16} /> Salvar</> : <><Plus size={16} /> Criar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-xl mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro produto'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map(product => {
            const colors = typeColors[product.type] || typeColors.produto_estoque
            return (
              <div key={product.id} className="card p-5 group hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Package size={24} className={colors.text} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(product)}
                      className="p-2 hover:bg-black/5 rounded-lg transition">
                      <Edit2 size={14} className="text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(product.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-2xl font-bold text-[#D59846] mb-3">
                  R$ {parseFloat(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`badge border ${colors.text.replace('text-', 'bg-').replace('600', '100')} ${colors.border}`}>
                    {typeLabels[product.type] || product.type}
                  </span>
                  {product.category && (
                    <span className="text-xs text-gray-400">{product.category}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
