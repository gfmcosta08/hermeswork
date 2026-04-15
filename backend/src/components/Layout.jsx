import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Store, Users, Package, Warehouse, Receipt,
  DollarSign, Settings, LogOut, Menu, X, Bell, ChevronDown,
  ChevronLeft, ChevronRight, User, FileText, Home
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

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const userName = localStorage.getItem('user_name') || user.name || 'Usuário'

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user')
    localStorage.removeItem('user_name')
    navigate('/login')
  }

  const NavLink = ({ item, mobile = false }) => {
    const isActive = location.pathname === item.path
    const Icon = item.icon
    return (
      <Link
        to={item.path}
        onClick={() => mobile && setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${isActive
            ? 'bg-gradient-to-r from-[#86C9CD] to-[#65B1B7] text-white shadow-md shadow-[#86C9CD]/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }
          ${mobile ? 'w-full' : ''}
        `}
      >
        <Icon size={20} />
        <span>{item.label}</span>
      </Link>
    )
  }

  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className={`flex items-center gap-3 px-4 ${mobile ? 'py-4' : 'h-16'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCE382] to-[#DF8B82] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#FCE382]/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && !mobile && (
          <div>
            <span className="font-bold text-white text-lg tracking-tight">FarollWork</span>
            <p className="text-[10px] text-white/40 -mt-0.5">Gestão Inteligente</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.path} item={item} mobile={mobile} />
        ))}
      </nav>

      <div className="py-4 px-3 border-t border-white/5 space-y-1">
        <Link
          to="/settings"
          onClick={() => mobile && setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Settings size={20} />
          <span>Configurações</span>
        </Link>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col fixed inset-y-0 left-0 z-40
        bg-[#1a1a1a] transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`
        lg:hidden flex flex-col fixed inset-y-0 left-0 z-50 w-[280px]
        bg-[#1a1a1a] transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FCE382] to-[#DF8B82] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-white text-lg">FarollWork</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent mobile />
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FCE382] to-[#DF8B82] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-gray-900">FarollWork</span>
            </div>

            {/* Desktop - Page Title */}
            <div className="hidden lg:block">
              <h1 className="font-semibold text-gray-900 capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace(/-/g, ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#86C9CD] to-[#65B1B7] flex items-center justify-center text-white text-sm font-medium">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">{userName}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="dropdown-menu animate-scale-in">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500">{user.email || 'usuário@exemplo.com'}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={16} />
                    Configurações
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="dropdown-item danger w-full"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-gray-100 bg-white">
          <p className="text-xs text-gray-400 text-center">© 2026 FarollWork — Sistema de Gestão Inteligente</p>
        </footer>
      </div>
    </div>
  )
}
