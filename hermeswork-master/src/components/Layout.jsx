import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/business', icon: '🏪', label: 'Negócio' },
  { path: '/contacts', icon: '👥', label: 'Contatos' },
  { path: '/products', icon: '📦', label: 'Produtos' },
  { path: '/inventory', icon: '🗃️', label: 'Estoque' },
  { path: '/transactions', icon: '📋', label: 'Transações' },
  { path: '/financial', icon: '💰', label: 'Financeiro' },
]

export default function Layout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <aside className={`bg-brand-dark text-white ${collapsed ? 'w-16' : 'w-60'} flex flex-col transition-all duration-200`}>
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-light to-brand-coral flex items-center justify-center text-lg flex-shrink-0">🔦</div>
          {!collapsed && <span className="font-bold text-sm bg-gradient-to-r from-brand-light to-brand-coral bg-clip-text text-transparent">FarollWork</span>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-white/10 text-brand-light' : 'hover:bg-white/5'}`}>
              <span>{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full p-2 text-center text-xs text-white/50 hover:text-white/80">
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
