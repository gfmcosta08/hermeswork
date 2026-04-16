# FAROLLWORK — SDD FINAL PESADO
## Versão 5.0 — Produção pesada, multi-Hermes isolado, sem n8n

---

# 1. OBJETIVO

O **FarollWork** é um SaaS conversacional com painel web e operação via WhatsApp, composto por **dois módulos de negócio**:

1. **Comércio em geral**
2. **Imobiliária**

O objetivo deste documento é definir uma arquitetura **robusta, segura, escalável e implementável**, com:

- **Frontend** em Vercel
- **Backend de dados** em Supabase
- **Agente Hermes isolado por cliente** em VPS
- **Sem n8n**
- **Sem internet aberta para o agente**
- **Sem terminal, sem código, sem ações fora do escopo do cliente**
- **Sem comunicação entre instâncias Hermes**
- **Isolamento rigoroso por empresa**
- **Capacidade de replicação comercial**

---

# 2. PRINCÍPIOS INEGOCIÁVEIS

1. **Persistência antes de processamento**
2. **Toda operação vinculada a `empresa_id`**
3. **Cada cliente possui sua própria instância Hermes**
4. **Hermes é operador digital, não agente livre**
5. **Hermes não acessa internet aberta**
6. **Hermes não executa terminal**
7. **Hermes não gera ou altera código**
8. **Hermes só chama funções internas autorizadas**
9. **Nenhum Hermes pode se comunicar com outro Hermes**
10. **Mutação crítica exige confirmação e auditoria**
11. **Deploy seguro com backup e rollback**
12. **Nada pode quebrar o que já funciona**

---

# 3. ESCOPO DO PRODUTO

## 3.1 Módulo Comércio em Geral

Aplicável a:
- lojas
- distribuidoras
- oficinas
- alimentação
- estética
- prestadores de serviço
- pequenos e médios comércios

### Capacidades
- atendimento via WhatsApp
- cadastro de produtos e serviços
- controle de estoque
- pedidos e encomendas
- agendamentos
- orçamento simples
- financeiro operacional
- importação em lote
- relatórios operacionais

## 3.2 Módulo Imobiliária

Aplicável a:
- imobiliárias
- corretoras
- corretores com operação estruturada

### Capacidades
- cadastro avançado de imóveis
- filtros estruturados
- recomendação automática de imóveis similares
- envio de fotos e detalhes
- geração e gestão de leads
- associação de corretor
- agendamento de visita
- gestão de status do imóvel
- registro de venda/aluguel
- observações internas do corretor

---

# 4. FORA DO ESCOPO

O sistema **não** deve:
- permitir navegação web livre pelo agente
- permitir codificação pelo agente
- permitir acesso SSH/terminal pelo agente
- usar n8n
- confiar regra de negócio crítica a automação externa
- permitir SQL livre pelo agente
- permitir mistura de memória entre clientes
- permitir um cliente acessar dados de outro

---

# 5. ARQUITETURA GERAL

```text
Cliente / Gestor / Corretor
        ↓
WhatsApp / Painel Web
        ↓
Webhook / API Interna
        ↓
Camada de aplicação / roteamento
        ↓
Hermes do cliente correto
        ↓
Funções internas autorizadas
        ↓
Supabase (fonte única da verdade)
        ↓
Resposta / CRM / Notificação / Registro
```

---

# 6. STACK OFICIAL

## 6.1 Frontend
- Next.js
- TypeScript
- Tailwind
- Deploy na Vercel

## 6.2 Backend de dados
- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Edge Functions apenas quando fizer sentido
- RPCs SQL controladas

## 6.3 Canal WhatsApp
- Uazapi ou provedor equivalente

## 6.4 Agente
- Hermes
- Rodando em VPS
- 1 instância por cliente
- Isolado por diretório, porta, volume, env e token

## 6.5 Infra complementar
- Docker / Docker Compose
- Reverse proxy (Nginx ou Traefik)
- Redis opcional para filas simples e throttling
- Logs por cliente
- Health checks por serviço

---

# 7. ARQUITETURA FÍSICA NA VPS

## 7.1 Premissa

A VPS hospeda **múltiplas instâncias Hermes**, uma por cliente, sem compartilhamento de memória ou contexto.

## 7.2 Regra crítica

**Cada cliente tem o seu Hermes.**
Não existe Hermes global atendendo vários clientes no mesmo contexto.

## 7.3 Estrutura sugerida

```text
/opt/farollwork
  /infra
    /nginx
    /compose
    /scripts
    /logs
  /clients
    /empresa_a
      /hermes
      /data
      /logs
      .env
      docker-compose.yml
    /empresa_b
      /hermes
      /data
      /logs
      .env
      docker-compose.yml
    /empresa_c
      /hermes
      /data
      /logs
      .env
      docker-compose.yml
```

## 7.4 O que muda por cliente
- porta interna
- nome do container
- token de autenticação
- variáveis de ambiente
- diretório de dados
- logs
- prompt base
- permissões por módulo
- chaves internas

---

# 8. HERMES POR CLIENTE — ISOLAMENTO OBRIGATÓRIO

## 8.1 Regras de isolamento

Cada Hermes:
- só atende uma empresa
- só conhece um `empresa_id`
- só usa as funções permitidas daquela empresa
- só lê e grava dentro do escopo daquela empresa
- não conhece a existência de outros Hermes
- não acessa o diretório de outro cliente
- não compartilha estado com outro cliente

## 8.2 Proibições absolutas

Um Hermes não pode:
- chamar outro Hermes
- ler memória de outro Hermes
- ler logs de outro Hermes
- usar env de outro Hermes
- acessar arquivos de outro cliente
- usar prompt de outro cliente
- compartilhar sessão com outro cliente

## 8.3 Garantias técnicas mínimas
- container separado por cliente
- volume separado por cliente
- porta separada por cliente
- token separado por cliente
- logs separados por cliente
- secrets separados por cliente
- firewall/rede interna controlada
- roteamento central resolve o Hermes correto por `empresa_id`
- validação obrigatória de assinatura/token do webhook antes de resolver `empresa_id`
- rejeição e auditoria de qualquer evento com `empresa_id` incompatível com o token da instância

---

# 9. ROTEAMENTO PARA O HERMES CERTO

## 9.1 Regra

A aplicação central resolve:
```text
empresa_id -> configuração do cliente -> endpoint do Hermes específico
```

## 9.2 Tabela sugerida de roteamento
`agent_instance`

Campos sugeridos:
- id
- empresa_id
- agent_name
- internal_url
- internal_port
- auth_token
- module_mode
- is_active
- health_status
- created_at
- updated_at

## 9.3 Fluxo
1. chega webhook ou ação do painel
2. sistema identifica `empresa_id`
3. sistema consulta `agent_instance`
4. sistema chama o Hermes específico
5. Hermes executa apenas funções autorizadas
6. sistema registra tudo em log/auditoria

---

# 10. REVERSE PROXY E REDE

## 10.1 Papel do reverse proxy
- terminar HTTPS
- expor apenas os endpoints necessários
- esconder portas internas dos Hermes
- permitir roteamento controlado
- bloquear acesso público desnecessário

## 10.2 Regra recomendada
- Hermes não deve ser exposto publicamente
- Hermes só deve ser acessível pela aplicação interna
- painel web fica na Vercel
- webhooks públicos entram em endpoints próprios da aplicação
- a aplicação interna fala com Hermes por rede privada da VPS
- webhook inbound deve validar assinatura HMAC por cliente
- webhook inbound deve aplicar proteção anti-replay (timestamp + nonce/event_id)
- eventos duplicados devem ser idempotentes (não reprocessar)
- falha de validação deve responder 401/403 e registrar auditoria

## 10.3 Exemplo conceitual
```text
Internet
  -> api.farollwork.com
      -> app interna
          -> Hermes empresa_a
          -> Hermes empresa_b
          -> Hermes empresa_c
```

---

# 11. DOCKER E COMPOSE — PADRÃO OPERACIONAL

## 11.1 Filosofia
- 1 compose por cliente ou 1 compose central gerando múltiplos serviços
- para clareza operacional, preferir **1 stack por cliente**
- isso facilita restart, logs, backup e troubleshooting

## 11.2 Serviços mínimos por cliente
- `hermes_<empresa>`
- `redis_<empresa>` opcional
- volumes próprios
- network própria opcional

## 11.3 Benefícios
- restart isolado
- falha de um cliente não derruba outro
- logs isolados
- deploy seletivo por cliente
- troubleshooting muito mais simples

---

# 12. CRIAÇÃO DE UM NOVO CLIENTE

## 12.1 Provisionamento
1. criar registro da empresa no Supabase
2. criar configuração do módulo (`comercio` ou `imobiliaria`)
3. criar registro em `agent_instance`
4. gerar diretório do cliente na VPS
5. gerar `.env` do cliente
6. subir container Hermes do cliente
7. registrar health check
8. cadastrar prompt base do cliente
9. testar conexão
10. marcar cliente como ativo

## 12.2 Script esperado
Deve existir um script administrativo do tipo:
```text
create_client_stack.sh <empresa_id> <module_mode>
```

Esse script deve:
- criar pasta do cliente
- preencher `.env`
- gerar compose
- subir stack
- registrar instância
- validar health

## 12.3 Remoção/suspensão
Outro script administrativo deve:
- parar o Hermes do cliente
- desabilitar roteamento
- manter dados
- preservar logs
- registrar auditoria

---

# 13. MODELOS DE MÓDULO

## 13.1 `module_mode = comercio`
Habilita:
- produtos
- serviços
- estoque
- pedidos
- agendamento
- financeiro operacional
- orçamento simples
- importação em lote

## 13.2 `module_mode = imobiliaria`
Habilita:
- imóveis
- corretor
- lead
- visita
- recomendação automática
- venda/aluguel
- observações internas

## 13.3 Regra
O Hermes precisa saber qual módulo opera.
O prompt, as funções permitidas e o comportamento mudam conforme o módulo.

---

# 14. FUNÇÕES AUTORIZADAS DO HERMES

## 14.1 Regra máxima
Hermes **não acessa banco direto**.
Hermes **não usa SQL livre**.
Hermes só interage por funções internas autorizadas.

## 14.2 Comércio — funções autorizadas
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
- gerar_relatorio_operacional
- registrar_despesa
- registrar_receita
- buscar_configuracao_empresa

## 14.3 Imobiliária — funções autorizadas
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

# 15. FUNÇÕES PROIBIDAS AO HERMES

- executar_terminal
- navegar_na_internet
- editar_codigo
- instalar_dependencias
- acessar_git
- fazer_deploy
- alterar_schema
- rodar_sql_livre
- acessar_arquivo_do_servidor
- chamar_api_nao_autorizada
- alterar_variavel_de_ambiente
- acessar_outro_cliente
- chamar_outro_hermes

---

# 16. PROMPT GLOBAL DO HERMES

```text
Você é um funcionário digital interno da empresa.

Você só pode agir com base em:
1. dados internos da empresa atual;
2. funções internas autorizadas;
3. regras de negócio configuradas no sistema.

É proibido:
- acessar internet;
- buscar informações externas;
- executar comandos;
- acessar terminal;
- gerar, editar ou sugerir código;
- acessar outro cliente;
- usar dados fora do empresa_id atual;
- inventar respostas quando o sistema não possuir a informação.

Quando faltar informação:
- informe que a informação não está disponível no sistema;
- peça apenas os dados mínimos necessários;
- registre a interação se houver função autorizada.

Você deve agir como operador interno da empresa, com segurança, objetividade e respeito às regras.
```

---

# 17. PROMPT DO HERMES — COMÉRCIO EM GERAL

```text
Você é o atendente operacional digital de uma empresa do módulo Comércio em Geral.

Seu papel:
- atender clientes e gestores;
- consultar dados internos;
- registrar pedidos, agendamentos, contatos e observações;
- ajudar com estoque, produtos, serviços e financeiro operacional;
- executar somente funções internas autorizadas.

Regras obrigatórias:
1. Você não acessa internet.
2. Você não gera, edita ou sugere código.
3. Você não executa terminal, comandos ou scripts.
4. Você não altera o sistema.
5. Você não acessa banco diretamente nem usa SQL livre.
6. Você não inventa dados.
7. Você usa apenas os dados da empresa atual.
8. Você nunca quebra as regras do negócio.

Comportamento:
- seja objetivo;
- confirme ações críticas;
- quando a confiança estiver média, pergunte antes de agir;
- peça apenas o mínimo de dados necessário;
- quando algo não existir no sistema, diga isso claramente.

Você pode ajudar com:
- produtos;
- serviços;
- estoque;
- pedidos;
- encomendas;
- agendamentos;
- orçamento simples;
- contatos;
- financeiro operacional;
- alertas internos.

Você não pode sair do escopo da empresa.
```

---

# 18. PROMPT DO HERMES — IMOBILIÁRIA

```text
Você é o atendente consultivo digital de uma imobiliária.

Seu papel:
- atender clientes, corretores e gestores;
- consultar e apresentar imóveis;
- aplicar filtros estruturados;
- sugerir imóveis similares;
- registrar leads;
- agendar visitas;
- atualizar interações;
- executar somente funções internas autorizadas.

Regras obrigatórias:
1. Você não acessa internet.
2. Você não pesquisa em portais externos.
3. Você não gera, edita ou sugere código.
4. Você não executa terminal, comandos ou scripts.
5. Você não altera o sistema.
6. Você não acessa banco diretamente nem usa SQL livre.
7. Você não inventa imóveis, preços, disponibilidade ou documentação.
8. Você usa apenas os dados da imobiliária atual.
9. Você respeita as regras de status do imóvel.
10. Você nunca burla as regras do negócio.

Comportamento:
- seja consultivo, claro e organizado;
- conduza a conversa por filtros;
- quando houver muitas opções, resuma e refine;
- quando houver imóveis similares, apresente os melhores por aderência;
- quando faltar dado, peça apenas o necessário;
- quando o imóvel não estiver disponível, informe isso com clareza;
- quando necessário, gere lead e direcione para corretor.

Você pode ajudar com:
- busca de imóveis;
- filtros;
- fotos e detalhes;
- recomendação automática;
- lead;
- visita;
- corretor;
- venda e aluguel;
- registro de observações;
- status e disponibilidade interna.

Você não pode responder com base em suposição ou informação externa.
```

---

# 19. PIPELINE DE MENSAGENS

## 19.1 Inbound
1. receber webhook do WhatsApp
2. validar assinatura/token do provedor por cliente
3. validar janela anti-replay (timestamp + nonce/event_id)
4. persistir evento bruto
5. deduplicar
6. identificar empresa
7. identificar contato e sessão
8. resolver instância Hermes
9. montar contexto
10. chamar Hermes
11. Hermes escolhe função autorizada
12. sistema executa função
13. persistir resultado
14. responder via provider
15. registrar log/auditoria

## 19.2 Outbound
1. receber resposta estruturada
2. validar limites e throttle
3. registrar tentativa
4. enviar ao provider
5. registrar sucesso/erro
6. aplicar retry controlado se necessário

## 19.3 Mídias
- imagem, áudio e documento devem ser persistidos
- storage em Supabase Storage
- referência registrada no banco
- Hermes trabalha em cima do que foi liberado pela aplicação
- processamento de mídia nunca pode sair do `empresa_id`

---

# 20. MODELO DE DADOS — NÚCLEO

## 20.1 Tabelas-base
- empresa
- usuario
- contato
- agent_instance
- mensagem_evento
- sessao_conversa
- estado_conversa
- log_acao
- notificacao_evento
- arquivo_midia

## 20.2 Campos mínimos de `empresa`
- id
- nome
- modulo_ativo
- timezone
- active
- created_at
- updated_at

## 20.3 Campos mínimos de `agent_instance`
- id
- empresa_id
- agent_name
- module_mode
- internal_url
- internal_port
- auth_token
- health_status
- is_active
- created_at
- updated_at

---

# 21. MÓDULO COMÉRCIO — MODELO DE DADOS

## 21.1 produto
- id
- empresa_id
- nome
- tipo
- categoria
- preco
- custo
- unidade
- descricao
- ativo
- created_at
- updated_at

## 21.2 estoque
- id
- empresa_id
- nome
- quantidade
- unidade
- minimo
- local
- custo_compra
- ativo
- created_at
- updated_at

## 21.3 movimentacao_estoque
- id
- empresa_id
- estoque_id
- tipo
- quantidade
- motivo
- observacao
- created_at

Regras:
- `tipo`: `entrada` | `saida` | `ajuste`
- `quantidade` é sempre positiva
- a direção da movimentação vem apenas de `tipo` (nunca de sinal negativo)

## 21.4 transacao
- id
- empresa_id
- cliente_id
- tipo
- status
- data_criacao
- data_agendada
- observacao
- created_at
- updated_at

## 21.5 item_transacao
- id
- empresa_id
- transacao_id
- produto_id
- quantidade
- preco_unitario
- created_at

## 21.6 financeiro
- id
- empresa_id
- tipo
- valor (DECIMAL(12,2) em BRL; não usar valor em centavos inteiros)
- categoria
- forma_pagamento
- confirmado
- vencimento
- pago_em
- created_at

---

# 22. MÓDULO IMOBILIÁRIA — CADASTRO COMPLETO DO IMÓVEL

## 22.1 Identificação
- id_do_imovel (token automático)
- codigo_interno

## 22.2 Classificação
- tipo_de_imovel
- subtipo_do_imovel
- finalidade
- status_do_imovel
- data_de_cadastro
- data_de_atualizacao

## 22.3 Publicação
- titulo_do_anuncio
- descricao_completa
- diferenciais_do_imovel

## 22.4 Valores
- preco_de_venda
- valor_de_aluguel
- valor_do_condominio
- valor_do_iptu
- outras_taxas

## 22.5 Condições comerciais
- aceita_financiamento
- aceita_permuta

## 22.6 Dimensões
- area_total_m2
- area_construida_m2
- area_do_terreno_m2

## 22.7 Estrutura
- numero_de_quartos
- numero_de_suites
- numero_de_banheiros
- numero_de_vagas_de_garagem
- numero_de_salas
- numero_de_andares
- andar_do_imovel

## 22.8 Características físicas
- mobiliado
- tipo_de_piso
- posicao_solar
- idade_do_imovel

## 22.9 Endereço
- endereco_completo
- numero
- complemento
- bairro
- cidade
- estado
- cep
- latitude
- longitude

## 22.10 Proprietário
- nome_do_proprietario
- telefone_do_proprietario
- email_do_proprietario

## 22.11 Corretor
- nome_do_corretor
- telefone_do_corretor
- email_do_corretor

## 22.12 Estrutura de busca
- caracteristicas
- infraestrutura
- seguranca

## 22.13 Estado operacional
- chave_disponivel
- imovel_ocupado

## 22.14 Documentação
- documentacao
- matricula_do_imovel
- situacao_da_documentacao
- possui_escritura
- possui_registro

## 22.15 Detalhes técnicos avançados
- tipo_de_construcao
- padrao_de_acabamento

## 22.16 Localização estratégica
- proximidades
- distancia_do_centro
- regiao_da_cidade

## 22.17 Campos livres
- observacoes_do_corretor
- descricao_interna_livre

---

# 23. CAMPOS PRÉ-CADASTRADOS DO MÓDULO IMOBILIÁRIO

## 23.1 Tipo de imóvel
- Residencial
- Comercial
- Rural
- Terreno
- Industrial
- Temporada
- Misto

## 23.2 Subtipo do imóvel
### Residencial
- Casa
- Sobrado
- Apartamento
- Kitnet
- Studio
- Loft
- Cobertura
- Casa geminada
- Condomínio fechado
- Chácara
- Sítio
- Fazenda

### Comercial
- Sala comercial
- Loja
- Ponto comercial
- Galpão
- Depósito
- Escritório
- Clínica
- Prédio comercial

### Rural
- Sítio
- Chácara
- Fazenda
- Haras
- Terreno rural

### Terreno
- Terreno residencial
- Terreno comercial
- Terreno industrial
- Lote
- Área

## 23.3 Finalidade
- Venda
- Aluguel

## 23.4 Status do imóvel
- Disponível
- Reservado
- Em negociação
- Vendido
- Alugado
- Bloqueado
- Inativo
- Removido
- Expirado

## 23.5 Tipo de piso
- Porcelanato
- Cerâmica
- Madeira
- Laminado
- Vinílico
- Cimento queimado
- Pedra
- Outro

## 23.6 Posição solar
- Nascente
- Poente
- Norte
- Sul
- Leste
- Oeste
- Sol da manhã
- Sol da tarde

## 23.7 Tipo de construção
- Alvenaria
- Madeira
- Mista
- Metálica
- Pré-moldado
- Outro

## 23.8 Padrão de acabamento
- Alto
- Médio
- Simples

## 23.9 Situação da documentação
- Regular
- Irregular
- Em análise
- Pendente

## 23.10 Região da cidade
- Centro
- Norte
- Sul
- Leste
- Oeste
- Periferia
- Zona rural

---

# 24. REGRAS DO STATUS DO IMÓVEL

## 24.1 Disponível
Pode aparecer em busca e recomendação.

## 24.2 Reservado
Pode aparecer internamente, mas com alerta de reserva.

## 24.3 Em negociação
Pode aparecer com aviso específico.

## 24.4 Vendido / Alugado
Não aparece nas buscas padrão.
Permanece no histórico.

## 24.5 Bloqueado / Removido / Expirado / Inativo
Não entra em recomendação padrão.

---

# 25. LÓGICA DE RECOMENDAÇÃO AUTOMÁTICA DE IMÓVEIS SIMILARES

## 25.1 Objetivo
Encontrar imóveis semelhantes ao imóvel visualizado ou à intenção declarada pelo cliente.

## 25.2 Pré-filtros obrigatórios
Só considerar imóveis:
- da mesma empresa
- ativos para busca
- com status permitido
- com finalidade compatível

## 25.3 Peso alto
- tipo_de_imovel
- subtipo_do_imovel
- finalidade
- cidade
- bairro
- faixa de preço

## 25.4 Peso médio
- quartos
- suítes
- banheiros
- vagas
- área total
- área construída
- regiao_da_cidade

## 25.5 Peso complementar
- mobiliado
- posição solar
- tipo de piso
- proximidades
- características
- infraestrutura
- segurança

## 25.6 Exemplo de score
- tipo/subtipo/finalidade iguais = +3
- bairro igual = +2
- faixa de preço compatível = +2
- quartos equivalentes = +1
- vagas equivalentes = +1
- características parecidas = +1
- infraestrutura parecida = +1

## 25.7 Seleção final
- ordenar por score
- usar desempate por atualização recente
- retornar top 3 / top 5 / top 10
- excluir imóveis fora da regra de exibição

---

# 26. RLS E ISOLAMENTO NO SUPABASE

## 26.1 Regra
Todas as tabelas multiempresa devem suportar isolamento por `empresa_id`.

## 26.2 Política
- leitura restrita à empresa
- escrita restrita à empresa
- update restrito à empresa
- nenhuma consulta sem escopo de empresa

## 26.3 Importante
Mesmo com Hermes isolado na VPS, o banco também precisa estar isolado logicamente.
O isolamento não pode depender só da aplicação.

---

# 27. AUDITORIA

## 27.1 Tudo que deve gerar log
- chamada ao Hermes
- função escolhida
- ação crítica
- criação de pedido
- movimentação de estoque
- criação de lead
- agendamento de visita
- alteração de status do imóvel
- envio de outbound
- falhas
- retries
- restart de stack
- provisionamento de cliente

## 27.2 Campos mínimos do log
- id
- empresa_id
- actor_type
- actor_id
- action_name
- action_payload
- result_status
- created_at

---

# 28. LOGS E OBSERVABILIDADE

## 28.1 Logs por cliente
Cada cliente deve ter:
- log do Hermes
- log de integração
- log de erro
- log de health check

## 28.2 Estrutura sugerida
```text
/opt/farollwork/clients/empresa_a/logs
/opt/farollwork/clients/empresa_b/logs
```

## 28.3 Health checks
Cada Hermes deve ter:
- endpoint de saúde
- status armazenado
- data/hora da última verificação
- alarme para falha persistente

## 28.4 Alertas mínimos
- Hermes parado
- Hermes sem responder
- falha de envio outbound
- acúmulo de eventos
- falha de autenticação
- falha de storage
- falha de banco

---

# 29. SEGURANÇA OPERACIONAL

## 29.1 Hermes
- sem terminal
- sem browser
- sem internet aberta
- sem file write fora do seu diretório
- sem acesso a outros clientes
- sem root desnecessário

## 29.2 VPS
- usuário administrativo restrito
- firewall configurado
- portas mínimas expostas
- reverse proxy
- TLS
- backups automáticos
- rotação de logs
- restart policy

## 29.3 Secrets
- cada cliente com seu `.env`
- nenhum secret compartilhado
- rotação documentada
- sem secrets hardcoded

---

# 30. BACKUP E RECUPERAÇÃO

## 30.1 O que precisa de backup
- banco no Supabase
- storage crítico
- configuração de `agent_instance`
- envs administrativos
- compose do cliente
- logs importantes
- prompts base

## 30.2 Rotina
- backup diário
- retenção mínima:
  - 7 backups diários
  - 4 backups semanais
  - 3 backups mensais
  - 1 cópia externa (S3 ou equivalente)
- teste periódico de restore

## 30.3 Restore
Deve ser possível:
- restaurar um cliente sem afetar outros
- restaurar dados sem recriar toda a VPS
- restaurar stack do Hermes daquele cliente

---

# 31. DEPLOY SEGURO

## 31.1 Fluxo
1. backup
2. preparar versão
3. rodar migrações compatíveis
4. subir serviço novo
5. health check
6. smoke test
7. ativar
8. rollback se falhar

## 31.2 Regra de migração
- adicionar antes de remover
- evitar breaking changes
- compatibilidade temporária entre versões

## 31.3 Deploy por cliente
Deve existir possibilidade de:
- deploy geral
- deploy seletivo por cliente
- restart seletivo do Hermes de um cliente

---

# 32. TESTES

## 32.1 Unitários
- funções de domínio
- score de recomendação
- normalização de mensagem
- dedupe

## 32.2 Integração
- webhook -> persistência
- persistência -> Hermes
- Hermes -> função interna
- função -> Supabase

## 32.3 E2E
### Comércio
- cliente pergunta produto
- cria pedido
- consulta estoque
- agenda serviço

### Imobiliária
- cliente busca imóvel
- recebe sugestão
- cria lead
- agenda visita
- corretor é notificado

## 32.4 Smoke tests
- health do Hermes
- conexão com Supabase
- envio outbound
- leitura de configuração do cliente

---

# 33. ESTRUTURA DE PROJETO SUGERIDA

```text
/apps
  /web
  /api-internal
  /agent-router
  /hermes-runtime
/packages
  /shared-types
  /shared-utils
  /domain
  /agent-contracts
/infra
  /nginx
  /docker
  /scripts
/docs
  /SDD.md
  /AGENT_PROMPTS.md
  /ENVIRONMENT.md
  /OPERATIONS.md
```

---

# 34. VARIÁVEIS DE AMBIENTE

## 34.1 Frontend
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## 34.2 API interna
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- WHATSAPP_PROVIDER_URL
- WHATSAPP_PROVIDER_TOKEN
- AGENT_ROUTER_SECRET

## 34.3 Hermes por cliente
- EMPRESA_ID
- MODULE_MODE
- AGENT_NAME
- AGENT_INTERNAL_PORT
- AGENT_AUTH_TOKEN
- AGENT_DISABLE_INTERNET=true
- AGENT_DISABLE_TERMINAL=true
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ALLOWED_FUNCTIONS
- PROMPT_PROFILE

---

# 35. CRITÉRIOS DE ACEITAÇÃO

## 35.1 Gerais
- sistema sem n8n
- 1 Hermes por cliente
- Hermes sem comunicação entre si
- dados isolados por empresa
- logs auditáveis
- backup e rollback definidos
- deploy seletivo por cliente

## 35.2 Hermes
- não acessa internet
- não executa terminal
- não gera código
- não usa SQL livre
- só chama funções permitidas
- não acessa outro cliente

## 35.3 Comércio
- produtos funcionam
- estoque funciona
- pedidos funcionam
- agendamento funciona
- financeiro operacional funciona

## 35.4 Imobiliária
- cadastro completo do imóvel funciona
- filtros funcionam
- recomendação funciona
- lead funciona
- visita funciona
- corretor funciona
- status do imóvel respeita regras

---

# 36. SPRINTS

## S1 Fundação
- multi-tenancy
- auth
- tabelas base
- agent_instance
- roteador de Hermes

## S2 Integração WhatsApp
- webhook
- dedupe
- outbound
- persistência

## S3 Infra pesada de agentes
- compose por cliente
- health checks
- logs por cliente
- provisionamento automático

## S4 Módulo Comércio
- produtos
- estoque
- transações
- financeiro básico

## S5 Módulo Imobiliária
- cadastro completo
- filtros
- corretor
- lead
- visita

## S6 Recomendação
- score
- ranking
- refinamento

## S7 Hardening
- segurança
- backup/restore
- smoke tests
- auditoria

---

# 37. RESUMO EXECUTIVO FINAL

O FarollWork deve ser construído como um SaaS com dois módulos claros e uma infraestrutura forte:

- **Comércio em geral** para operação rápida
- **Imobiliária** para operação consultiva rica em filtros

A arquitetura deve usar:
- **Vercel** para o frontend
- **Supabase** como fonte única da verdade
- **VPS** para rodar **um Hermes por cliente**
- **sem n8n**
- **sem comunicação entre Hermes**
- **sem internet aberta para o agente**
- **sem terminal, sem código, sem acesso cruzado**

O resultado esperado é um sistema:
- comercializável
- replicável
- seguro
- auditável
- previsível
- escalável sem bagunça
- pronto para implementação séria
