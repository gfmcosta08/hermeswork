"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";

type LogItem = {
  id: string;
  empresa_id: string;
  actor_type: string;
  actor_id?: string | null;
  action_name: string;
  result_status: string;
  created_at: string;
};

export default function AdminLogsPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<LogItem[]>([]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    apiFetch<{ data: LogItem[] }>("/api/auditoria", token).then((res) => setItems(res.data ?? []));
  }, [token, user?.role]);

  if (user?.role !== "admin") {
    return <main className="card">Acesso restrito a administradores.</main>;
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Logs resumidos</h2>
      </div>
      <div className="card overflow-auto">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2">Data</th>
              <th className="py-2">Empresa</th>
              <th className="py-2">Ator</th>
              <th className="py-2">Ação</th>
              <th className="py-2">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-black/5">
                <td className="py-2">{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                <td className="py-2">{item.empresa_id.slice(0, 8)}...</td>
                <td className="py-2">{item.actor_type}</td>
                <td className="py-2">{item.action_name}</td>
                <td className="py-2">{item.result_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
