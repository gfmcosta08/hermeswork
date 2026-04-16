"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";

type HealthItem = {
  empresa_id: string;
  agent_name: string;
  module_mode: string;
  internal_url: string;
  internal_port: number;
  deployment_status: string;
  health_status: string;
  is_active: boolean;
};

export default function AdminSaudePage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<HealthItem[]>([]);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;
    apiFetch<{ data: HealthItem[] }>("/api/admin/provision/list", token).then((res) => {
      setItems((res.data ?? []).map((i) => ({
        empresa_id: i.empresa_id,
        agent_name: i.agent_name,
        module_mode: i.module_mode,
        internal_url: "-",
        internal_port: i.internal_port,
        deployment_status: i.deployment_status,
        health_status: i.health_status,
        is_active: i.is_active,
      })));
    });
  }, [token, user?.role]);

  if (user?.role !== "admin") return <main className="card">Acesso restrito a administradores.</main>;

  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Saúde das Instâncias Hermes</h2>
      </div>
      <div className="card overflow-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2">Empresa</th>
              <th className="py-2">Agente</th>
              <th className="py-2">Módulo</th>
              <th className="py-2">Porta</th>
              <th className="py-2">Status Deploy</th>
              <th className="py-2">Health</th>
              <th className="py-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.empresa_id} className="border-b border-black/5">
                <td className="py-2">{item.empresa_id.slice(0, 8)}...</td>
                <td className="py-2">{item.agent_name}</td>
                <td className="py-2">{item.module_mode}</td>
                <td className="py-2">{item.internal_port}</td>
                <td className="py-2">{item.deployment_status}</td>
                <td className="py-2">{item.health_status}</td>
                <td className="py-2">{item.is_active ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
