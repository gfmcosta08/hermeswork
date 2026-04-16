import { performance } from "perf_hooks";
import { env } from "./env.js";
import { supabaseAdmin } from "./supabase.js";

export type AgentRunInput = {
  empresa_id: string;
  module_mode: "comercio" | "imobiliaria";
  message: string;
  context: {
    contact_id?: string;
    session_id?: string;
    role?: string;
  };
};

export async function runAgentRouter(input: AgentRunInput) {
  const { data: agent, error } = await supabaseAdmin
    .from("agent_instance")
    .select("empresa_id, module_mode, internal_url, internal_port, auth_token, health_status, is_active, allowed_functions")
    .eq("empresa_id", input.empresa_id)
    .single();

  if (error || !agent) {
    throw new Error("Instância Hermes não encontrada");
  }
  if (!agent.is_active) {
    throw new Error("Instância Hermes inativa");
  }

  const endpoint = `${agent.internal_url.replace(/\/$/, "")}/agent/run`;
  const started = performance.now();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-router-secret": env.AGENT_ROUTER_SECRET,
      Authorization: `Bearer ${agent.auth_token}`,
    },
    body: JSON.stringify(input),
  });

  const latency = Math.round(performance.now() - started);

  const raw = await res.text();
  const parsed = raw ? JSON.parse(raw) : {};

  await supabaseAdmin
    .from("agent_instance")
    .update({
      last_latency_ms: latency,
      last_response_at: new Date().toISOString(),
      health_status: res.ok ? "healthy" : "degraded",
      last_error: res.ok ? null : `HTTP ${res.status}`,
    })
    .eq("empresa_id", input.empresa_id);

  if (!res.ok) {
    throw new Error(`Falha ao chamar Hermes (${res.status})`);
  }

  return { response: parsed, latency, allowed_functions: agent.allowed_functions ?? [] };
}
