import type { FastifyReply, FastifyRequest } from "fastify";
import { readBearerToken, verifyToken, type AuthRole, type AuthUser } from "./auth.js";

export function requireAuth(request: FastifyRequest, reply: FastifyReply): AuthUser | null {
  const authHeader = request.headers.authorization;
  const token = readBearerToken(authHeader);
  if (!token) {
    reply.status(401).send({ error: "Token ausente" });
    return null;
  }

  const user = verifyToken(token);
  if (!user) {
    reply.status(401).send({ error: "Token inválido" });
    return null;
  }

  return user;
}

export function requireRole(user: AuthUser, roles: AuthRole[], reply: FastifyReply): boolean {
  if (!roles.includes(user.role)) {
    reply.status(403).send({ error: "Acesso negado" });
    return false;
  }
  return true;
}
