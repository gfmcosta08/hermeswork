# FAROLLWORK — DOCUMENTO PARA O CODEX
## Implementação completa do sistema + integração com Hermes na VPS
## Versão 1.0

---

# 1. OBJETIVO

Implementar o FarollWork como um SaaS com dois módulos de negócio:

1. Comércio em geral
2. Imobiliária

Arquitetura obrigatória:
- Frontend em Vercel
- Backend de dados em Supabase
- Hermes rodando na VPS da Hostinger
- Um Hermes por cliente
- Nenhuma comunicação entre Hermes
- Sem n8n
- Onboarding de cliente com tela amigável, sem necessidade de codar

Este documento é para o CODEX implementar:
- frontend
- backend
- banco
- painel administrativo
- roteamento para o Hermes correto
- provisionamento de novos clientes

---

# 2. PRINCÍPIOS INEGOCIÁVEIS

1. Toda empresa deve ser isolada por `empresa_id`
2. Todo cliente deve ter sua própria instância Hermes
3. O backend é quem controla a comunicação com Hermes
4. O frontend nunca fala diretamente com Hermes
5. Hermes não acessa o banco diretamente
6. Hermes nunca usa SQL livre
7. Nenhuma instância Hermes pode conversar com outra
8. Toda ação crítica deve ser auditada
9. O sistema deve permitir criar novos clientes por tela, sem edição manual de código
10. O projeto deve nascer pronto para replicação comercial

---

# 3. ARQUITETURA FINAL

```text
Usuário / Gestor / Corretor
        ↓
Frontend (Vercel)
        ↓
Backend / API
        ↓
Supabase
        ↓
Agent Router / Provisioner API
        ↓
Hermes do cliente correto na VPS
```

---

# 4. RESPONSABILIDADES DE CADA CAMADA

## 4.1 Frontend
Responsável por:
- autenticação
- dashboard
- cadastro de clientes
- cadastro de produtos
- cadastro de imóveis
- leads
- pedidos
- estoque
- financeiro
- onboarding de novos clientes
- tela administrativa de provisionamento Hermes

## 4.2 Backend / API
Responsável por:
- receber chamadas do frontend
- validar autenticação e autorização
- aplicar regras de negócio
- acessar Supabase
- descobrir o Hermes correto por `empresa_id`
- chamar Hermes via HTTP interno
- executar funções de domínio
- registrar auditoria
- acionar provisionamento de novos clientes

## 4.3 Supabase
Responsável por:
- persistência
- Auth
- Storage
- RLS
- logs
- tabelas de roteamento de Hermes
- dados dos módulos comércio e imobiliária

## 4.4 Hermes
Responsável por:
- interpretar mensagens
- sugerir intenção e fluxo
- responder dentro do escopo da empresa
- retornar intenções e pedidos de função
- nunca executar mutação direta no banco

---

# 5. MÓDULOS DO PRODUTO

## 5.1 Comércio em geral
- produtos
- serviços
- estoque
- pedidos
- agendamentos
- orçamento simples
- financeiro operacional
- contatos
- importação em lote

## 5.2 Imobiliária
- imóveis
- corretor
- lead
- visita
- recomendação de imóveis similares
- venda/aluguel
- observações do corretor

---

# 6. TELA ADMINISTRATIVA OBRIGATÓRIA: PROVISIONAMENTO DE CLIENTES

## 6.1 Objetivo
Criar uma tela amigável para que o operador consiga criar um novo cliente sem precisar codar.

## 6.2 Local
No painel administrativo, criar menu:
- Administração
- Clientes
- Instâncias Hermes
- Provisionamento
- Logs
- Saúde das instâncias

## 6.3 Tela "Novo Cliente"
A tela deve ter:
- botão: `+ Adicionar cliente`
- formulário simples
- pré-visualização do que será criado
- botão: `Salvar e Provisionar`

## 6.4 Campos da tela
### Dados da empresa
- nome da empresa
- slug da empresa
- módulo principal (`comercio` ou `imobiliaria`)
- timezone
- status ativo/inativo

### Dados do Hermes
- nome amigável da instância
- porta interna sugerida
- token interno do Hermes
- prompt profile
- funções permitidas
- URL interna base da instância

### Dados operacionais
- telefone principal
- responsável
- email
- observações

## 6.5 Resultado esperado ao clicar em salvar
O sistema deve:
1. criar a empresa no banco
2. criar as configurações iniciais
3. criar o registro `agent_instance`
4. chamar a Provisioner API da VPS
5. aguardar confirmação
6. salvar status de provisionamento
7. mostrar feedback ao operador

## 6.6 Estados de tela
- rascunho
- provisionando
- ativo
- erro
- pausado

---

# 7. PROVISIONER API (OBRIGATÓRIA)

## 7.1 O que é
Criar um serviço backend chamado `Provisioner API`, responsável por conversar com a VPS e criar/atualizar stacks Hermes por cliente.

## 7.2 Funções principais
- criar stack de novo cliente
- atualizar env do cliente
- pausar stack do cliente
- reativar stack do cliente
- verificar health
- listar instâncias
- reiniciar Hermes do cliente
- rotacionar token interno

## 7.3 Endpoints sugeridos
- `POST /internal/provision/client`
- `POST /internal/provision/pause`
- `POST /internal/provision/resume`
- `POST /internal/provision/restart`
- `GET /internal/provision/health/:empresa_id`
- `GET /internal/provision/list`

## 7.4 Segurança
Todos os endpoints internos devem:
- exigir token interno
- validar origem
- registrar auditoria
- nunca expor segredos no frontend

---

# 8. USO DA HOSTINGER NO PROJETO

## 8.1 Premissa
A Hostinger Docker Manager permite implantar projetos Docker Compose manualmente ou a partir de URL. A Hostinger também disponibiliza API para implantar projetos a partir de `docker-compose.yml` ou URL remota. Essa capacidade deve ser usada para permitir onboarding sem código.

## 8.2 Como o sistema deve aproveitar isso
O Codex deve preparar o sistema para um destes dois modos:

### Modo A — Provisionamento por API da Hostinger
A Provisioner API monta o compose do cliente e chama a API da Hostinger para criar o projeto.

### Modo B — Provisionamento local na VPS
A Provisioner API salva os arquivos do cliente em diretório próprio e executa o deploy da stack localmente.

## 8.3 Regra de implementação
O código deve abstrair o provisionamento em um provider:
- `hostingerApiProvider`
- `localDockerProvider`

---

# 9. TABELAS OBRIGATÓRIAS

## 9.1 empresa
Campos:
- id
- nome
- slug
- module_mode
- timezone
- ativo
- created_at
- updated_at

## 9.2 usuario
Campos:
- id
- empresa_id
- nome
- email
- role
- ativo
- created_at
- updated_at

## 9.3 agent_instance
Campos:
- id
- empresa_id
- agent_name
- module_mode
- internal_url
- internal_port
- auth_token
- health_status
- is_active
- prompt_profile
- allowed_functions
- deployment_mode
- deployment_status
- created_at
- updated_at

## 9.4 audit_log
Campos:
- id
- empresa_id
- actor_type
- actor_id
- action_name
- action_payload
- result_status
- created_at

## 9.5 mensagem_evento
Campos:
- id
- empresa_id
- contato_id
- canal
- direction
- payload_raw
- normalized_text
- media_url
- dedupe_key
- status
- created_at

## 9.6 sessao_conversa
Campos:
- id
- empresa_id
- contato_id
- status
- last_intent
- context_json
- updated_at

---

# 10. MÓDULO COMÉRCIO — TABELAS

- produto
- estoque
- movimentacao_estoque
- transacao
- item_transacao
- financeiro
- categoria_financeira
- solicitacao_orcamento
- resposta_orcamento

---

# 11. MÓDULO IMOBILIÁRIA — TABELAS

## 11.1 imovel
Campos obrigatórios:
- id
- empresa_id
- id_do_imovel
- codigo_interno
- tipo_de_imovel
- subtipo_do_imovel
- finalidade
- status_do_imovel
- data_de_cadastro
- data_de_atualizacao
- titulo_do_anuncio
- descricao_completa
- diferenciais_do_imovel
- preco_de_venda
- valor_de_aluguel
- valor_do_condominio
- valor_do_iptu
- outras_taxas
- aceita_financiamento
- aceita_permuta
- area_total_m2
- area_construida_m2
- area_do_terreno_m2
- numero_de_quartos
- numero_de_suites
- numero_de_banheiros
- numero_de_vagas_de_garagem
- numero_de_salas
- numero_de_andares
- andar_do_imovel
- mobiliado
- tipo_de_piso
- posicao_solar
- idade_do_imovel
- endereco_completo
- numero
- complemento
- bairro
- cidade
- estado
- cep
- latitude
- longitude
- nome_do_proprietario
- telefone_do_proprietario
- email_do_proprietario
- nome_do_corretor
- telefone_do_corretor
- email_do_corretor
- caracteristicas
- infraestrutura
- seguranca
- chave_disponivel
- imovel_ocupado
- documentacao
- matricula_do_imovel
- situacao_da_documentacao
- possui_escritura
- possui_registro
- tipo_de_construcao
- padrao_de_acabamento
- proximidades
- distancia_do_centro
- regiao_da_cidade
- observacoes_do_corretor
- descricao_interna_livre
- ativo
- created_at
- updated_at

## 11.2 corretor
- id
- empresa_id
- nome
- telefone
- email
- ativo
- created_at
- updated_at

## 11.3 lead_imobiliario
- id
- empresa_id
- contato_id
- corretor_id
- origem
- interesse_json
- status
- observacao
- created_at
- updated_at

## 11.4 visita_imovel
- id
- empresa_id
- imovel_id
- lead_id
- corretor_id
- data_hora
- status
- observacao
- created_at
- updated_at

---

# 12. RLS OBRIGATÓRIO

Todas as tabelas com `empresa_id` devem ter políticas de RLS.
O sistema deve garantir:
- leitura por empresa
- escrita por empresa
- update por empresa
- nada sem escopo

---

# 13. CONTRACTO DE COMUNICAÇÃO BACKEND ↔ HERMES

## 13.1 Regra
O backend chama o Hermes.
O Hermes nunca chama o frontend.
O Hermes nunca usa SQL.
O Hermes nunca toca no banco diretamente.

## 13.2 Endpoint padrão do Hermes
`POST /agent/run`

## 13.3 Request padrão
```json
{
  "empresa_id": "uuid-ou-slug",
  "module_mode": "comercio",
  "message": "texto do usuário",
  "context": {
    "contact_id": "id",
    "session_id": "id",
    "role": "cliente"
  }
}
```

## 13.4 Response padrão
```json
{
  "response_text": "mensagem do agente",
  "intent": "buscar_produto",
  "confidence": 0.91,
  "requested_action": {
    "name": "buscar_produto",
    "params": {
      "query": "pizza calabresa"
    }
  },
  "meta": {
    "requires_confirmation": false
  }
}
```

## 13.5 Regra crítica
O backend nunca executa função sem validar:
- empresa_id
- allowed_functions
- módulo
- payload

---

# 14. AGENT ROUTER

Criar um serviço no backend chamado `Agent Router`.

## 14.1 Responsabilidades
- receber `empresa_id`
- buscar `agent_instance`
- validar se está ativo
- validar health
- chamar o Hermes correto
- registrar latency e erros

---

# 15. PROMPTS DOS AGENTES

## 15.1 Prompt global
```text
Você é um funcionário digital interno da empresa.
Você só pode agir com base em dados internos da empresa atual, funções internas autorizadas e regras de negócio do sistema.

É proibido:
- acessar internet;
- buscar informações externas;
- gerar, editar ou sugerir código;
- executar comandos;
- acessar terminal;
- acessar outro cliente;
- usar dados fora do empresa_id atual;
- inventar respostas quando o sistema não possuir a informação.

Quando faltar informação:
- informe que a informação não está disponível no sistema;
- peça apenas os dados mínimos necessários;
- registre a interação se houver função autorizada.
```

## 15.2 Prompt comércio
```text
Você é o atendente operacional digital da empresa no módulo Comércio em Geral.
Ajude com produtos, serviços, estoque, pedidos, agendamentos, orçamento simples e financeiro operacional.

Regras:
- seja objetivo;
- confirme ações críticas;
- não invente dados;
- não saia do escopo da empresa;
- nunca use informação externa.
```

## 15.3 Prompt imobiliária
```text
Você é o atendente consultivo digital da imobiliária.
Ajude com busca de imóveis, filtros, fotos, recomendação de similares, lead, visita, corretor e status interno do imóvel.

Regras:
- seja consultivo e organizado;
- não invente imóveis, preços ou documentação;
- use apenas dados internos;
- respeite o status do imóvel;
- nunca use informação externa.
```

---

# 16. FUNÇÕES AUTORIZADAS POR MÓDULO

## 16.1 Comércio
- buscar_produto
- listar_produtos
- criar_pedido
- atualizar_pedido
- consultar_estoque
- registrar_movimentacao_estoque
- criar_agendamento
- consultar_agenda
- criar_contato
- registrar_observacao
- registrar_despesa
- registrar_receita
- buscar_configuracao_empresa

## 16.2 Imobiliária
- buscar_imovel_por_filtro
- buscar_imovel_por_codigo
- listar_imoveis_similares
- obter_fotos_do_imovel
- criar_lead_imobiliario
- atualizar_status_lead
- registrar_interacao_imobiliaria
- agendar_visita
- consultar_agenda_corretor
- listar_corretores_ativos
- notificar_corretor
- consultar_regras_imobiliaria
- buscar_configuracao_empresa

---

# 17. UX DA TELA DE PROVISIONAMENTO

## 17.1 Requisitos
- simples
- sem código
- com validação
- com status de sucesso/erro
- com histórico
- com botão de reiniciar stack
- com botão de pausar/reactivar

## 17.2 Lista de clientes
Cada cliente deve mostrar:
- nome
- módulo
- Hermes ativo/inativo
- health status
- última resposta
- porta interna
- data de criação

## 17.3 Ações
- criar cliente
- editar cliente
- pausar instância
- reativar instância
- reiniciar instância
- testar instância
- ver logs resumidos

---

# 18. TESTES OBRIGATÓRIOS

## 18.1 Fluxo de criação de cliente
- criar empresa
- criar agent_instance
- provisionar Hermes
- health check ok

## 18.2 Fluxo de mensagem
- mensagem chega
- backend persiste
- Agent Router chama Hermes correto
- backend executa requested_action
- resposta retorna
- tudo auditado

## 18.3 Fluxo negativo
- cliente sem instância ativa
- token inválido
- Hermes indisponível
- função não autorizada
- imóvel indisponível

---

# 19. CRITÉRIOS DE ACEITAÇÃO

1. Deve existir tela amigável para cadastrar novos clientes
2. Deve ser possível provisionar Hermes sem editar código
3. Cada cliente deve ter sua própria instância Hermes
4. O backend deve rotear corretamente por `empresa_id`
5. Hermes nunca deve falar com outro Hermes
6. Hermes nunca deve acessar banco diretamente
7. O sistema deve funcionar nos dois módulos
8. Toda ação crítica deve estar em log
9. A UI deve deixar claro o estado de cada instância
10. O operador leigo deve conseguir cadastrar um novo cliente pelo painel

---

# 20. INSTRUÇÃO FINAL PARA O CODEX

Implemente o sistema completo descrito acima com foco em:
- segurança
- modularidade
- zero acesso cruzado entre clientes
- provisionamento simples por tela
- roteamento correto para o Hermes específico
- backend como autoridade de execução
- frontend amigável para operador leigo

Não faça refatoração desnecessária.
Não invente componentes fora do documento.
Não deixe onboarding depender de edição manual de código.
