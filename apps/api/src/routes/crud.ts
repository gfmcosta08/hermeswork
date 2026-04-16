import type { FastifyInstance } from "fastify";
import { requireAuth, requireRole } from "../lib/require-auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const resources = {
  empresas: { table: "empresa", scoped: false, adminOnly: true },
  usuarios: { table: "usuario", scoped: true, adminOnly: true },
  contatos: { table: "contato", scoped: true, adminOnly: false },
  produtos: { table: "produto", scoped: true, adminOnly: false },
  estoque: { table: "estoque", scoped: true, adminOnly: false },
  transacoes: { table: "transacao", scoped: true, adminOnly: false },
  financeiro: { table: "financeiro", scoped: true, adminOnly: false },
  imoveis: { table: "imovel", scoped: true, adminOnly: false },
  leads: { table: "lead_imovel", scoped: true, adminOnly: false },
  notificacoes: { table: "notificacao_evento", scoped: true, adminOnly: false },
} as const;

type Resource = keyof typeof resources;

function resolveResource(key: string) {
  return (resources as Record<string, { table: string; scoped: boolean; adminOnly: boolean }>)[key] ?? null;
}

export async function crudRoutes(app: FastifyInstance) {
  app.get("/api/:resource", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const resource = (request.params as { resource: string }).resource;
    const conf = resolveResource(resource);
    if (!conf) return reply.status(404).send({ error: "Recurso não encontrado" });
    if (conf.adminOnly && !requireRole(auth, ["admin"], reply)) return;

    let query = supabaseAdmin.from(conf.table).select("*").limit(200);
    if (conf.scoped) query = query.eq("empresa_id", auth.empresaId);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return reply.status(400).send({ error: error.message });

    return reply.send({ data });
  });

  app.get("/api/:resource/:id", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const { resource, id } = request.params as { resource: string; id: string };
    const conf = resolveResource(resource);
    if (!conf) return reply.status(404).send({ error: "Recurso não encontrado" });
    if (conf.adminOnly && !requireRole(auth, ["admin"], reply)) return;

    let query = supabaseAdmin.from(conf.table).select("*").eq("id", id);
    if (conf.scoped) query = query.eq("empresa_id", auth.empresaId);

    const { data, error } = await query.single();
    if (error) return reply.status(404).send({ error: "Registro não encontrado" });

    return reply.send({ data });
  });

  app.post("/api/:resource", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const resource = (request.params as { resource: string }).resource;
    const conf = resolveResource(resource);
    if (!conf) return reply.status(404).send({ error: "Recurso não encontrado" });
    if (conf.adminOnly && !requireRole(auth, ["admin"], reply)) return;

    const payload = { ...(request.body as Record<string, unknown>) };
    if (conf.scoped) payload.empresa_id = auth.empresaId;

    const { data, error } = await supabaseAdmin.from(conf.table).insert(payload).select("*").single();
    if (error) return reply.status(400).send({ error: error.message });

    return reply.status(201).send({ data });
  });

  app.put("/api/:resource/:id", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const { resource, id } = request.params as { resource: string; id: string };
    const conf = resolveResource(resource);
    if (!conf) return reply.status(404).send({ error: "Recurso não encontrado" });
    if (conf.adminOnly && !requireRole(auth, ["admin"], reply)) return;

    const payload = { ...(request.body as Record<string, unknown>), updated_at: new Date().toISOString() };

    let query = supabaseAdmin.from(conf.table).update(payload).eq("id", id);
    if (conf.scoped) query = query.eq("empresa_id", auth.empresaId);

    const { data, error } = await query.select("*").single();
    if (error) return reply.status(400).send({ error: error.message });

    return reply.send({ data });
  });

  app.delete("/api/:resource/:id", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const { resource, id } = request.params as { resource: string; id: string };
    const conf = resolveResource(resource);
    if (!conf) return reply.status(404).send({ error: "Recurso não encontrado" });
    if (conf.adminOnly && !requireRole(auth, ["admin"], reply)) return;

    let query = supabaseAdmin.from(conf.table).delete().eq("id", id);
    if (conf.scoped) query = query.eq("empresa_id", auth.empresaId);

    const { error } = await query;
    if (error) return reply.status(400).send({ error: error.message });

    return reply.status(204).send();
  });
}
