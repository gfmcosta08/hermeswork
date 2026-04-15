import { useEffect, useState, useMemo } from 'react'
import { API } from '../App'
import { Plus, Search, Warehouse, X, Check, Edit2, Trash2, AlertTriangle, Package, TrendingDown } from 'lucide-react'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)
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
    const payload = {
      ...form,
      quantity: parseFloat(form.quantity) || 0,
      purchase_price: parseFloat(form.purchase_price) || 0,
      min_threshold: parseFloat(form.min_threshold) || 0
    }
    if (editingId) {
      await fetch(`${API}/inventory/${editingId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`${API}/inventory`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowModal(false); setEditingId(null)
    setForm({ name: '', unit: '', quantity: '', purchase_price: '', min_threshold: '', location: '' })
    load()
  }

  function handleEdit(item) {
    setForm({
      name: item.name, unit: item.unit || '', quantity: item.quantity,
      purchase_price: item.purchase_price, min_threshold: item.min_threshold,
      location: item.location || ''
    })
    setEditingId(item.id); setShowModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este item?')) return
    await fetch(`${API}/inventory/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const lowStockItems = useMemo(() => items.filter(i => parseFloat(i.quantity) <= parseFloat(i.min_threshold)), [items])
  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase())
      const matchesLowStock = !showLowStock || (parseFloat(i.quantity) <= parseFloat(i.min_threshold))
      return matchesSearch && matchesLowStock
    })
  }, [items, search, showLowStock])

  const openModal = (item = null) => {
    if (item) {
      handleEdit(item)
    } else {
      setForm({ name: '', unit: '', quantity: '', purchase_price: '', min_threshold: '', location: '' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">{items.length} itens • {lowStockItems.length} com estoque baixo</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          <Plus size={18} /> Novo Item
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800">Estoque Baixo</p>
            <p className="text-sm text-amber-700">{lowStockItems.length} item(s) precisam de reposição</p>
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`btn btn-sm ${showLowStock ? 'btn-danger' : 'btn-secondary'}`}
          >
            {showLowStock ? 'Ocultar' : 'Ver'}
          </button>
        </div>
      )}

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-11" />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">Nome *</label><input placeholder="Nome do item" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Quantidade</label><input placeholder="0" type="number" step="0.001" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input" /></div>
                <div><label className="label">Unidade</label><input placeholder="un, kg, litro" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Preço Compra</label><input placeholder="0,00" type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="input" /></div>
                <div><label className="label">Estoque Mínimo</label><input placeholder="0" type="number" step="0.001" value={form.min_threshold} onChange={e => setForm({...form, min_threshold: e.target.value})} className="input" /></div>
              </div>
              <div><label className="label">Localização</label><input placeholder="Depósito, balcão..." value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">{editingId ? <><Check size={16} /> Salvar</> : <><Plus size={16} /> Criar</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card animate-pulse p-5"><div className="h-20 bg-gray-200 rounded-xl" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Warehouse size={48} /><p className="font-medium text-gray-900 mt-4">Nenhum item encontrado</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Item</th><th>Quantidade</th><th>Mínimo</th><th>Preço Compra</th><th>Localização</th><th></th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const isLow = parseFloat(i.quantity) <= parseFloat(i.min_threshold)
                return (
                  <tr key={i.id} className={isLow ? 'bg-amber-50/50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLow ? 'bg-amber-100' : 'bg-gray-100'}`}>
                          {isLow ? <TrendingDown size={18} className="text-amber-600" /> : <Package size={18} className="text-gray-500" />}
                        </div>
                        <div>
                          <p className="font-medium">{i.name}</p>
                          <p className="text-xs text-gray-400">{i.unit || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={isLow ? 'text-amber-600 font-bold' : ''}>
                      {i.quantity} {i.unit}
                      {isLow && <span className="ml-2 text-xs text-amber-600">⚠️</span>}
                    </td>
                    <td className="text-gray-500">{i.min_threshold} {i.unit}</td>
                    <td className="font-semibold text-[#D59846]">R$ {parseFloat(i.purchase_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="text-gray-500 text-sm">{i.location || '—'}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(i)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Edit2 size={14} className="text-gray-500" /></button>
                        <button onClick={() => handleDelete(i.id)} className="p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} className="text-red-500" /></button>
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
