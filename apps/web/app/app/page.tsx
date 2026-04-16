"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { apiFetch } from "../../lib/api";

type Summary = {
  contatos: number;
  produtos: number;
  transacoes: number;
  imoveis: number;
  leads: number;
  financeiro: { receitas: number; despesas: number; saldo: number };
};

export default function AppDashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch<Summary>("/api/dashboard/summary", token).then(setSummary).catch(() => setSummary(null));
  }, [token]);

  const cards = [
    { title: "Contatos", value: summary?.contatos ?? 0 },
    { title: "Produtos", value: summary?.produtos ?? 0 },
    { title: "Transações", value: summary?.transacoes ?? 0 },
    { title: "Imóveis", value: summary?.imoveis ?? 0 },
    { title: "Leads", value: summary?.leads ?? 0 },
    { title: "Saldo", value: `R$ ${(summary?.financeiro.saldo ?? 0).toFixed(2)}` },
  ];

  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Resumo da operação</h2>
        <p className="text-sm text-black/60">Indicadores consolidados por empresa.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="card">
            <p className="text-sm text-black/60">{card.title}</p>
            <p className="text-3xl font-bold">{card.value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
