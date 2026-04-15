import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Financial() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const business_id = JSON.parse(localStorage.getItem('user') || '{}').business_id || ''

  useEffect(() => {
    fetch(`${API}/financial?business_id=${business_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setEntries(Array.isArray(d) ? d : d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const receitas = entries.filter(e => e.type === 'receita').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const despesas = entries.filter(e => e.type === 'despesa').reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const saldo = receitas - despesas

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">💰 Financeiro</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="text-sm text-gray-500 mb-1">Entradas</div>
          <div className="text-2xl font-bold text-green-600">R$ {receitas.toFixed(2).replace('.', ',')}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="text-sm text-gray-500 mb-1">Saídas</div>
          <div className="text-2xl font-bold text-red-600">R$ {despesas.toFixed(2).replace('.', ',')}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/5">
          <div className="text-sm text-gray-500 mb-1">Saldo</div>
          <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>R$ {saldo.toFixed(2).replace('.', ',')}</div>
        </div>
      </div>
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhuma entrada financeira ainda</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">Descrição</td><td className="px-4 py-3 font-medium">Tipo</td><td className="px-4 py-3 font-medium">Valor</td></tr></thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3">{e.description || '—'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${e.type === 'receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.type}</span></td>
                  <td className={`px-4 py-3 font-bold ${e.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>R$ {parseFloat(e.amount || 0).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
