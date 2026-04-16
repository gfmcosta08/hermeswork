"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth";

type ProvisionItem = {
  empresa_id: string;
  agent_name: string;
  module_mode: "comercio" | "imobiliaria";
  internal_port: number;
  health_status: string;
  deployment_status: string;
  is_active: boolean;
  last_response_at?: string | null;
  created_at: string;
  empresa?: { nome?: string; slug?: string; provision_status?: string };
};

type FormState = {
  nome: string;
  slug: string;
  module_mode: "comercio" | "imobiliaria";
  timezone: string;
  ativo: boolean;
  telefone_principal: string;
  responsavel: string;
  email_responsavel: string;
  observacoes: string;
  agent_name: string;
  internal_port: number;
  auth_token: string;
  prompt_profile: "global" | "comercio" | "imobiliaria";
  internal_url: string;
  deployment_mode: "local_vps" | "hostinger_api";
};

const initialForm: FormState = {
  nome: "",
  slug: "",
  module_mode: "comercio",
  timezone: "America/Sao_Paulo",
  ativo: true,
  telefone_principal: "",
  responsavel: "",
  email_responsavel: "",
  observacoes: "",
  agent_name: "",
  internal_port: 9100,
  auth_token: "",
  prompt_profile: "global",
  internal_url: "http://127.0.0.1:9100",
  deployment_mode: "local_vps",
};

export default function ProvisionamentoPage() {
  const { token, user } = useAuth();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProvisionItem[]>([]);

  const preview = useMemo(() => ({
    empresa: {
      nome: form.nome,
      slug: form.slug,
      module_mode: form.module_mode,
      timezone: form.timezone,
      ativo: form.ativo,
      telefone_principal: form.telefone_principal || null,
      responsavel: form.responsavel || null,
      email_responsavel: form.email_responsavel || null,
      observacoes: form.observacoes || null,
    },
    agent_instance: {
      agent_name: form.agent_name,
      internal_port: Number(form.internal_port),
      auth_token: form.auth_token ? "[custom]" : "[auto]",
      prompt_profile: form.prompt_profile,
      deployment_mode: form.deployment_mode,
      internal_url: form.internal_url,
    },
  }), [form]);

  async function load() {
    if (!token) return;
    try {
      const data = await apiFetch<{ data: ProvisionItem[] }>("/api/admin/provision/list", token);
      setItems(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar provisionamento");
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      await apiFetch("/api/admin/provision/client", token, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          internal_port: Number(form.internal_port),
          auth_token: form.auth_token || undefined,
        }),
      });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao provisionar cliente");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(empresaId: string, action: "pause" | "resume" | "restart" | "rotate_token" | "test") {
    if (!token) return;
    setError(null);
    try {
      await apiFetch(`/api/admin/provision/${empresaId}/${action}`, token, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na ação da instância");
    }
  }

  if (user?.role !== "admin") {
    return <main className="card">Acesso restrito a administradores.</main>;
  }

  return (
    <main className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">Provisionamento de Clientes</h2>
        <p className="text-sm text-black/60">Criar e gerenciar stacks Hermes sem precisar codar.</p>
      </div>

      <form onSubmit={onSubmit} className="card grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Nome da empresa" value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} required />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} required />
        <select className="rounded-lg border border-black/10 px-3 py-2" value={form.module_mode} onChange={(e) => setForm((s) => ({ ...s, module_mode: e.target.value as FormState["module_mode"] }))}>
          <option value="comercio">Comércio</option>
          <option value="imobiliaria">Imobiliária</option>
        </select>
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Timezone" value={form.timezone} onChange={(e) => setForm((s) => ({ ...s, timezone: e.target.value }))} />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Telefone principal" value={form.telefone_principal} onChange={(e) => setForm((s) => ({ ...s, telefone_principal: e.target.value }))} />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Responsável" value={form.responsavel} onChange={(e) => setForm((s) => ({ ...s, responsavel: e.target.value }))} />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Email responsável" value={form.email_responsavel} onChange={(e) => setForm((s) => ({ ...s, email_responsavel: e.target.value }))} />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Nome da instância Hermes" value={form.agent_name} onChange={(e) => setForm((s) => ({ ...s, agent_name: e.target.value }))} required />
        <input className="rounded-lg border border-black/10 px-3 py-2" type="number" placeholder="Porta interna" value={form.internal_port} onChange={(e) => setForm((s) => ({ ...s, internal_port: Number(e.target.value) }))} required />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="URL interna" value={form.internal_url} onChange={(e) => setForm((s) => ({ ...s, internal_url: e.target.value }))} required />
        <input className="rounded-lg border border-black/10 px-3 py-2" placeholder="Token interno (opcional)" value={form.auth_token} onChange={(e) => setForm((s) => ({ ...s, auth_token: e.target.value }))} />
        <select className="rounded-lg border border-black/10 px-3 py-2" value={form.prompt_profile} onChange={(e) => setForm((s) => ({ ...s, prompt_profile: e.target.value as FormState["prompt_profile"] }))}>
          <option value="global">Global</option>
          <option value="comercio">Comércio</option>
          <option value="imobiliaria">Imobiliária</option>
        </select>
        <select className="rounded-lg border border-black/10 px-3 py-2" value={form.deployment_mode} onChange={(e) => setForm((s) => ({ ...s, deployment_mode: e.target.value as FormState["deployment_mode"] }))}>
          <option value="local_vps">Provisionamento local VPS</option>
          <option value="hostinger_api">Provisionamento API Hostinger</option>
        </select>
        <textarea className="rounded-lg border border-black/10 px-3 py-2 md:col-span-2 lg:col-span-3" placeholder="Observações" value={form.observacoes} onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))} />

        <div className="md:col-span-2 lg:col-span-3">
          <p className="mb-2 text-sm text-black/60">Pré-visualização do que será criado:</p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-black/90 p-3 text-xs text-white">{JSON.stringify(preview, null, 2)}</pre>
        </div>

        {error ? <p className="text-sm text-red-700 md:col-span-2 lg:col-span-3">{error}</p> : null}
        <div className="md:col-span-2 lg:col-span-3">
          <button disabled={loading} className="rounded-xl bg-farol-noite px-4 py-2 font-medium text-white disabled:opacity-50">
            {loading ? "Provisionando..." : "Salvar e Provisionar"}
          </button>
        </div>
      </form>

      <div className="card overflow-auto">
        <h3 className="mb-3 text-lg font-semibold">Lista de clientes / instâncias</h3>
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2">Empresa</th>
              <th className="py-2">Módulo</th>
              <th className="py-2">Hermes</th>
              <th className="py-2">Saúde</th>
              <th className="py-2">Status</th>
              <th className="py-2">Última resposta</th>
              <th className="py-2">Porta</th>
              <th className="py-2">Criado em</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.empresa_id} className="border-b border-black/5">
                <td className="py-2">{item.empresa?.nome ?? item.empresa_id.slice(0, 8)}</td>
                <td className="py-2">{item.module_mode}</td>
                <td className="py-2">{item.agent_name}</td>
                <td className="py-2">{item.health_status}</td>
                <td className="py-2">{item.deployment_status}</td>
                <td className="py-2">{item.last_response_at ? new Date(item.last_response_at).toLocaleString("pt-BR") : "-"}</td>
                <td className="py-2">{item.internal_port}</td>
                <td className="py-2">{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded bg-black/5 px-2 py-1" onClick={() => runAction(item.empresa_id, "test")}>Testar</button>
                    <button className="rounded bg-black/5 px-2 py-1" onClick={() => runAction(item.empresa_id, "restart")}>Reiniciar</button>
                    {item.is_active ? (
                      <button className="rounded bg-yellow-100 px-2 py-1" onClick={() => runAction(item.empresa_id, "pause")}>Pausar</button>
                    ) : (
                      <button className="rounded bg-emerald-100 px-2 py-1" onClick={() => runAction(item.empresa_id, "resume")}>Reativar</button>
                    )}
                    <button className="rounded bg-blue-100 px-2 py-1" onClick={() => runAction(item.empresa_id, "rotate_token")}>Rotacionar token</button>
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
