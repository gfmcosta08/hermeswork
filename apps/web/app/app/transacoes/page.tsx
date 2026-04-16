"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { apiFetch } from "../../../lib/api";

type Transacao = {
  id: string;
  tipo: string;
  status: string;
  observacao?: string;
  created_at: string;
};

export default function TransacoesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Transacao[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    try {
      const res = await apiFetch<{ data: Transacao[] }>("/api/transacoes", token);
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function changeStatus(id: string, action: "confirmar" | "cancelar") {
    if (!token) return;
    await apiFetch(`/api/transacoes/${id}/${action}`, token, { method: "POST" });
    await load();
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Transações</h2>
        <p className="text-sm text-black/60">Acompanhe e altere o status de pedidos/agendamentos.</p>
      </div>
      <div className="card overflow-auto">
        {error && <p className="text-red-700">{error}</p>}
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2">ID</th>
              <th className="py-2">Tipo</th>
              <th className="py-2">Status</th>
              <th className="py-2">Observação</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-black/5">
                <td className="py-2">{item.id.slice(0, 8)}...</td>
                <td className="py-2">{item.tipo}</td>
                <td className="py-2">{item.status}</td>
                <td className="py-2">{item.observacao ?? "-"}</td>
                <td className="py-2">
                  <div className="flex gap-3">
                    <button className="text-emerald-700" onClick={() => changeStatus(item.id, "confirmar")}>
                      Confirmar
                    </button>
                    <button className="text-red-700" onClick={() => changeStatus(item.id, "cancelar")}>
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
