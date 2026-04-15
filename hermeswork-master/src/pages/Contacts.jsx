import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', whatsapp_number: '', type: 'cliente' })
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
    await fetch(`${API}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    load()
  }

  const typeColors = { cliente: 'bg-blue-100 text-blue-700', fornecedor: 'bg-orange-100 text-orange-700', parceiro: 'bg-purple-100 text-purple-700', gestor: 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">👥 Contatos</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium hover:opacity-80">
          + Novo Contato
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
            <input placeholder="WhatsApp" value={form.whatsapp_number} onChange={e => setForm({...form, whatsapp_number: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
          </div>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border rounded-xl px-4 py-2 text-sm w-full">
            <option value="cliente">Cliente</option>
            <option value="fornecedor">Fornecedor</option>
            <option value="parceiro">Parceiro</option>
            <option value="gestor">Gestor</option>
          </select>
          <button type="submit" className="px-6 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium">Salvar</button>
        </form>
      )}
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : contacts.length === 0 ? (
        <div className="text-center text-gray-400 py-8">Nenhum contato ainda</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">Nome</td><td className="px-4 py-3 font-medium">WhatsApp</td><td className="px-4 py-3 font-medium">Tipo</td></tr></thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.whatsapp_number}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[c.type] || typeColors.cliente}`}>{c.type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}