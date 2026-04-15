import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, Search, Warehouse, X, Check, Edit2, Trash2, AlertTriangle } from 'lucide-react'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
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
    const payload = { ...form, quantity: parseFloat(form.quantity) || 0, purchase_price: parseFloat(form.purchase_price) || 0, min_threshold: parseFloat(form.min_threshold) || 0 }
    if (editingId) {
      await fetch(`${API}/inventory/${editingId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch(`${API}/inventory`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowForm(false); setEditingId(null)
    setForm({ name: '', unit: '', quantity: '', purchase_price: '', min_threshold: '', location: '' })
    load()
  }

  function handleEdit(item) {
    setForm({ name: item.name, unit: item.unit || '', quantity: item.quantity, purchase_price: item.purchase_price, min_threshold: item.min_threshold, location: item.location || '' })
    setEditingId(item.id); setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este item?')) return
    await fetch(`${API}/inventory/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  const lowStock = filtered.filter(i => parseFloat(i.quantity) <= parseFloat(i.min_threshold))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">{items.length} itens cadastrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', unit: '', quantity: '', purchase_price: '', min_threshold: '', location: '' }) }} className="btn-primary"><Plus size={18} /> Novo Item</button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600" />
          <p className="text-sm text-amber-800">{lowStock.length} item(s) com estoque baixo</p>
        </div>
      )}

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar item..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-11 max-w-md" />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-black/5 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nome</label><input placeholder="Nome do item" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label><input placeholder="0" type="number" step="0.001" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label><input placeholder="un, kg, litro" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Preço Compra</label><input placeholder="0,00" type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label><input placeholder="0" type="number" step="0.001" value={form.min_threshold} onChange={e => setForm({...form, min_threshold: e.target.value})} className="input" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Localização</label><input placeholder="Depósito, balcão..." value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">{editingId ? <><Check size={16} /> Salvar</> : <><Plus size={16} /> Criar</>}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="card animate-pulse p-5"><div className="h-20 bg-gray-200 rounded-xl" /></div>
       : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Warehouse size={48} className="text-gray-300 mx-auto mb-3" /><p className="font-medium">Nenhum item encontrado</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Item</th><th>Quantidade</th><th>Mínimo</th><th>Preço Compra</th><th>Localização</th><th></th></tr></thead>
            <tbody>
              {filtered.map(i => {
                const isLow = parseFloat(i.quantity) <= parseFloat(i.min_threshold)
                return (
                  <tr key={i.id} className={isLow ? 'bg-amber-50/50' : ''}>
                    <td><div className="font-medium">{i.name}</div><div className="text-xs text-gray-400">{i.unit || '—'}</div></td>
                    <td className={isLow ? 'text-amber-600 font-bold' : ''}>{i.quantity} {i.unit}</td>
                    <td className="text-gray-500">{i.min_threshold} {i.unit}</td>
                    <td className="text-[#D59846] font-bold">R$ {parseFloat(i.purchase_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="text-gray-500 text-sm">{i.location || '—'}</td>
                    <td><div className="flex gap-1 justify-end"><button onClick={() => handleEdit(i)} className="p-2 hover:bg-black/5 rounded-lg transition"><Edit2 size={14} className="text-gray-500" /></button><button onClick={() => handleDelete(i.id)} className="p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} className="text-red-500" /></button></div></td>
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
