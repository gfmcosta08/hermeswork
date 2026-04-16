-- FAROLLWORK SDD v5 - migração inicial MVP
create extension if not exists pgcrypto;

create table if not exists empresa (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  modulo_ativo text not null check (modulo_ativo in ('comercio','imobiliaria')),
  timezone text not null default 'America/Sao_Paulo',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usuario (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  auth_user_id uuid,
  nome text,
  email text not null,
  role text not null default 'gestor' check (role in ('admin','gestor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, email)
);

create table if not exists contato (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  whatsapp_numero text not null,
  tipo text not null,
  nome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, whatsapp_numero)
);

create table if not exists agent_instance (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references empresa(id) on delete cascade,
  agent_name text not null,
  module_mode text not null check (module_mode in ('comercio','imobiliaria')),
  internal_url text not null,
  internal_port int not null,
  auth_token text not null,
  health_status text not null default 'unknown',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mensagem_evento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  provider_event_id text,
  provider_message_id text,
  payload jsonb not null,
  status text not null default 'recebido',
  created_at timestamptz not null default now(),
  unique (empresa_id, provider_event_id)
);

create table if not exists log_acao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresa(id) on delete cascade,
  origem text not null,
  acao text not null,
  severidade text not null default 'info',
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists produto (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  nome text not null,
  tipo text not null,
  categoria text,
  preco numeric(12,2) not null default 0,
  custo numeric(12,2),
  unidade text,
  descricao text,
  ativo boolean not null default true,
  property_status text,
  property_purpose text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  nome text not null,
  quantidade numeric(12,3) not null default 0,
  unidade text,
  minimo numeric(12,3) not null default 0,
  local text,
  custo_compra numeric(12,2),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists movimentacao_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  estoque_id uuid not null references estoque(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida','ajuste')),
  quantidade numeric(12,3) not null check (quantidade > 0),
  motivo text,
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists transacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  cliente_id uuid references contato(id),
  tipo text not null,
  status text not null default 'pendente',
  data_criacao timestamptz not null default now(),
  data_agendada timestamptz,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists item_transacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  transacao_id uuid not null references transacao(id) on delete cascade,
  produto_id uuid not null references produto(id),
  quantidade numeric(12,3) not null default 1,
  preco_unitario numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists financeiro (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  tipo text not null check (tipo in ('receita','despesa')),
  valor numeric(12,2) not null,
  categoria text,
  forma_pagamento text,
  confirmado boolean not null default false,
  vencimento date,
  pago_em date,
  created_at timestamptz not null default now()
);

create index if not exists idx_contato_empresa on contato (empresa_id);
create index if not exists idx_produto_empresa on produto (empresa_id);
create index if not exists idx_estoque_empresa on estoque (empresa_id);
create index if not exists idx_transacao_empresa on transacao (empresa_id);
create index if not exists idx_financeiro_empresa on financeiro (empresa_id);
create index if not exists idx_mensagem_empresa on mensagem_evento (empresa_id);

alter table empresa enable row level security;
alter table usuario enable row level security;
alter table contato enable row level security;
alter table agent_instance enable row level security;
alter table mensagem_evento enable row level security;
alter table log_acao enable row level security;
alter table produto enable row level security;
alter table estoque enable row level security;
alter table movimentacao_estoque enable row level security;
alter table transacao enable row level security;
alter table item_transacao enable row level security;
alter table financeiro enable row level security;

-- política base: serviço usa service role, cliente usa claim empresa_id no JWT
create policy if not exists "contato_isolado_empresa" on contato
for all
using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "produto_isolado_empresa" on produto
for all
using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "estoque_isolado_empresa" on estoque
for all
using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "transacao_isolado_empresa" on transacao
for all
using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "financeiro_isolado_empresa" on financeiro
for all
using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');
