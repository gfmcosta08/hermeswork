-- Expansão SaaS completa (auth + imobiliaria + notificações)

alter table if exists usuario
  add column if not exists password_hash text,
  add column if not exists last_login_at timestamptz;

create table if not exists notificacao_evento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text,
  lida boolean not null default false,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sessao_conversa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  contato_id uuid references contato(id),
  canal text not null default 'whatsapp',
  status text not null default 'ativa',
  ultimo_evento_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists estado_conversa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  sessao_id uuid not null references sessao_conversa(id) on delete cascade,
  contexto jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (empresa_id, sessao_id)
);

create table if not exists arquivo_midia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  mensagem_evento_id uuid references mensagem_evento(id) on delete cascade,
  tipo text not null,
  url text not null,
  mime_type text,
  tamanho_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists imovel (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  produto_id uuid references produto(id) on delete set null,
  codigo_interno text,
  titulo text not null,
  descricao text,
  tipo_de_imovel text not null,
  subtipo_do_imovel text,
  finalidade text not null check (finalidade in ('venda','aluguel')),
  status_do_imovel text not null default 'disponivel',
  preco_de_venda numeric(12,2),
  valor_de_aluguel numeric(12,2),
  valor_do_condominio numeric(12,2),
  valor_do_iptu numeric(12,2),
  area_total_m2 numeric(10,2),
  area_construida_m2 numeric(10,2),
  numero_de_quartos int,
  numero_de_suites int,
  numero_de_banheiros int,
  numero_de_vagas_de_garagem int,
  endereco_completo text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  corretor_nome text,
  corretor_telefone text,
  proprietario_nome text,
  proprietario_telefone text,
  caracteristicas jsonb not null default '[]'::jsonb,
  fotos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_imovel (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa(id) on delete cascade,
  imovel_id uuid references imovel(id) on delete set null,
  contato_id uuid references contato(id) on delete set null,
  nome_cliente text,
  telefone_cliente text,
  interesse text,
  status text not null default 'novo',
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notificacao_empresa on notificacao_evento(empresa_id, created_at desc);
create index if not exists idx_imovel_empresa on imovel(empresa_id);
create index if not exists idx_imovel_status on imovel(status_do_imovel);
create index if not exists idx_lead_imovel_empresa on lead_imovel(empresa_id, created_at desc);

alter table notificacao_evento enable row level security;
alter table sessao_conversa enable row level security;
alter table estado_conversa enable row level security;
alter table arquivo_midia enable row level security;
alter table imovel enable row level security;
alter table lead_imovel enable row level security;

create policy if not exists "notificacao_isolado_empresa" on notificacao_evento
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "imovel_isolado_empresa" on imovel
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');

create policy if not exists "lead_isolado_empresa" on lead_imovel
for all using (empresa_id::text = auth.jwt() ->> 'empresa_id')
with check (empresa_id::text = auth.jwt() ->> 'empresa_id');
