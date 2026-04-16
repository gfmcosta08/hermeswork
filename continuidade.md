# Continuidade do Projeto FarollWork SaaS

Este arquivo centraliza tudo que é necessário para o sistema funcionar de ponta a ponta sem bloqueio.

## 1) Documentos oficiais já salvos no repositório local

### SDDs e documentos-base
- `docs/sdd/FAROLLWORK_SDD_v5_PESADO.md`
- `docs/sdd/FAROLLWORK_DOCUMENTO_CODEX.md`
- `docs/sdd/FAROLLWORK_DOCUMENTO_HERMES_VPS_COMPLETO.md`

### Prompts consolidados
- `docs/prompts/prompt_global.txt`
- `docs/prompts/prompt_comercio.txt`
- `docs/prompts/prompt_imobiliaria.txt`
- `docs/prompts/README.md`

### Contexto estratégico
- `docs/contexto/brief_objetivo_usuario_2026-04-16.md`

## 2) Variáveis obrigatórias (`.env` na raiz)

Copiar `.env.example` para `.env` e preencher:

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
INTERNAL_PROVISION_TOKEN=
PROVISIONER_MODE=local_vps
PROVISIONER_ALLOWED_ORIGINS=
HOSTINGER_API_URL=
HOSTINGER_API_TOKEN=
WHATSAPP_PROVIDER_URL=
WHATSAPP_PROVIDER_TOKEN=
API_PORT=3333

# opcional
REDIS_URL=
```

## 3) Banco Supabase (obrigatório)

Aplicar na ordem:
1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_expand_saas.sql`
3. `supabase/migrations/0003_codex_document_gap.sql`

Após migrar, validar existência de tabelas críticas:
- Core: `empresa`, `usuario`, `agent_instance`, `audit_log`, `mensagem_evento`, `sessao_conversa`
- Comércio: `produto`, `estoque`, `movimentacao_estoque`, `transacao`, `item_transacao`, `financeiro`, `categoria_financeira`, `solicitacao_orcamento`, `resposta_orcamento`
- Imobiliária: `imovel`, `corretor`, `lead_imobiliario`, `visita_imovel`

## 4) Fluxo de bootstrap inicial

### 4.1 Criar usuário admin inicial
Com a API rodando:

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

### 4.2 Login no painel
- Acessar `/login`
- Entrar com usuário admin

## 5) Provisionamento sem código (Admin)

Tela: `/app/administracao/provisionamento`

Ações disponíveis:
- Criar cliente + provisionar
- Pausar instância
- Reativar instância
- Reiniciar instância
- Rotacionar token
- Testar instância

### Endpoints administrativos
- `POST /api/admin/provision/client`
- `GET /api/admin/provision/list`
- `GET /api/admin/provision/:empresaId/logs`
- `POST /api/admin/provision/:empresaId/:action`

### Endpoint interno principal (pedido no escopo)
- `POST /internal/provision`

Payload esperado:
```json
{
  "nome": "Empresa X",
  "module_mode": "comercio",
  "telefone": "11999999999",
  "email": "contato@empresa.com"
}
```

Resposta inclui payload VPS padrão:
```json
{
  "empresa_id": "...",
  "port": 3101,
  "token": "...",
  "module_mode": "comercio"
}
```

## 6) Contrato Backend ↔ Hermes

Endpoint do Hermes:
- `POST /agent/run`

Request:
```json
{
  "empresa_id": "uuid",
  "module_mode": "comercio",
  "message": "texto",
  "context": {
    "contact_id": "id",
    "session_id": "id",
    "role": "cliente"
  }
}
```

Response:
```json
{
  "response_text": "resposta",
  "intent": "buscar_produto",
  "requested_action": {
    "name": "buscar_produto",
    "params": {}
  }
}
```

No backend:
- `POST /api/agent/call` (forma simplificada)
- `POST /api/agent/router/run` (forma completa)

## 7) Integração Hostinger (VPS)

### Modo local (default)
- `PROVISIONER_MODE=local_vps`
- Backend atualiza status internamente

### Modo Hostinger API
- `PROVISIONER_MODE=hostinger_api`
- Preencher `HOSTINGER_API_URL` e `HOSTINGER_API_TOKEN`
- O backend chama API externa com:
  - `empresa_id`
  - `port`
  - `token`
  - `module_mode`

## 8) Subida local da aplicação

```bash
npm install
npm run dev:api
npm run dev:web
```

Web: `http://localhost:3000`
API: `http://localhost:3333`

## 9) Smoke test obrigatório

1. Login admin
2. Criar cliente pelo provisionamento
3. Confirmar criação de `empresa` + `agent_instance`
4. Rodar ação `test` da instância
5. Cadastrar contato/produto/estoque
6. Criar transação e confirmar/cancelar
7. Lançar financeiro e validar relatório
8. Cadastrar imóvel/corretor/lead/visita
9. Chamar `POST /api/agent/call`
10. Verificar logs em `/app/administracao/logs`

## 10) Segurança mínima para produção

- Secrets fortes (>= 32 chars):
  - `JWT_SECRET`
  - `WEBHOOK_HMAC_SECRET`
  - `AGENT_ROUTER_SECRET`
  - `INTERNAL_PROVISION_TOKEN`
- HTTPS obrigatório
- Rotação de token de instância periódica
- Bloqueio de origem nos endpoints internos
- Auditoria obrigatória de ações críticas

## 11) Itens de melhoria recomendados

1. Atualizar Next para patch sem CVE (há aviso no build)
2. CI/CD com pipeline de build/test/deploy
3. Testes E2E automatizados dos fluxos críticos
4. Métricas + alertas de latência/erro por instância Hermes
5. Implementar execução real do provisionamento Hostinger com tratamento de falha/rollback
6. Hardening de permissões por role no frontend e backend

## 12) Checklist de conclusão (hoje)

- [ ] `.env` preenchido
- [ ] Migrations aplicadas
- [ ] Admin bootstrap criado
- [ ] Provisionamento validado
- [ ] Fluxo Agent Router validado
- [ ] Módulos comércio/imobiliária operacionais
- [ ] Logs e auditoria conferidos

---

Status atual: base pronta para configuração final e teste integrado.
