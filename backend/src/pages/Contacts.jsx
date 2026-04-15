import { useEffect, useState } from 'react'
import { API } from '../App'
import { Plus, Search, Users, X, Edit2, Trash2, Check, MessageCircle } from 'lucide-react'

const typeConfig = {
  cliente: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  fornecedor: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  parceiro: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  gestor: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  corretor: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
}

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', whatsapp_number: '', type: 'cliente', segment: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const r = await fetch(`${API}/contacts`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setContacts(Array.isArray(d) ? d : d.data || [])
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editingId) {
      await fetch(`${API}/contacts/${editingId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch(`${API}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', whatsapp_number: '', type: 'cliente', segment: '' })
    load()
  }

  function handleEdit(contact) {
    setForm({
      name: contact.name || '',
      whatsapp_number: contact.whatsapp_number || '',
      type: contact.type || 'cliente',
      segment: contact.segment || ''
    })
    setEditingId(contact.id)
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este contato?')) return
    await fetch(`${API}/contacts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const filtered = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.whatsapp_number || '').includes(search)
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contatos</h1>
          <p className="page-subtitle">{contacts.length} contatos cadastrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', whatsapp_number: '', type: 'cliente', segment: '' }) }}
          className="btn-primary">
          <Plus size={18} /> Novo Contato
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome ou WhatsApp..." value={search}
          onChange={e => setSearch(e.target.value)} className="input pl-11 max-w-md" />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Contato' : 'Novo Contato'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-black/5 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input placeholder="Nome do contato" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input placeholder="11999999999" value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input">
                    <option value="cliente">Cliente</option>
                    <option value="fornecedor">Fornecedor</option>
                    <option value="parceiro">Parceiro</option>
                    <option value="gestor">Gestor</option>
                    <option value="corretor">Corretor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Segmento</label>
                  <input placeholder="Ex: peças_moto" value={form.segment} onChange={e => setForm({...form, segment: e.target.value})} className="input" />
                </div>
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

      {loading ? (
        <div className="card animate-pulse p-5"><div className="h-20 bg-gray-200 rounded-xl" /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><Users size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="font-medium">Nenhum contato encontrado</p></div></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Contato</th><th>WhatsApp</th><th>Tipo</th><th>Último contato</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const config = typeConfig[c.type] || typeConfig.cliente
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#86C9CD] to-[#65B1B7] flex items-center justify-center text-white font-medium">
                          {(c.name || c.whatsapp_number || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{c.name || '—'}</p>
                          <p className="text-xs text-gray-400">{c.segment || 'Sem segmento'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a href={`https://wa.me/${c.whatsapp_number}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[#65B1B7] hover:text-[#86C9CD]">
                        <MessageCircle size={14} />{c.whatsapp_number}
                      </a>
                    </td>
                    <td><span className={`badge border ${config.text.replace('text-', 'bg-').replace('600', '100')} ${config.border}`}>{c.type}</span></td>
                    <td className="text-gray-500 text-sm">{c.last_seen ? new Date(c.last_seen).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleEdit(c)} className="p-2 hover:bg-black/5 rounded-lg transition"><Edit2 size={14} className="text-gray-500" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} className="text-red-500" /></button>
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
