import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "../lib/require-auth.js";
import { supabaseAdmin } from "../lib/supabase.js";

const moveSchema = z.object({
  estoque_id: z.string().uuid(),
  tipo: z.enum(["entrada", "saida", "ajuste"]),
  quantidade: z.number().positive(),
  motivo: z.string().optional(),
  observacao: z.string().optional(),
});

export async function businessRoutes(app: FastifyInstance) {
  app.get("/api/dashboard/summary", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const [contatos, produtos, transacoes, financeiro, imoveis, leads] = await Promise.all([
      supabaseAdmin.from("contato").select("id", { count: "exact", head: true }).eq("empresa_id", auth.empresaId),
      supabaseAdmin.from("produto").select("id", { count: "exact", head: true }).eq("empresa_id", auth.empresaId),
      supabaseAdmin.from("transacao").select("id", { count: "exact", head: true }).eq("empresa_id", auth.empresaId),
      supabaseAdmin.from("financeiro").select("tipo, valor").eq("empresa_id", auth.empresaId),
      supabaseAdmin.from("imovel").select("id", { count: "exact", head: true }).eq("empresa_id", auth.empresaId),
      supabaseAdmin.from("lead_imovel").select("id", { count: "exact", head: true }).eq("empresa_id", auth.empresaId),
    ]);

    const receitas = (financeiro.data ?? []).filter((f) => f.tipo === "receita").reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const despesas = (financeiro.data ?? []).filter((f) => f.tipo === "despesa").reduce((acc, item) => acc + Number(item.valor || 0), 0);

    return reply.send({
      contatos: contatos.count ?? 0,
      produtos: produtos.count ?? 0,
      transacoes: transacoes.count ?? 0,
      imoveis: imoveis.count ?? 0,
      leads: leads.count ?? 0,
      financeiro: {
        receitas,
        despesas,
        saldo: receitas - despesas,
      },
    });
  });

  app.post("/api/estoque/movimentar", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const parsed = moveSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const move = parsed.data;

    const { data: item, error: itemError } = await supabaseAdmin
      .from("estoque")
      .select("id, quantidade")
      .eq("id", move.estoque_id)
      .eq("empresa_id", auth.empresaId)
      .single();

    if (itemError || !item) return reply.status(404).send({ error: "Item de estoque não encontrado" });

    const atual = Number(item.quantidade || 0);
    const delta = move.tipo === "entrada" ? move.quantidade : move.tipo === "saida" ? -move.quantidade : move.quantidade;
    const novaQuantidade = atual + delta;

    if (novaQuantidade < 0) return reply.status(400).send({ error: "Estoque não pode ficar negativo" });

    const { error: moveError } = await supabaseAdmin.from("movimentacao_estoque").insert({
      empresa_id: auth.empresaId,
      estoque_id: move.estoque_id,
      tipo: move.tipo,
      quantidade: move.quantidade,
      motivo: move.motivo ?? null,
      observacao: move.observacao ?? null,
    });
    if (moveError) return reply.status(400).send({ error: moveError.message });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("estoque")
      .update({ quantidade: novaQuantidade, updated_at: new Date().toISOString() })
      .eq("id", move.estoque_id)
      .eq("empresa_id", auth.empresaId)
      .select("*")
      .single();

    if (updateError) return reply.status(400).send({ error: updateError.message });

    return reply.send({ data: updated });
  });

  app.post("/api/transacoes/:id/confirmar", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    const id = (request.params as { id: string }).id;

    const { data, error } = await supabaseAdmin
      .from("transacao")
      .update({ status: "confirmado", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("empresa_id", auth.empresaId)
      .select("*")
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ data });
  });

  app.post("/api/transacoes/:id/cancelar", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    const id = (request.params as { id: string }).id;

    const { data, error } = await supabaseAdmin
      .from("transacao")
      .update({ status: "cancelado", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("empresa_id", auth.empresaId)
      .select("*")
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ data });
  });

  app.get("/api/financeiro/relatorio", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;

    const from = (request.query as { from?: string }).from;
    const to = (request.query as { to?: string }).to;

    let query = supabaseAdmin.from("financeiro").select("*").eq("empresa_id", auth.empresaId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return reply.status(400).send({ error: error.message });

    const receitas = (data ?? []).filter((i) => i.tipo === "receita").reduce((acc, i) => acc + Number(i.valor), 0);
    const despesas = (data ?? []).filter((i) => i.tipo === "despesa").reduce((acc, i) => acc + Number(i.valor), 0);

    return reply.send({
      data,
      resumo: {
        receitas,
        despesas,
        saldo: receitas - despesas,
      },
    });
  });

  app.get("/api/imoveis/recomendados/:imovelId", async (request, reply) => {
    const auth = requireAuth(request, reply);
    if (!auth) return;
    const imovelId = (request.params as { imovelId: string }).imovelId;

    const { data: base, error: baseError } = await supabaseAdmin
      .from("imovel")
      .select("id, finalidade, cidade, bairro, numero_de_quartos, valor_de_aluguel, preco_de_venda")
      .eq("id", imovelId)
      .eq("empresa_id", auth.empresaId)
      .single();

    if (baseError || !base) return reply.status(404).send({ error: "Imóvel base não encontrado" });

    const { data: pool, error: poolError } = await supabaseAdmin
      .from("imovel")
      .select("*")
      .eq("empresa_id", auth.empresaId)
      .neq("id", imovelId)
      .eq("status_do_imovel", "disponivel")
      .limit(100);

    if (poolError) return reply.status(400).send({ error: poolError.message });

    const priceKey = base.finalidade === "aluguel" ? "valor_de_aluguel" : "preco_de_venda";
    const basePrice = Number((base as Record<string, unknown>)[priceKey] ?? 0);

    const scored = (pool ?? []).map((item) => {
      let score = 0;
      if (item.finalidade === base.finalidade) score += 30;
      if (item.cidade === base.cidade) score += 20;
      if (item.bairro === base.bairro) score += 15;
      if (item.numero_de_quartos === base.numero_de_quartos) score += 20;

      const itemPrice = Number((item as Record<string, unknown>)[priceKey] ?? 0);
      if (basePrice > 0 && itemPrice > 0) {
        const diff = Math.abs(itemPrice - basePrice) / basePrice;
        if (diff <= 0.1) score += 15;
        else if (diff <= 0.2) score += 8;
      }

      return { ...item, score };
    });

    const recomendados = scored.sort((a, b) => b.score - a.score).slice(0, 6);

    return reply.send({ data: recomendados });
  });
}
