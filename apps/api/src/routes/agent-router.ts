import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/require-auth.js";
import { runAgentRouter } from "../lib/agent-router.js";
import { supabaseAdmin } from "../lib/supabase.js";

const runSchema = z.object({
  empresa_id: z.string().uuid(),
  module_mode: z.enum(["comercio", "imobiliaria"]),
  message: z.string().min(1),
  context: z
    .object({
      contact_id: z.string().optional(),
      session_id: z.string().optional(),
      role: z.string().optional(),
    })
    .default({}),
});

const callSchema = z.object({
  empresa_id: z.string().uuid(),
  message: z.string().min(1),
  context: z
    .object({
      contact_id: z.string().optional(),
      session_id: z.string().optional(),
      role: z.string().optional(),
    })
    .default({}),
});

export async function agentRouterRoutes(app: FastifyInstance) {
  app.post("/api/agent/call", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const parsed = callSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const input = parsed.data;
    if (auth.role !== "admin" && input.empresa_id !== auth.empresaId) {
      return reply.status(403).send({ error: "empresa_id inválido para o usuário" });
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agent_instance")
      .select("module_mode")
      .eq("empresa_id", input.empresa_id)
      .single();

    if (agentError || !agent) return reply.status(404).send({ error: "Instância não encontrada" });

    const response = await runAgentRouter({
      empresa_id: input.empresa_id,
      module_mode: agent.module_mode,
      message: input.message,
      context: input.context,
    });

    return reply.send(response.response);
  });

  app.post("/api/agent/router/run", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const parsed = runSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const input = parsed.data;

    if (auth.role !== "admin" && input.empresa_id !== auth.empresaId) {
      return reply.status(403).send({ error: "empresa_id inválido para o usuário" });
    }

    try {
      const result = await runAgentRouter(input);
      const action = (result.response as { requested_action?: { name?: string; params?: unknown } }).requested_action;

      if (action?.name) {
        const allowed = Array.isArray(result.allowed_functions) ? result.allowed_functions : [];
        if (!allowed.includes(action.name)) {
          return reply.status(400).send({
            error: "Função solicitada pelo Hermes não autorizada",
            requested_action: action,
            allowed_functions: allowed,
          });
        }
      }

      await supabaseAdmin.from("audit_log").insert({
        empresa_id: input.empresa_id,
        actor_type: "backend",
        actor_id: auth.userId,
        action_name: "agent_router_run",
        action_payload: { input, response: result.response, latency_ms: result.latency },
        result_status: "success",
      });

      return reply.send(result.response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no Agent Router";

      await supabaseAdmin.from("audit_log").insert({
        empresa_id: input.empresa_id,
        actor_type: "backend",
        actor_id: auth.userId,
        action_name: "agent_router_run",
        action_payload: { input, error: message },
        result_status: "error",
      });

      return reply.status(502).send({ error: message });
    }
  });
}
