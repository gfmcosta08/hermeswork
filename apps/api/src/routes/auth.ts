import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { comparePassword, hashPassword } from "../lib/password.js";
import { signToken } from "../lib/auth.js";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../lib/require-auth.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const bootstrapSchema = z.object({
  empresa_id: z.string().uuid(),
  nome: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "gestor"]).default("admin"),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/bootstrap", async (request, reply) => {
    const parsed = bootstrapSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const input = parsed.data;
    const password_hash = await hashPassword(input.password);

    const { data, error } = await supabaseAdmin
      .from("usuario")
      .insert({
        empresa_id: input.empresa_id,
        nome: input.nome,
        email: input.email,
        role: input.role,
        password_hash,
      })
      .select("id, empresa_id, email, role, nome")
      .single();

    if (error) return reply.status(400).send({ error: error.message });

    return reply.status(201).send({ data });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const { email, password } = parsed.data;

    const { data: user, error } = await supabaseAdmin
      .from("usuario")
      .select("id, empresa_id, email, role, nome, active, password_hash")
      .eq("email", email)
      .single();

    if (error || !user || !user.active || !user.password_hash) {
      return reply.status(401).send({ error: "Credenciais inválidas" });
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) {
      return reply.status(401).send({ error: "Credenciais inválidas" });
    }

    await supabaseAdmin.from("usuario").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

    const token = signToken({
      userId: user.id,
      empresaId: user.empresa_id,
      role: user.role,
      email: user.email,
    });

    return reply.send({
      token,
      user: {
        id: user.id,
        empresa_id: user.empresa_id,
        role: user.role,
        email: user.email,
        nome: user.nome,
      },
    });
  });

  app.get("/auth/me", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const { data, error } = await supabaseAdmin
      .from("usuario")
      .select("id, empresa_id, email, role, nome, active, last_login_at")
      .eq("id", auth.userId)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Usuário não encontrado" });

    return reply.send({ user: data });
  });
}
