import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { webhookPayloadSchema } from "../lib/schemas.js";
import { isReplay } from "../lib/replay-store.js";
import { isTimestampValid, verifySignature } from "../lib/webhook-security.js";
import { supabaseAdmin } from "../lib/supabase.js";

export async function webhookRoutes(app: FastifyInstance) {
  app.post("/webhook/:clienteId", async (request, reply) => {
    const clienteId = (request.params as { clienteId: string }).clienteId;
    const signature = request.headers["x-fw-signature"] as string | undefined;
    const timestamp = request.headers["x-fw-timestamp"] as string | undefined;
    const eventId = (request.headers["x-fw-event-id"] as string | undefined) ?? randomUUID();

    if (!signature || !timestamp) {
      return reply.status(401).send({ error: "Assinatura ausente" });
    }

    if (!isTimestampValid(timestamp)) {
      return reply.status(401).send({ error: "Timestamp inválido/expirado" });
    }

    const body = webhookPayloadSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Payload inválido", details: body.error.flatten() });
    }

    if (!verifySignature(body.data, timestamp, signature)) {
      return reply.status(403).send({ error: "Assinatura inválida" });
    }

    if (isReplay(eventId)) {
      return reply.status(200).send({ ok: true, deduplicated: true });
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agent_instance")
      .select("empresa_id, auth_token, is_active")
      .eq("empresa_id", clienteId)
      .single();

    if (agentError || !agent || !agent.is_active) {
      return reply.status(404).send({ error: "Instância não encontrada ou inativa" });
    }

    if (body.data.instanceToken !== agent.auth_token) {
      await supabaseAdmin.from("log_acao").insert({
        empresa_id: clienteId,
        origem: "webhook",
        acao: "token_mismatch",
        severidade: "warning",
        payload: body.data,
      });

      return reply.status(403).send({ error: "Token incompatível com o cliente" });
    }

    await supabaseAdmin.from("mensagem_evento").insert({
      empresa_id: clienteId,
      provider_event_id: eventId,
      provider_message_id: body.data.messageId ?? null,
      payload: body.data,
      status: "recebido",
    });

    return reply.status(200).send({ ok: true });
  });
}
