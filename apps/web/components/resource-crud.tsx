"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date";
};

type Props = {
  title: string;
  resource: string;
  fields: Field[];
};

export function ResourceCrud({ title, resource, fields }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ data: Record<string, unknown>[] }>(`/api/${resource}`, token);
      setItems(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      const value = form[f.name];
      if (value === undefined || value === "") return;
      payload[f.name] = f.type === "number" ? Number(value) : value;
    });

    try {
      await apiFetch(`/api/${resource}`, token, { method: "POST", body: JSON.stringify(payload) });
      setForm({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    try {
      await apiFetch(`/api/${resource}/${id}`, token, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-black/60">Cadastro e gestão de {title.toLowerCase()}.</p>
      </div>

      <form onSubmit={onCreate} className="card grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <label key={field.name} className="text-sm">
            <span className="mb-1 block text-black/60">{field.label}</span>
            <input
              type={field.type ?? "text"}
              value={form[field.name] ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
            />
          </label>
        ))}
        <div className="md:col-span-2 lg:col-span-3">
          <button className="rounded-xl bg-farol-turquesa px-4 py-2 font-medium">Criar</button>
        </div>
      </form>

      <div className="card overflow-auto">
        {loading ? <p>Carregando...</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-2">ID</th>
              {fields.map((f) => (
                <th key={f.name} className="py-2">
                  {f.label}
                </th>
              ))}
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={String(item.id)} className="border-b border-black/5">
                <td className="py-2 pr-2 text-xs">{String(item.id).slice(0, 8)}...</td>
                {fields.map((f) => (
                  <td key={f.name} className="py-2 pr-2">
                    {String(item[f.name] ?? "-")}
                  </td>
                ))}
                <td className="py-2">
                  <button className="text-red-700" onClick={() => onDelete(String(item.id))}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
