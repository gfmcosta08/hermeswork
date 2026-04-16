-- Gap fill para FAROLLWORK_DOCUMENTO_CODEX.md
-- Provisionamento, Agent Router, tabelas obrigatórias e contrato backend↔Hermes

alter table if exists empresa
  add column if not exists slug text,
  add column if not exists module_mode text,
  add column if not exists ativo boolean default true,
  add column if not exists telefone_principal text,
  add column if not exists responsavel text,
  add column if not exists email_responsavel text,
  add column if not exists observacoes text,
  add column if not exists provision_status text default 'rascunho';

update empresa set module_mode = coalesce(module_mode, modulo_ativo);
update empresa set ativo = coalesce(ativo, active);

alter table if exists empresa
  alter column module_mode set not null;

create unique index if not exists idx_empresa_slug_unique on empresa(slug);

alter table if exists usuario
  add column if not exists ativo boolean default true;

update usuario set ativo = coalesce(ativo, active);

alter table if exists agent_instance
  add column if not exists status text default 'ativo',
  add column if not exists prompt_profile text default 'global',
  add column if not exists allowed_functions jsonb default '[]'::jsonb,
  add column if not exists deployment_mode text default 'local',
  add column if not exists deployment_status text default 'rascunho',
  add column if not exists last_response_at timestamptz,
  add column if not exists last_error text,
  add column if not exists last_latency_ms int;

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresa(id) on delete cascade,
  actor_type text not null,
  actor_id text,
  action_name text not null,
  action_payload jsonb,
  result_status text not null,
  created_at timestamptz not null default now()
);

alter table if exists mensagem_evento
  add column if not exists contato_id uuid references contato(id),
  add column if not exists canal text default 'whatsapp',
  add column if not exists direction text default 'inbound',
  add column if not exists payload_raw jsonb,
  add column if not exists normalized_text text,
  add column if not exists media_url text,
  add column if not exists dedupe_key text;

alter table if exists sessao_conversa
  add column if not exists last_intent text,
  add column if not exists context_json jsonb default '{}'::jsonb;

create table if not exists categoria_financeira (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita','despesa')),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nome, tipo)
);

create table if not exists solicitacao_orcamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  titulo text not null,
  descricao text,
  status text not null default 'aberta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists resposta_orcamento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  solicitacao_id uuid not null references solicitacao_orcamento(id) on delete cascade,
  fornecedor_nome text,
  valor numeric(12,2),
  prazo text,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists imovel
  add column if not exists id_do_imovel text,
  add column if not exists data_de_cadastro timestamptz default now(),
  add column if not exists data_de_atualizacao timestamptz default now(),
  add column if not exists titulo_do_anuncio text,
  add column if not exists descricao_completa text,
  add column if not exists diferenciais_do_imovel text,
  add column if not exists outras_taxas numeric(12,2),
  add column if not exists aceita_financiamento boolean,
  add column if not exists aceita_permuta boolean,
  add column if not exists area_do_terreno_m2 numeric(10,2),
  add column if not exists numero_de_salas int,
  add column if not exists numero_de_andares int,
  add column if not exists andar_do_imovel int,
  add column if not exists mobiliado boolean,
  add column if not exists tipo_de_piso text,
  add column if not exists posicao_solar text,
  add column if not exists idade_do_imovel int,
  add column if not exists numero text,
  add column if not exists complemento text,
  add column if not exists email_do_proprietario text,
  add column if not exists nome_do_corretor text,
  add column if not exists telefone_do_corretor text,
  add column if not exists email_do_corretor text,
  add column if not exists infraestrutura jsonb default '[]'::jsonb,
  add column if not exists seguranca jsonb default '[]'::jsonb,
  add column if not exists chave_disponivel boolean,
  add column if not exists imovel_ocupado boolean,
  add column if not exists documentacao text,
  add column if not exists matricula_do_imovel text,
  add column if not exists situacao_da_documentacao text,
  add column if not exists possui_escritura boolean,
  add column if not exists possui_registro boolean,
  add column if not exists tipo_de_construcao text,
  add column if not exists padrao_de_acabamento text,
  add column if not exists proximidades jsonb default '[]'::jsonb,
  add column if not exists distancia_do_centro numeric(10,2),
  add column if not exists regiao_da_cidade text,
  add column if not exists observacoes_do_corretor text,
  add column if not exists descricao_interna_livre text,
  add column if not exists ativo boolean default true;

create table if not exists corretor (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_imobiliario (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  contato_id uuid references contato(id),
  corretor_id uuid references corretor(id),
  origem text,
  interesse_json jsonb default '{}'::jsonb,
  status text not null default 'novo',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists visita_imovel (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  imovel_id uuid not null references imovel(id) on delete cascade,
  lead_id uuid references lead_imobiliario(id),
  corretor_id uuid references corretor(id),
  data_hora timestamptz not null,
  status text not null default 'agendada',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_instance_empresa on agent_instance(empresa_id);
create index if not exists idx_audit_log_empresa on audit_log(empresa_id, created_at desc);
create index if not exists idx_corretor_empresa on corretor(empresa_id);
create index if not exists idx_lead_imobiliario_empresa on lead_imobiliario(empresa_id);
create index if not exists idx_visita_imovel_empresa on visita_imovel(empresa_id, data_hora);

alter table audit_log enable row level security;
alter table categoria_financeira enable row level security;
alter table solicitacao_orcamento enable row level security;
alter table resposta_orcamento enable row level security;
alter table corretor enable row level security;
alter table lead_imobiliario enable row level security;
alter table visita_imovel enable row level security;

create policy if not exists "audit_isolado_empresa" on audit_log
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "corretor_isolado_empresa" on corretor
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "lead_imobiliario_isolado_empresa" on lead_imobiliario
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "visita_imovel_isolado_empresa" on visita_imovel
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "categoria_financeira_isolado_empresa" on categoria_financeira
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "solicitacao_orcamento_isolado_empresa" on solicitacao_orcamento
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "resposta_orcamento_isolado_empresa" on resposta_orcamento
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');
