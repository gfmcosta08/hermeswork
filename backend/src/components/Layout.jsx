import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  Warehouse,
  Receipt,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/business', icon: Store, label: 'Negócio' },
  { path: '/contacts', icon: Users, label: 'Contatos' },
  { path: '/products', icon: Package, label: 'Produtos' },
  { path: '/inventory', icon: Warehouse, label: 'Estoque' },
  { path: '/transactions', icon: Receipt, label: 'Transações' },
  { path: '/financial', icon: DollarSign, label: 'Financeiro' },
]

const secondaryItems = [
  { path: '/quotes', icon: FileText, label: 'Orçamentos' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path
    const Icon = item.icon
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Icon size={20} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-[#1a1a1a] flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCE382] to-[#DF8B82] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <span className="font-bold text-white text-lg tracking-tight">FarollWork</span>
                <p className="text-[10px] text-white/40 -mt-1">Gestão Inteligente</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Secondary nav */}
        <div className="py-4 px-3 border-t border-white/5">
          {secondaryItems.map(item => (
            <NavLink key={item.path} item={item} />
          ))}
        </div>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-white/5 transition`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#86C9CD] to-[#65B1B7] flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{user.name || 'Usuário'}</p>
                <p className="text-[11px] text-white/40 truncate">{user.email || 'email@exemplo.com'}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-2 w-full flex items-center gap-3 p-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-400/10 transition ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-black/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-black/5 transition"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-semibold text-lg capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-black/5 transition">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-[#f5f5f7]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
