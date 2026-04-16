import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "./env.js";

export function requireInternalToken(request: FastifyRequest, reply: FastifyReply): boolean {
  const token = request.headers["x-internal-token"] as string | undefined;
  if (!token || token !== env.INTERNAL_PROVISION_TOKEN) {
    reply.status(401).send({ error: "Token interno inválido" });
    return false;
  }

  if (!env.PROVISIONER_ALLOWED_ORIGINS.trim()) {
    return true;
  }

  const origin = (request.headers.origin as string | undefined) ?? "";
  const allowed = env.PROVISIONER_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);

  if (origin && !allowed.includes(origin)) {
    reply.status(403).send({ error: "Origem não permitida" });
    return false;
  }

  return true;
}
