import jwt from "jsonwebtoken";
import { env } from "./env.js";

export type AuthRole = "admin" | "gestor";

export type AuthUser = {
  userId: string;
  empresaId: string;
  role: AuthRole;
  email: string;
};

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || typeof decoded !== "object") return null;
    const parsed = decoded as Partial<AuthUser>;
    if (!parsed.userId || !parsed.empresaId || !parsed.role || !parsed.email) return null;
    return {
      userId: parsed.userId,
      empresaId: parsed.empresaId,
      role: parsed.role,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export function readBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
