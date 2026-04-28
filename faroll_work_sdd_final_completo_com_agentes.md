# FAROLLWORK — SYSTEM DESIGN DOCUMENT (SDD FINAL COMPLETO)

## Versão
2.0 (Executável + Agentes Detalhados)

---

# 1. ENTENDIMENTO

FarollWork é uma plataforma de gestão empresarial conversacional via WhatsApp com painel web, baseada em arquitetura **single-tenant replicável**.

Cada cliente possui:
- 1 VPS dedicada
- 1 banco PostgreSQL
- 1 instância WhatsApp
- isolamento completo

---

# 2. OBJETIVO

Criar um sistema:
- automatizado
- seguro
- auditável
- resiliente
- operável em escala via replicação

---

# 3. PRINCÍPIOS ARQUITETURAIS

- Monólito modular
- Persistência antes de processamento
- Automação com guardrails
- LLM restrito
- Evolução sem fork

---

# 4. ARQUITETURA GERAL

## Camadas

### WhatsApp Layer
Webhook, dedupe, outbound

### Hermes Layer
Motor conversacional

### Domain Layer
Regras de negócio

### Queue Layer
Processamento assíncrono

### Web Panel
Interface operacional

---

# 5. STACK

- Backend: NestJS + TypeScript
- Banco: PostgreSQL
- Fila: Redis + BullMQ
- Frontend: Next.js
- Infra: Docker Compose
- Storage: S3
- IA: Python (auxiliar)

---

# 6. ARQUITETURA CONVERSACIONAL

## Pipeline
1. webhook
2. persistência
3. dedupe
4. fila
5. sessão
6. intent
7. decisão
8. execução
9. resposta

## Confiança
- >0.85 executa
- 0.6–0.85 confirma
- <0.6 pergunta

---

# 7. MODELO DE DADOS (EXTENSÃO)

Tabelas adicionais:
- message_event
- conversation_session
- conversation_state
- action_log
- notification_event

---

# 8. AGENTES DE EXECUÇÃO (DETALHADOS)

## 8.1 Conversation Agent

### Responsabilidades
- Gerenciar sessão
- Resolver intents
- Controlar estado
- Aplicar política de confiança
- Decidir fluxo
- Gerenciar handoff

### Inputs
- message_event
- conversation_state

### Outputs
- decisão de fluxo
- comando para Action Executor

### Regras
- nunca executa mutação crítica
- nunca persiste dados de domínio

---

## 8.2 WhatsApp Integration Agent

### Responsabilidades
- Receber webhook
- Normalizar payload
- Deduplicar
- Enfileirar inbound
- Enviar outbound
- Retry + backoff

### Regras
- idempotência obrigatória
- nunca executa regra de negócio

---

## 8.3 Inventory Agent

### Responsabilidades
- CRUD estoque
- Movimentações
- Alertas
- Consistência transacional

### Regras
- não permitir inconsistência
- validar unidade

---

## 8.4 Product Agent

### Responsabilidades
- Cadastro de produtos
- Vinculação ao estoque

---

## 8.5 Transaction Agent

### Responsabilidades
- Pedidos
- Agendamentos
- Encomendas
- Lifecycle

---

## 8.6 Quote Agent

### Responsabilidades
- Disparo de orçamento
- Lotes
- Consolidação
- Respostas

---

## 8.7 Real Estate Agent

### Responsabilidades
- Imóveis
- Leads
- Visitas
- Vendas
- Corretores

---

## 8.8 Finance Agent

### Responsabilidades
- Receitas
- Despesas
- Parcelamento
- Relatórios

### Regras
- exige autorização
- auditável

---

## 8.9 Bulk Import Agent

### Responsabilidades
- Upload
- Parsing
- Preview
- Conflitos
- Importação

---

## 8.10 Auth Agent

### Responsabilidades
- Login
- Sessão
- RBAC

---

## 8.11 Web Panel Agent

### Responsabilidades
- UI
- UX
- Estados de tela

---

## 8.12 DevOps Agent

### Responsabilidades
- Deploy
- Backup
- Restore
- Monitoramento

---

## 8.13 QA Agent

### Responsabilidades
- Testes unitários
- Integração
- E2E
- Smoke tests

---

# 9. REGRAS DE NEGÓCIO

- idempotência
- dedupe webhook
- confirmação para ações críticas
- batch WhatsApp
- importação com preview

---

# 10. DEPLOY

Fluxo:
1. backup
2. deploy
3. migrate
4. health check
5. rollback se necessário

---

# 11. SPRINTS

S1 Fundação
S2 WhatsApp
S3 Hermes
S4 Estoque
S5 Transações
S6 Orçamentos
S6.5 Auditoria
S7 Financeiro
S8 Bulk
S9 Imobiliário
S10 Hardening

---

# 12. CRITÉRIOS DE ACEITAÇÃO

- ações críticas validadas
- mensagens persistidas
- logs auditáveis
- deploy seguro

---

# STATUS FINAL

Documento pronto para execução por agentes e times técnicos.

