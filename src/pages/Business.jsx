import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Business() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetch(`${API}/business`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>

  const b = data?.data || data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🏪 Negócio</h1>
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
        </div>
      </div>
    </div>
  )
}