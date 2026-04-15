import { useEffect, useState } from 'react'
import { API } from '../App'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value || '—'}</div>
    </div>
  )
}

function AlertItem({ icon, text, type }) {
  const colors = {
    warning: 'border-l-4 border-yellow-400 bg-yellow-50',
    danger: 'border-l-4 border-red-400 bg-red-50',
    info: 'border-l-4 border-blue-400 bg-blue-50',
  }
  return (
    <div className={`rounded-xl p-4 ${colors[type] || colors.info}`}>
      <div className="flex items-center gap-3">
        <span>{icon}</span>
        <span className="text-sm">{text}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ contacts: 0, products: 0, transactions: 0, revenue: 0 })
  const [alerts, setAlerts] = useState([])
  const token = localStorage.getItem('token')

  useEffect(() => {
    async function load() {
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [contacts, products, transactions] = await Promise.all([
          fetch(`${API}/contacts`, { headers }).then(r => r.json()),
          fetch(`${API}/products`, { headers }).then(r => r.json()),
          fetch(`${API}/transactions`, { headers }).then(r => r.json()),
        ])
        const contacts_arr = Array.isArray(contacts) ? contacts : contacts.data || []
        const products_arr = Array.isArray(products) ? products : products.data || []
        const transactions_arr = Array.isArray(transactions) ? transactions : transactions.data || []
        setStats({
          contacts: contacts_arr.length,
          products: products_arr.length,
          transactions: transactions_arr.length,
          revenue: 'R$ 0,00',
        })
        setAlerts([
          { icon: '📋', text: 'Nenhuma alerta no momento', type: 'info' },
        ])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visão geral do seu negócio</p>
        </div>
        <div className="text-xs text-gray-400">FarollWork v1.0</div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Contatos" value={stats.contacts} color="text-blue-600" />
        <StatCard icon="📦" label="Produtos" value={stats.products} color="text-green-600" />
        <StatCard icon="📋" label="Transações" value={stats.transactions} color="text-purple-600" />
        <StatCard icon="💰" label="Receita" value={stats.revenue} color="text-amber-600" />
      </div>
      <div className="bg-white rounded-2xl p-6 border border-black/5">
        <h2 className="font-bold text-gray-800 mb-4">⚡ Alertas</h2>
        <div className="space-y-3">
          {alerts.map((a, i) => <AlertItem key={i} {...a} />)}
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-black/5">
        <h2 className="font-bold text-gray-800 mb-4">📋 Últimas Transações</h2>
        <div className="text-sm text-gray-400 text-center py-8">Nenhuma transação ainda</div>
      </div>
    </div>
  )
}