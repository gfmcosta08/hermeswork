# FarollWork SaaS (Completo - Base Operacional)

SaaS multiempresa com:
- API interna (Fastify + TypeScript)
- Painel web (Next.js + Tailwind)
- Banco Supabase (migrations SQL)
- Segurança de webhook (HMAC + anti-replay + idempotência)
- Isolamento por `empresa_id`

## Estrutura

- `apps/api`: autenticação, webhook, CRUD e regras de negócio
- `apps/web`: painel com login e módulos operacionais
- `supabase/migrations`: schema inicial e expansão

## Funcionalidades já implementadas

### Backend
- `POST /auth/bootstrap` cria usuário inicial (admin/gestor)
- `POST /auth/login` autenticação JWT
- `GET /auth/me` usuário autenticado
- `POST /webhook/:clienteId` com validação de assinatura/token
- CRUD completo: `GET/POST/PUT/DELETE /api/:resource`
- Resumo: `GET /api/dashboard/summary`
- Estoque: `POST /api/estoque/movimentar`
- Transações: `POST /api/transacoes/:id/confirmar` e `/cancelar`
- Financeiro: `GET /api/financeiro/relatorio`
- Imóveis recomendados: `GET /api/imoveis/recomendados/:imovelId`

### Frontend
- Login com JWT
- Área protegida `/app`
- Módulos:
  - Dashboard
  - Contatos
  - Produtos
  - Estoque
  - Transações
  - Financeiro
  - Imóveis

## Setup

1. Copie `.env.example` para `.env` e preencha.
2. Instale dependências:

```bash
npm install
```

3. Rode API:

```bash
npm run dev:api
```

4. Rode Web:

```bash
npm run dev:web
```

## Bootstrap inicial (primeiro usuário)

Com API rodando:

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

Depois faça login em `/login`.

## Migrations

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_expand_saas.sql`

Aplique no projeto Supabase antes de usar o sistema.
