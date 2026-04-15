import { useEffect, useState } from 'react'
import { API } from '../App'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')
  const business_id = JSON.parse(localStorage.getItem('user') || '{}').business_id || ''

  useEffect(() => {
    fetch(`${API}/products?business_id=${business_id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : d.data || []))
      .finally(() => setLoading(false))
  }, [])

  const typeColors = { produto_estoque: 'bg-blue-100', servico: 'bg-purple-100', mao_de_obra: 'bg-orange-100', imovel: 'bg-green-100' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">📦 Produtos</h1>
      {loading ? <div className="text-center text-gray-400 py-8">Carregando...</div> : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border text-center text-gray-400">Nenhum produto cadastrado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-5 border border-black/5">
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">{p.name}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${typeColors[p.type] || ''}`}>{p.type}</span>
              </div>
              <div className="text-2xl font-bold text-brand-ocre">R$ {parseFloat(p.price || 0).toFixed(2).replace('.', ',')}</div>
              <div className="text-xs text-gray-400 mt-1">{p.category || 'Sem categoria'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
