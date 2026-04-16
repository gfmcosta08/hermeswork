import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireAuth, requireRole } from "../lib/require-auth.js";
import { ALLOWED_FUNCTIONS } from "../lib/agent-config.js";
import { executeProvision, writeAudit } from "../lib/provisioner.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireInternalToken } from "../lib/internal-security.js";

const createClientSchema = z.object({
  nome: z.string().min(2),
  slug: z.string().min(2),
  module_mode: z.enum(["comercio", "imobiliaria"]),
  timezone: z.string().default("America/Sao_Paulo"),
  ativo: z.boolean().default(true),
  telefone_principal: z.string().optional(),
  responsavel: z.string().optional(),
  email_responsavel: z.string().email().optional(),
  observacoes: z.string().optional(),
  agent_name: z.string().min(2),
  internal_port: z.number().int().positive().optional(),
  auth_token: z.string().min(12).optional(),
  prompt_profile: z.enum(["global", "comercio", "imobiliaria"]).default("global"),
  allowed_functions: z.array(z.string()).optional(),
  internal_url: z.string().url(),
  deployment_mode: z.enum(["hostinger_api", "local_vps"]).default("local_vps"),
});

const actionSchema = z.object({
  empresa_id: z.string().uuid(),
});

const internalProvisionSchema = z.object({
  nome: z.string().min(2),
  module_mode: z.enum(["comercio", "imobiliaria"]),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  slug: z.string().min(2).optional(),
});

async function allocatePort(): Promise<number> {
  const { data } = await supabaseAdmin
    .from("agent_instance")
    .select("internal_port")
    .order("internal_port", { ascending: false })
    .limit(1);

  const maxPort = Number(data?.[0]?.internal_port ?? 3100);
  return maxPort + 1;
}

export async function provisioningRoutes(app: FastifyInstance) {
  app.post("/api/admin/provision/client", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    if (!requireRole(auth, ["admin"], reply)) return;

    const parsed = createClientSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const input = parsed.data;
    const internalPort = input.internal_port ?? (await allocatePort());

    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresa")
      .insert({
        nome: input.nome,
        slug: input.slug,
        module_mode: input.module_mode,
        modulo_ativo: input.module_mode,
        timezone: input.timezone,
        ativo: input.ativo,
        active: input.ativo,
        telefone_principal: input.telefone_principal ?? null,
        responsavel: input.responsavel ?? null,
        email_responsavel: input.email_responsavel ?? null,
        observacoes: input.observacoes ?? null,
        provision_status: "provisionando",
      })
      .select("id, nome, slug, module_mode")
      .single();

    if (empresaError || !empresa) {
      return reply.status(400).send({ error: empresaError?.message ?? "Falha ao criar empresa" });
    }

    const token = input.auth_token ?? randomBytes(24).toString("hex");
    const defaults = ALLOWED_FUNCTIONS[input.module_mode];

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agent_instance")
      .insert({
        empresa_id: empresa.id,
        agent_name: input.agent_name,
        module_mode: input.module_mode,
        internal_url: input.internal_url,
        internal_port: internalPort,
        auth_token: token,
        prompt_profile: input.prompt_profile,
        allowed_functions: input.allowed_functions ?? defaults,
        deployment_mode: input.deployment_mode,
        deployment_status: "provisionando",
        is_active: true,
        health_status: "starting",
      })
      .select("*")
      .single();

    if (agentError || !agent) {
      return reply.status(400).send({ error: agentError?.message ?? "Falha ao criar instância" });
    }

    const provision = await executeProvision({ empresa_id: empresa.id, action: "create" });
    const nextStatus = provision.ok ? "ativo" : "erro";

    await supabaseAdmin.from("empresa").update({ provision_status: nextStatus }).eq("id", empresa.id);
    await supabaseAdmin.from("agent_instance").update({ deployment_status: nextStatus }).eq("empresa_id", empresa.id);

    await writeAudit({
      empresaId: empresa.id,
      actorType: "admin",
      actorId: auth.userId,
      actionName: "provision_client",
      actionPayload: { input: { ...input, internal_port: internalPort }, provision },
      resultStatus: provision.ok ? "success" : "error",
    });

    return reply.status(201).send({ empresa, agent, provision });
  });

  app.get("/api/admin/provision/list", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    if (!requireRole(auth, ["admin"], reply)) return;

    const { data, error } = await supabaseAdmin
      .from("agent_instance")
      .select("empresa_id, agent_name, module_mode, internal_port, status, health_status, deployment_status, is_active, last_response_at, created_at, empresa(nome, slug, provision_status)")
      .order("created_at", { ascending: false });

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ data });
  });

  app.get("/api/admin/provision/:empresaId/logs", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    if (!requireRole(auth, ["admin"], reply)) return;

    const empresaId = (request.params as { empresaId: string }).empresaId;

    const { data, error } = await supabaseAdmin
      .from("audit_log")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ data });
  });

  app.post("/api/admin/provision/:empresaId/:action", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    if (!requireRole(auth, ["admin"], reply)) return;

    const { empresaId, action } = request.params as { empresaId: string; action: string };

    const map: Record<string, "pause" | "resume" | "restart" | "rotate_token" | "test"> = {
      pause: "pause",
      resume: "resume",
      restart: "restart",
      rotate_token: "rotate_token",
      test: "test",
    };

    if (!map[action]) return reply.status(400).send({ error: "Ação inválida" });

    const result = await executeProvision({ empresa_id: empresaId, action: map[action] });

    await writeAudit({
      empresaId,
      actorType: "admin",
      actorId: auth.userId,
      actionName: `provision_${action}`,
      actionPayload: result,
      resultStatus: result.ok ? "success" : "error",
    });

    return reply.send({ result });
  });

  app.post("/internal/provision/client", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;
    const parsed = actionSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const result = await executeProvision({ empresa_id: parsed.data.empresa_id, action: "create" });
    return reply.send({ result });
  });

  app.post("/internal/provision", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;

    const parsed = internalProvisionSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const input = parsed.data;
    const internalPort = await allocatePort();
    const token = randomBytes(24).toString("hex");
    const slug = input.slug ?? input.nome.toLowerCase().trim().replace(/\s+/g, "-");
    const internalUrl = `http://127.0.0.1:${internalPort}`;

    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresa")
      .insert({
        nome: input.nome,
        slug,
        module_mode: input.module_mode,
        modulo_ativo: input.module_mode,
        ativo: true,
        active: true,
        timezone: "America/Sao_Paulo",
        telefone_principal: input.telefone ?? null,
        email_responsavel: input.email ?? null,
        provision_status: "provisionando",
      })
      .select("id, nome, slug, module_mode")
      .single();

    if (empresaError || !empresa) {
      return reply.status(400).send({ error: empresaError?.message ?? "Falha ao criar empresa" });
    }

    const defaults = ALLOWED_FUNCTIONS[input.module_mode];
    const { error: agentError } = await supabaseAdmin.from("agent_instance").insert({
      empresa_id: empresa.id,
      agent_name: `hermes-${slug}`,
      module_mode: input.module_mode,
      internal_url: internalUrl,
      internal_port: internalPort,
      auth_token: token,
      prompt_profile: input.module_mode,
      allowed_functions: defaults,
      deployment_mode: "local_vps",
      deployment_status: "provisionando",
      is_active: true,
      health_status: "starting",
    });

    if (agentError) {
      return reply.status(400).send({ error: agentError.message });
    }

    const vpsPayload = {
      empresa_id: empresa.id,
      port: internalPort,
      token,
      module_mode: input.module_mode,
    };

    const provision = await executeProvision({ empresa_id: empresa.id, action: "create" });

    await writeAudit({
      empresaId: empresa.id,
      actorType: "internal",
      actionName: "internal_provision",
      actionPayload: { request: input, vps_payload: vpsPayload, provision },
      resultStatus: provision.ok ? "success" : "error",
    });

    return reply.status(201).send({
      empresa_id: empresa.id,
      port: internalPort,
      token,
      module_mode: input.module_mode,
      vps_payload: vpsPayload,
      provision,
    });
  });

  app.post("/internal/provision/pause", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;
    const parsed = actionSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const result = await executeProvision({ empresa_id: parsed.data.empresa_id, action: "pause" });
    return reply.send({ result });
  });

  app.post("/internal/provision/resume", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;
    const parsed = actionSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const result = await executeProvision({ empresa_id: parsed.data.empresa_id, action: "resume" });
    return reply.send({ result });
  });

  app.post("/internal/provision/restart", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;
    const parsed = actionSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
    const result = await executeProvision({ empresa_id: parsed.data.empresa_id, action: "restart" });
    return reply.send({ result });
  });

  app.get("/internal/provision/health/:empresa_id", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;
    const empresaId = (request.params as { empresa_id: string }).empresa_id;

    const { data, error } = await supabaseAdmin
      .from("agent_instance")
      .select("empresa_id, health_status, deployment_status, is_active, updated_at")
      .eq("empresa_id", empresaId)
      .single();

    if (error) return reply.status(404).send({ error: error.message });
    return reply.send({ data });
  });

  app.get("/internal/provision/list", async (request, reply) => {
    if (!requireInternalToken(request, reply)) return;

    const { data, error } = await supabaseAdmin
      .from("agent_instance")
      .select("empresa_id, agent_name, module_mode, internal_url, internal_port, deployment_status, health_status, is_active")
      .order("created_at", { ascending: false });

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ data });
  });
}
