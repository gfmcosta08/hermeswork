# Continuidade do SaaS (passos finais para teste)

Este arquivo resume o que falta para conseguirmos testar o SaaS de ponta a ponta.

## 1) Variáveis obrigatórias (`.env`)

Criar `.env` na raiz com:

```env
# Frontend
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3333

# API interna
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AGENT_ROUTER_SECRET=
WEBHOOK_HMAC_SECRET=
JWT_SECRET=
WHATSAPP_PROVIDER_URL=
WHATSAPP_PROVIDER_TOKEN=
API_PORT=3333

# opcional
REDIS_URL=
```

## 2) Banco (Supabase)

Aplicar as migrações SQL na ordem:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_expand_saas.sql`

Depois confirmar que existem as tabelas principais:
- `empresa`, `usuario`, `contato`, `agent_instance`
- `produto`, `estoque`, `movimentacao_estoque`, `transacao`, `financeiro`
- `imovel`, `lead_imovel`, `notificacao_evento`

## 3) Bootstrap inicial (primeiro usuário)

Com API rodando, criar o primeiro usuário:

```bash
curl -X POST http://localhost:3333/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id":"UUID_DA_EMPRESA",
    "nome":"Admin",
    "email":"admin@empresa.com",
    "password":"SenhaForte123",
    "role":"admin"
  }'
```

## 4) Subir o sistema local

```bash
npm install
npm run dev:api
npm run dev:web
```

Frontend: `http://localhost:3000`  
API: `http://localhost:3333`

## 5) Roteiro de teste rápido (smoke test)

1. Login no `/login`
2. Criar contato
3. Criar produto
4. Criar item de estoque
5. Criar transação e confirmar/cancelar
6. Lançar receita/despesa no financeiro
7. Cadastrar imóvel
8. Ver dashboard e relatório financeiro
9. Testar webhook assinado (`/webhook/:clienteId`)

## 6) Segurança mínima para produção

- Segredos fortes (mínimo 32+ chars) para `JWT_SECRET`, `WEBHOOK_HMAC_SECRET`, `AGENT_ROUTER_SECRET`
- Rotação periódica dos segredos
- HTTPS obrigatório em API/webhook
- Bloqueio de origem + logs de auditoria no webhook

## 7) Melhorias recomendadas (próxima sprint)

1. Trocar `Next 15.2.0` por versão corrigida (há aviso de CVE)
2. CI/CD com testes e build automático
3. Testes E2E dos módulos críticos
4. Controle de permissões por papel (admin/gestor) mais granular
5. Observabilidade completa (métricas, tracing e alertas)
6. Deploy por ambiente (dev/staging/prod) com rollback automatizado

## 8) Definições que vamos preencher juntos

Quando você estiver pronto, preenchermos juntos:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `WEBHOOK_HMAC_SECRET`
- `AGENT_ROUTER_SECRET`
- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`

---

Status: pronto para configuração final e testes integrados.
