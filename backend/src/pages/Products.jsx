import { useEffect, useState, useMemo } from 'react'
import { API } from '../App'
import { Plus, Search, Package, X, Edit2, Trash2, Check, Image, Filter, Grid, List, MoreVertical } from 'lucide-react'

const typeConfig = {
  produto_estoque: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: '📦' },
  produto_final: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', icon: '✨' },
  servico: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: '🔧' },
  mao_de_obra: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', icon: '👷' },
  imovel: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', icon: '🏠' },
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
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [form, setForm] = useState({ name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: '' })
  const [menuOpen, setMenuOpen] = useState(null)
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
    setShowModal(false)
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
    setShowModal(true)
    setMenuOpen(null)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este produto?')) return
    await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType === 'all' || p.type === filterType
      return matchesSearch && matchesType
    })
  }, [products, search, filterType])

  const openModal = (product = null) => {
    if (product) {
      handleEdit(product)
    } else {
      setForm({ name: '', price: '', type: 'produto_estoque', category: '', unit: '', description: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">{filteredProducts.length} de {products.length} produtos</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-11"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="input select w-full sm:w-48"
        >
          <option value="all">Todos os tipos</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
          >
            <Grid size={18} className={viewMode === 'grid' ? 'text-[#65B1B7]' : 'text-gray-400'} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
          >
            <List size={18} className={viewMode === 'list' ? 'text-[#65B1B7]' : 'text-gray-400'} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome *</label>
                <input
                  placeholder="Nome do produto"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Preço</label>
                  <input
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm({...form, price: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    className="input select"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Categoria</label>
                  <input
                    placeholder="Categoria"
                    value={form.category}
                    onChange={e => setForm({...form, category: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Unidade</label>
                  <input
                    placeholder="un, kg, litro"
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea
                  placeholder="Descrição do produto"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingId ? <><Check size={16} /> Salvar</> : <><Plus size={16} /> Criar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6].map(i => (
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
              <Package size={48} />
              <p className="font-medium text-gray-900 mt-4">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || filterType !== 'all' ? 'Tente buscar por outro termo ou filtro' : 'Comece adicionando seu primeiro produto'}
              </p>
              {!search && filterType === 'all' && (
                <button onClick={() => openModal()} className="btn btn-primary btn-sm mt-4">
                  <Plus size={14} /> Adicionar produto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, index) => {
              const config = typeConfig[product.type] || typeConfig.produto_estoque
              return (
                <div
                  key={product.id}
                  className="card p-5 group hover:shadow-lg transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center text-xl`}>
                      {config.icon}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={16} className="text-gray-400" />
                      </button>
                      {menuOpen === product.id && (
                        <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border p-1 z-10 min-w-[120px] animate-scale-in">
                          <button onClick={() => handleEdit(product)} className="dropdown-item w-full text-left">
                            <Edit2 size={14} /> Editar
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="dropdown-item danger w-full text-left">
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-[#D59846] mb-3">
                    R$ {parseFloat(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge border ${config.text.replace('text-', 'bg-').replace('600', '100')} ${config.border}`}>
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
        )
      )}

      {/* List View */}
      {viewMode === 'list' && !loading && filteredProducts.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const config = typeConfig[product.type] || typeConfig.produto_estoque
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center text-lg`}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.unit || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge border ${config.text.replace('text-', 'bg-').replace('600', '100')} ${config.border}`}>
                        {typeLabels[product.type] || product.type}
                      </span>
                    </td>
                    <td className="text-gray-500">{product.category || '—'}</td>
                    <td className="font-semibold text-[#D59846]">
                      R$ {parseFloat(product.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <Edit2 size={14} className="text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} className="text-red-500" />
                        </button>
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
