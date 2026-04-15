import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const business_id = JSON.parse(localStorage.getItem('user') || '{}').business_id || ''

  useEffect(() => {
    fetch(`${API}/inventory?business_id=${business_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : d.data || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">🗃️ Estoque</h1>
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhum item no estoque</div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><td className="px-4 py-3 font-medium">Nome</td><td className="px-4 py-3 font-medium">Quantidade</td><td className="px-4 py-3 font-medium">Mínimo</td><td className="px-4 py-3 font-medium">Preço Compra</td></tr></thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-black/5 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{i.name}</td>
                  <td className="px-4 py-3">{i.quantity} {i.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{i.min_threshold} {i.unit}</td>
                  <td className="px-4 py-3 text-brand-ocre font-bold">R$ {parseFloat(i.purchase_price || 0).toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
