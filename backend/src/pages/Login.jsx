import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../App'
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Credenciais inválidas')
      if (!data.access_token) throw new Error('Token não recebido')

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user_id', data.user_id || null)
      localStorage.setItem('user', JSON.stringify({
        business_id: data.business_id,
        role: data.role,
        email: email,
        name: email.split('@')[0]
      }))
      localStorage.setItem('user_name', email.split('@')[0])
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] relative overflow-hidden flex-col justify-between p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#FCE382]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#86C9CD]/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.03] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.03] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/[0.03] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FCE382] to-[#DF8B82] flex items-center justify-center shadow-xl shadow-[#FCE382]/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">FarollWork</h1>
              <p className="text-white/50 text-sm">Sistema de Gestão Inteligente</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Gestão completa do<br />
            <span className="bg-gradient-to-r from-[#FCE382] to-[#86C9CD] bg-clip-text text-transparent">
              seu negócio
            </span>
          </h2>

          <p className="text-white/50 text-lg max-w-md mb-12 leading-relaxed">
            Controle vendas, estoque, financeiro e clientes tudo pelo WhatsApp. Simples, rápido e eficiente.
          </p>

          <div className="flex gap-12">
            {[
              { value: '500+', label: 'Empresas' },
              { value: '50k+', label: 'Mensagens/dia' },
              { value: '99.9%', label: 'Uptime' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl font-bold text-white">{stat.value}</p>
                <p className="text-white/40 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { icon: '💬', title: 'WhatsApp', desc: 'Comunique via WhatsApp' },
            { icon: '📊', title: 'Dashboard', desc: 'Visão completa' },
            { icon: '💰', title: 'Financeiro', desc: 'Controle total' },
            { icon: '📦', title: 'Estoque', desc: 'Sem faltantes' }
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <span className="text-xl mb-2 block">{feature.icon}</span>
              <p className="text-white font-medium text-sm">{feature.title}</p>
              <p className="text-white/40 text-xs mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#f8f9fa]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FCE382] to-[#DF8B82] flex items-center justify-center shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">FarollWork</span>
          </div>

          <div className="card p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta</h2>
              <p className="text-gray-500">Entre com suas credenciais para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="input"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="input pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">
                Esqueceu sua senha?{' '}
                <a href="#" className="text-[#65B1B7] hover:text-[#86C9CD] font-medium">
                  Recuperar
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 FarollWork. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
