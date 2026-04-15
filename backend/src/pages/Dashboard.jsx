import { useEffect, useState } from 'react'
import { API } from '../App'
import {
  Users, Package, Receipt, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Clock, ArrowRight, ShoppingCart, UserPlus,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Plus
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, trend, trendUp, color, delay = 0 }) {
  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`stat-icon ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900">{value || '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-[#86C9CD]/50 hover:shadow-md transition-all duration-200 w-full"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={22} className="text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

function RecentTransaction({ transaction, contactName }) {
  const statusColors = {
    pendente: 'bg-yellow-100 text-yellow-700',
    confirmado: 'bg-blue-100 text-blue-700',
    cancelado: 'bg-red-100 text-red-700',
    concluido: 'bg-green-100 text-green-700'
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#86C9CD]/10 flex items-center justify-center">
          <ShoppingCart size={20} className="text-[#65B1B7]" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{contactName || 'Cliente'}</p>
          <p className="text-xs text-gray-500">{transaction.type || 'Transação'}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[transaction.status] || statusColors.pendente}`}>
          {transaction.status || 'pendente'}
        </span>
        <p className="text-xs text-gray-400 mt-1">
          {transaction.date_created ? new Date(transaction.date_created).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
        </p>
      </div>
    </div>
  )
}

function AlertItem({ type, title, message, time }) {
  const configs = {
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️', iconColor: 'text-amber-500' },
    danger: { bg: 'bg-red-50', border: 'border-red-200', icon: '🚨', iconColor: 'text-red-500' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: '✅', iconColor: 'text-green-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'ℹ️', iconColor: 'text-blue-500' }
  }
  const config = configs[type] || configs.info

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${config.bg} border ${config.border}`}>
      <span className="text-lg">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{message}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{time}</span>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ contacts: 0, products: 0, transactions: 0, revenue: 0 })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [contacts, setContacts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    async function load() {
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [contactsRes, productsRes, transactionsRes, financialRes] = await Promise.all([
          fetch(`${API}/contacts`, { headers }).then(r => r.json()),
          fetch(`${API}/products`, { headers }).then(r => r.json()),
          fetch(`${API}/transactions`, { headers }).then(r => r.json()),
          fetch(`${API}/financial`, { headers }).then(r => r.json()),
        ])

        const contacts_arr = Array.isArray(contactsRes) ? contactsRes : contactsRes.data || []
        const products_arr = Array.isArray(productsRes) ? productsRes : productsRes.data || []
        const transactions_arr = Array.isArray(transactionsRes) ? transactionsRes : transactionsRes.data || []
        const financial_arr = Array.isArray(financialRes) ? financialRes : financialRes.data || []

        const totalRevenue = financial_arr
          .filter(e => e.type === 'receita' && e.confirmed)
          .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

        setStats({
          contacts: contacts_arr.length,
          products: products_arr.length,
          transactions: transactions_arr.length,
          revenue: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        })

        setContacts(contacts_arr)
        setRecentTransactions(transactions_arr.slice(0, 5))

        const lowStockItems = products_arr.filter(p =>
          p.metadata?.low_stock || (p.quantity !== undefined && p.quantity < 5)
        ).slice(0, 3)
        setLowStock(lowStockItems)

        const generatedAlerts = []
        if (lowStockItems.length > 0) {
          generatedAlerts.push({ type: 'warning', title: 'Estoque Baixo', message: `${lowStockItems.length} produto(s) precisam de reposição`, time: 'Agora' })
        }
        const pendingTransactions = transactions_arr.filter(t => t.status === 'pendente').length
        if (pendingTransactions > 0) {
          generatedAlerts.push({ type: 'info', title: 'Agendamentos Pendentes', message: `${pendingTransactions} confirmação(ões) necessária(s)`, time: 'Agora' })
        }
        if (generatedAlerts.length === 0) {
          generatedAlerts.push({ type: 'success', title: 'Tudo certo!', message: 'Nenhum alerta no momento', time: 'Agora' })
        }
        setAlerts(generatedAlerts)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getContactName = (id) => {
    const c = contacts.find(x => x.id === id)
    return c ? c.name || c.whatsapp_number : id
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm">
            <Clock size={16} />
            Últimos 30 dias
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Contatos" value={stats.contacts} trend="+12%" trendUp color="bg-gradient-to-br from-blue-500 to-blue-600" delay={0} />
        <StatCard icon={Package} label="Produtos" value={stats.products} color="bg-gradient-to-br from-green-500 to-green-600" delay={100} />
        <StatCard icon={Receipt} label="Transações" value={stats.transactions} trend="+5%" trendUp color="bg-gradient-to-br from-purple-500 to-purple-600" delay={200} />
        <StatCard icon={DollarSign} label="Receita" value={stats.revenue} trend="+8%" trendUp color="bg-gradient-to-br from-[#D59846] to-[#9E7452]" delay={300} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">Transações Recentes</h3>
              <p className="text-sm text-gray-500">Últimas 5 transações</p>
            </div>
            <button className="btn btn-ghost btn-sm text-[#65B1B7]" onClick={() => window.location.href = '/transactions'}>
              Ver todas <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-2">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">Nenhuma transação</p>
                <p className="text-sm text-gray-500 mt-1">As transações aparecerão aqui</p>
                <button className="btn btn-primary btn-sm mt-4" onClick={() => window.location.href = '/transactions'}>
                  <Plus size={14} /> Nova transação
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentTransactions.map(t => (
                  <RecentTransaction key={t.id} transaction={t} contactName={getContactName(t.customer_id)} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Alertas
              </h3>
              <span className="text-xs text-gray-400">{alerts.length} items</span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <AlertItem key={i} {...alert} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction icon={UserPlus} label="Novo Contato" color="bg-gradient-to-br from-blue-500 to-blue-600" onClick={() => window.location.href = '/contacts'} />
              <QuickAction icon={Package} label="Novo Produto" color="bg-gradient-to-br from-green-500 to-green-600" onClick={() => window.location.href = '/products'} />
              <QuickAction icon={Receipt} label="Nova Venda" color="bg-gradient-to-br from-purple-500 to-purple-600" onClick={() => window.location.href = '/transactions'} />
              <QuickAction icon={DollarSign} label="Lançar Despesa" color="bg-gradient-to-br from-[#D59846] to-[#9E7452]" onClick={() => window.location.href = '/financial'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
