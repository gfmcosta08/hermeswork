"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-farol-luz/30 to-farol-nevoa p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Entrar no FarollWork</h1>
        <p className="text-sm text-black/60">Use as credenciais cadastradas no backend.</p>
        <input className="w-full rounded-xl border border-black/10 bg-white px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-xl border border-black/10 bg-white px-3 py-2" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-farol-noite px-4 py-2 font-medium text-white disabled:opacity-50">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
