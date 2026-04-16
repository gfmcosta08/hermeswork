# Brief de Produto (entrada do usuário)

## Objetivo
- Frontend (Vercel)
- Backend (Node/TypeScript)
- Banco (Supabase)
- Integração Hermes (VPS Hostinger)
- Multi-tenant por `empresa_id`
- Módulos: `comercio` e `imobiliaria`
- Onboarding sem código

## Arquitetura
Frontend (Vercel) -> Backend API -> Supabase -> Agent Router -> Hermes (VPS)

## Princípios
- isolamento por `empresa_id`
- 1 Hermes por cliente
- backend controla tudo
- Hermes nunca acessa banco
- Hermes nunca acessa internet
- Hermes nunca executa código
- onboarding sem codar

## Regras operacionais
- Backend valida e executa ações
- Hermes apenas decide resposta/intenção
