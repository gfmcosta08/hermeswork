import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Business() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', segment: '' })
  const token = localStorage.getItem('token')

  useEffect(() => { load() }, [])
  async function load() {
    try {
      const r = await fetch(`${API}/business`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setData(d)
      setForm({ name: d.name || '', phone: d.phone || '', segment: d.segment || '' })
    } finally { setLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await fetch(`${API}/business`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    load()
  }

  const segments = ['alimentacao', 'oficina', 'estetica', 'imobiliario', 'distribuidora', 'outro']

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>

  const b = data?.data || data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🏪 Negócio</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium hover:opacity-80">
          Editar
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-black/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Nome do negócio" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" required />
            <input placeholder="Telefone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border rounded-xl px-4 py-2 text-sm" />
          </div>
          <select value={form.segment} onChange={e => setForm({...form, segment: e.target.value})} className="border rounded-xl px-4 py-2 text-sm w-full">
            {segments.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button type="submit" className="px-6 py-2 bg-brand-turquoise text-white rounded-xl text-sm font-medium">Salvar</button>
        </form>
      )}
      <div className="bg-white rounded-2xl p-6 border border-black/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase">Nome</label>
            <div className="font-bold text-lg">{b?.name || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase">Segmento</label>
            <div className="font-medium">{b?.segment || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase">Telefone</label>
            <div>{b?.phone || '—'}</div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase">Status</label>
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              ● Ativo
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-black/5">
        <h2 className="font-bold text-gray-800 mb-4">⚙️ Configurações</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Horário</span><span>{b?.config?.horario_funcionamento || '08:00-18:00'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Agendamento</span><span>{b?.config?.agendamento_tipo || 'gestor'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Moeda</span><span>{b?.config?.currency || 'BRL'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Dias abertos</span><span>{b?.config?.dias_abertos?.join(', ') || 'Seg-Sex'}</span></div>
        </div>
      </div>
    </div>
  )
}