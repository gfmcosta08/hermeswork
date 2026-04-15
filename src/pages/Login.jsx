import { useState } from 'react'
import { API } from '../App'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      if (!res.ok) throw new Error(data.detail || 'Erro no login')
      if (!data.access_token) throw new Error('Resposta da API inválida: access_token ausente')
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user_id', data.user_id || null)
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-dark/80 backdrop-blur rounded-2xl p-8 border border-brand-light/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-light to-brand-coral flex items-center justify-center text-3xl mx-auto mb-4">🔦</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-light to-brand-coral bg-clip-text text-transparent">FarollWork</h1>
          <p className="text-white/50 text-sm mt-1">Sistema de gestão via WhatsApp</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-brand-light outline-none transition" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-brand-light outline-none transition" />
          </div>
          {error && <p className="text-brand-coral text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-brand-turquoise to-brand-petrol text-brand-dark font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
