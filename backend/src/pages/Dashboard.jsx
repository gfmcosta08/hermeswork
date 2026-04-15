import { useEffect, useState } from 'react'
import { API } from '../App'
import {
  Users,
  Package,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  UserPlus
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, trend, trendUp, color }) {
  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={`stat-icon ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value || '—'}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  )
}

function AlertCard({ icon: Icon, title, message, type, time }) {
  const colors = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }
  return (
    <div className={`rounded-xl p-4 border ${colors[type] || colors.info} animate-slide-in`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-sm opacity-80 mt-0.5">{message}</p>
        </div>
        <span className="text-xs opacity-60 flex-shrink-0">{time}</span>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-black/5 hover:border-[#86C9CD]/50 hover:shadow-md transition-all duration-200"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#86C9CD]/10 to-[#65B1B7]/10 flex items-center justify-center">
        <Icon size={24} className="text-[#65B1B7]" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ contacts: 0, products: 0, transactions: 0, revenue: 0 })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [lowStock, setLowStock] = useState([])
  const token = localStorage.getItem('token')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [contacts, products, transactions, financial] = await Promise.all([
          fetch(`${API}/contacts`, { headers }).then(r => r.json()),
          fetch(`${API}/products`, { headers }).then(r => r.json()),
          fetch(`${API}/transactions`, { headers }).then(r => r.json()),
          fetch(`${API}/financial`, { headers }).then(r => r.json()),
        ])
        const contacts_arr = Array.isArray(contacts) ? contacts : contacts.data || []
        const products_arr = Array.isArray(products) ? products : products.data || []
        const transactions_arr = Array.isArray(transactions) ? transactions : transactions.data || []
        const financial_arr = Array.isArray(financial) ? financial : financial.data || []

        const totalRevenue = financial_arr
          .filter(e => e.type === 'receita' && e.confirmed)
          .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

        setStats({
          contacts: contacts_arr.length,
          products: products_arr.length,
          transactions: transactions_arr.length,
          revenue: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        })

        setRecentTransactions(transactions_arr.slice(0, 5))

        const lowStockItems = products_arr.filter(p =>
          p.metadata?.low_stock || (p.quantity !== undefined && p.quantity < 5)
        ).slice(0, 5)
        setLowStock(lowStockItems)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-gray-200 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Contatos"
          value={stats.contacts}
          trend="+12%"
          trendUp
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Package}
          label="Produtos"
          value={stats.products}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={Receipt}
          label="Transações"
          value={stats.transactions}
          trend="+5%"
          trendUp
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          icon={DollarSign}
          label="Receita"
          value={stats.revenue}
          trend="+8%"
          trendUp
          color="bg-gradient-to-br from-[#D59846] to-[#D59846]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-5 border-b border-black/5 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Transações Recentes</h3>
              <button className="text-sm text-[#65B1B7] hover:text-[#86C9CD] flex items-center gap-1">
                Ver todas <ArrowRight size={14} />
              </button>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="empty-state">
                <Receipt size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="font-medium">Nenhuma transação ainda</p>
                <p className="text-sm mt-1">As transações aparecerão aqui</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {recentTransactions.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-black/[0.02] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#86C9CD]/10 flex items-center justify-center">
                        <ShoppingCart size={18} className="text-[#65B1B7]" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{t.type || 'Transação'}</p>
                        <p className="text-xs text-gray-500">{formatDate(t.date_created)}</p>
                      </div>
                    </div>
                    <span className={`badge ${
                      t.status === 'confirmado' ? 'badge-success' :
                      t.status === 'pendente' ? 'badge-warning' :
                      t.status === 'cancelado' ? 'badge-danger' : 'badge-info'
                    }`}>
                      {t.status || 'pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div>
          <div className="card">
            <div className="p-5 border-b border-black/5">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Alertas
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {lowStock.length > 0 ? (
                lowStock.map(p => (
                  <AlertCard
                    key={p.id}
                    icon={Package}
                    title="Estoque Baixo"
                    message={`${p.name} precisa de reposição`}
                    type="warning"
                    time="Agora"
                  />
                ))
              ) : (
                <AlertCard
                  icon={TrendingUp}
                  title="Tudo ok!"
                  message="Nenhum alerta no momento"
                  type="success"
                  time="Agora"
                />
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card mt-5">
            <div className="p-5 border-b border-black/5">
              <h3 className="font-semibold text-lg">Ações Rápidas</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <QuickAction icon={UserPlus} label="Novo Contato" onClick={() => window.location.href = '/contacts'} />
              <QuickAction icon={Package} label="Novo Produto" onClick={() => window.location.href = '/products'} />
              <QuickAction icon={Receipt} label="Nova Venda" onClick={() => window.location.href = '/transactions'} />
              <QuickAction icon={DollarSign} label="Lançar Despesa" onClick={() => window.location.href = '/financial'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
