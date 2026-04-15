import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const business_id = JSON.parse(localStorage.getItem('user') || '{}').business_id || ''

  useEffect(() => {
    fetch(`${API}/transactions?business_id=${business_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTransactions(Array.isArray(d) ? d : d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const statusColors = { pendente: 'bg-yellow-100 text-yellow-700', confirmado: 'bg-blue-100 text-blue-700', cancelado: 'bg-red-100 text-red-700', concluido: 'bg-green-100 text-green-700' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📋 Transações</h1>
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhuma transação ainda</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">ID</td><td className="px-4 py-3 font-medium">Tipo</td><td className="px-4 py-3 font-medium">Status</td><td className="px-4 py-3 font-medium">Data</td></tr></thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{String(t.id).slice(0,8)}...</td>
                  <td className="px-4 py-3">{t.type}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColors[t.status] || ''}`}>{t.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{t.date_created ? new Date(t.date_created).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
