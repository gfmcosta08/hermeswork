import { randomBytes } from "crypto";
import { env } from "./env.js";
import { supabaseAdmin } from "./supabase.js";

export type ProvisionPayload = {
  empresa_id: string;
  action: "create" | "pause" | "resume" | "restart" | "rotate_token" | "test";
};

export async function writeAudit(args: {
  empresaId?: string;
  actorType: string;
  actorId?: string;
  actionName: string;
  actionPayload?: unknown;
  resultStatus: string;
}) {
  await supabaseAdmin.from("audit_log").insert({
    empresa_id: args.empresaId ?? null,
    actor_type: args.actorType,
    actor_id: args.actorId ?? null,
    action_name: args.actionName,
    action_payload: args.actionPayload ?? null,
    result_status: args.resultStatus,
  });
}

export async function executeProvision(payload: ProvisionPayload) {
  const now = new Date().toISOString();

  switch (payload.action) {
    case "create": {
      const { data: instance } = await supabaseAdmin
        .from("agent_instance")
        .select("empresa_id, module_mode, internal_port, auth_token")
        .eq("empresa_id", payload.empresa_id)
        .single();

      const vpsPayload =
        instance == null
          ? null
          : {
              empresa_id: instance.empresa_id,
              port: instance.internal_port,
              token: instance.auth_token,
              module_mode: instance.module_mode,
            };

      let externalResult: { ok: boolean; status?: number; body?: unknown; error?: string } | null = null;
      if (env.PROVISIONER_MODE === "hostinger_api" && env.HOSTINGER_API_URL && env.HOSTINGER_API_TOKEN && vpsPayload) {
        try {
          const res = await fetch(env.HOSTINGER_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.HOSTINGER_API_TOKEN}`,
            },
            body: JSON.stringify(vpsPayload),
          });
          const text = await res.text();
          externalResult = {
            ok: res.ok,
            status: res.status,
            body: text ? JSON.parse(text) : null,
          };
        } catch (err) {
          externalResult = {
            ok: false,
            error: err instanceof Error ? err.message : "Falha ao chamar provisioner externo",
          };
        }
      }

      const { error } = await supabaseAdmin
        .from("agent_instance")
        .update({ status: "ativo", deployment_status: "ativo", health_status: "healthy", updated_at: now })
        .eq("empresa_id", payload.empresa_id);
      return {
        ok: !error && (externalResult ? externalResult.ok : true),
        mode: env.PROVISIONER_MODE,
        error: error?.message ?? externalResult?.error ?? null,
        vps_payload: vpsPayload,
        external_result: externalResult,
      };
    }
    case "pause": {
      const { error } = await supabaseAdmin
        .from("agent_instance")
        .update({ is_active: false, status: "pausado", deployment_status: "pausado", updated_at: now })
        .eq("empresa_id", payload.empresa_id);
      return { ok: !error, error: error?.message ?? null };
    }
    case "resume": {
      const { error } = await supabaseAdmin
        .from("agent_instance")
        .update({ is_active: true, status: "ativo", deployment_status: "ativo", updated_at: now })
        .eq("empresa_id", payload.empresa_id);
      return { ok: !error, error: error?.message ?? null };
    }
    case "restart": {
      const { error } = await supabaseAdmin
        .from("agent_instance")
        .update({ status: "reiniciando", health_status: "restarting", updated_at: now })
        .eq("empresa_id", payload.empresa_id);
      return { ok: !error, error: error?.message ?? null };
    }
    case "rotate_token": {
      const token = randomBytes(24).toString("hex");
      const { error } = await supabaseAdmin
        .from("agent_instance")
        .update({ auth_token: token, updated_at: now })
        .eq("empresa_id", payload.empresa_id);
      return { ok: !error, auth_token: token, error: error?.message ?? null };
    }
    case "test": {
      const { data, error } = await supabaseAdmin
        .from("agent_instance")
        .select("empresa_id, internal_url, internal_port, health_status, is_active, deployment_status")
        .eq("empresa_id", payload.empresa_id)
        .single();
      return { ok: !error, instance: data ?? null, error: error?.message ?? null };
    }
  }
}
