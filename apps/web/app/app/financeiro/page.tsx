"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { apiFetch } from "../../../lib/api";

type Entry = {
  id: string;
  tipo: "receita" | "despesa";
  valor: number;
  categoria?: string;
  forma_pagamento?: string;
  created_at: string;
};

export default function FinanceiroPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0 });
  const [form, setForm] = useState({ tipo: "receita", valor: "", categoria: "", forma_pagamento: "pix" });

  async function load() {
    if (!token) return;
    const res = await apiFetch<{ data: Entry[]; resumo: { receitas: number; despesas: number; saldo: number } }>(
      "/api/financeiro/relatorio",
      token,
    );
    setEntries(res.data);
    setResumo(res.resumo);
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    await apiFetch("/api/financeiro", token, {
      method: "POST",
      body: JSON.stringify({
        tipo: form.tipo,
        valor: Number(form.valor),
        categoria: form.categoria,
        forma_pagamento: form.forma_pagamento,
      }),
    });

    setForm({ tipo: "receita", valor: "", categoria: "", forma_pagamento: "pix" });
    await load();
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <p className="text-sm text-black/60">Lançamentos e relatório consolidado.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card">
          <p className="text-sm text-black/60">Receitas</p>
          <p className="text-2xl font-bold text-emerald-700">R$ {resumo.receitas.toFixed(2)}</p>
        </article>
        <article className="card">
          <p className="text-sm text-black/60">Despesas</p>
          <p className="text-2xl font-bold text-red-700">R$ {resumo.despesas.toFixed(2)}</p>
        </article>
        <article className="card">
          <p className="text-sm text-black/60">Saldo</p>
          <p className="text-2xl font-bold">R$ {resumo.saldo.toFixed(2)}</p>
        </article>
      </section>

      <form onSubmit={onSubmit} className="card grid gap-3 md:grid-cols-4">
        <select className="rounded-lg border border-black/10 bg-white px-3 py-2" value={form.tipo} onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}>
          <option value="receita">Receita</option>
          <option value="despesa">Despesa</option>
        </select>
        <input className="rounded-lg border border-black/10 bg-white px-3 py-2" type="number" step="0.01" placeholder="Valor" value={form.valor} onChange={(e) => setForm((s) => ({ ...s, valor: e.target.value }))} />
        <input className="rounded-lg border border-black/10 bg-white px-3 py-2" placeholder="Categoria" value={form.categoria} onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value }))} />
        <input className="rounded-lg border border-black/10 bg-white px-3 py-2" placeholder="Forma pagamento" value={form.forma_pagamento} onChange={(e) => setForm((s) => ({ ...s, forma_pagamento: e.target.value }))} />
        <div className="md:col-span-4">
          <button className="rounded-xl bg-farol-turquesa px-4 py-2 font-medium">Lançar</button>
        </div>
      </form>

      <div className="card overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2">Data</th>
              <th className="py-2">Tipo</th>
              <th className="py-2">Valor</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-black/5">
                <td className="py-2">{new Date(entry.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="py-2">{entry.tipo}</td>
                <td className="py-2">R$ {Number(entry.valor).toFixed(2)}</td>
                <td className="py-2">{entry.categoria ?? "-"}</td>
                <td className="py-2">{entry.forma_pagamento ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
