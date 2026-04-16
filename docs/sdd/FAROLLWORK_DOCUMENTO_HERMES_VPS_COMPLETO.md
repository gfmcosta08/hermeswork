# FAROLLWORK — DOCUMENTO COMPLETO PARA O HERMES DA VPS
## Preparação completa do ambiente na Hostinger + operação das instâncias por cliente
## Versão 2.0 — Completa, pesada e pronta para execução

---

# 1. OBJETIVO

Este documento define como o ambiente da VPS da Hostinger deve ser preparado e operado para suportar o FarollWork com segurança, isolamento e escalabilidade.

Este documento é destinado ao Hermes que já está rodando na VPS e deve orientar a preparação do ambiente para:

- hospedar múltiplas instâncias Hermes
- manter 1 Hermes por cliente
- impedir comunicação entre Hermes
- permitir provisionamento de novos clientes sem codar manualmente
- expor um contrato consistente para o backend
- manter a VPS organizada para operação comercial

---

# 2. PREMISSAS

Premissas atuais:

- a VPS da Hostinger já existe
- o Hermes já está instalado e funcionando para testes
- ainda não existe provisionamento automatizado por cliente
- o frontend/backend serão construídos pelo Codex
- o objetivo é transformar a VPS em uma base operacional séria para o SaaS

---

# 3. PAPEL DO HERMES ATUAL

O Hermes atualmente instalado na VPS deve ser tratado como:

- assistente de infraestrutura
- operador de preparação do ambiente
- ferramenta de configuração
- apoio técnico de implantação

Ele **não** deve virar o agente compartilhado de todos os clientes.

Regra obrigatória:
- o Hermes atual ajuda a montar o ambiente
- os clientes terão instâncias próprias depois

---

# 4. OBJETIVO FINAL DA VPS

A VPS deve ser preparada para hospedar:

- uma camada principal de infraestrutura
- um provisioner local
- múltiplas stacks Hermes por cliente
- logs separados por cliente
- health checks separados por cliente
- diretórios, envs e volumes isolados

A VPS **não** deve:

- usar um Hermes único para todos os clientes
- misturar memória de clientes
- permitir que Hermes se comuniquem
- expor Hermes diretamente para a internet
- depender de edição manual toda vez que entrar um novo cliente

---

# 5. VISÃO GERAL DA ARQUITETURA

```text
Frontend (Vercel)
        ↓
Backend / API / Agent Router
        ↓
Supabase
        ↓
Provisioner / Infra na VPS
        ↓
Hermes do cliente correto
```

Na VPS, a arquitetura esperada é:

```text
/opt/farollwork
  /infra
  /clients
  /templates
  /logs
```

---

# 6. REGRAS MÁXIMAS DE ISOLAMENTO

Cada cliente deve possuir:

- 1 diretório próprio
- 1 compose próprio
- 1 `.env` próprio
- 1 porta interna própria
- 1 token interno próprio
- 1 volume de dados próprio
- 1 diretório de logs próprio
- 1 prompt profile próprio
- 1 conjunto de funções permitidas próprio

É proibido:

- compartilhar `.env`
- compartilhar diretório de dados
- compartilhar logs
- compartilhar prompt
- compartilhar porta
- compartilhar auth token
- compartilhar memória
- permitir acesso cruzado entre empresas

---

# 7. ESTRUTURA DE DIRETÓRIOS NA VPS

Estrutura recomendada:

```text
/opt/farollwork
  /infra
    /proxy
    /provisioner
    /templates
    /scripts
    /logs
  /clients
    /empresa_a
      /hermes
      /data
      /logs
      /config
      .env
      docker-compose.yml
    /empresa_b
      /hermes
      /data
      /logs
      /config
      .env
      docker-compose.yml
    /empresa_c
      /hermes
      /data
      /logs
      /config
      .env
      docker-compose.yml
```

## 7.1 Significado das pastas

### `/infra/proxy`
Configurações do reverse proxy.

### `/infra/provisioner`
Serviço ou scripts responsáveis pelo provisionamento de novos clientes.

### `/infra/templates`
Templates padrão para:
- `.env`
- `docker-compose.yml`
- prompts
- allowed_functions

### `/infra/scripts`
Scripts administrativos e operacionais.

### `/clients/<empresa>`
Tudo relativo a uma instância de cliente.

---

# 8. STACKS DA VPS

## 8.1 Stack principal de infraestrutura

A stack principal deve conter:

- reverse proxy
- provisioner local
- ferramentas mínimas de observabilidade
- opcionalmente Redis para throttling ou fila simples

Essa stack é única.

## 8.2 Stack Hermes por cliente

Cada cliente deve ter sua própria stack.

Uma stack de cliente deve conter:

- 1 instância Hermes
- 1 volume persistente próprio
- 1 log path próprio
- 1 env file próprio
- restart policy própria

---

# 9. REDE E EXIBIÇÃO DOS SERVIÇOS

## 9.1 Regras

- Hermes do cliente não deve ficar publicamente acessível
- Hermes deve responder apenas por rede interna
- o backend deve ser o único chamador autorizado
- o reverse proxy deve expor apenas o que for necessário
- portas internas não devem ficar abertas para acesso público

## 9.2 Modelo de fluxo

```text
Internet
  ↓
API pública / backend
  ↓
Agent Router
  ↓
Hermes interno da empresa
```

---

# 10. PADRÃO DE PORTAS

Cada cliente deve possuir uma porta interna exclusiva.

Exemplo:

- empresa_a → 3101
- empresa_b → 3102
- empresa_c → 3103
- empresa_d → 3104

Regras:
- nunca reutilizar porta sem controle
- manter tabela interna de alocação
- registrar a porta no banco
- manter coerência entre compose, env e tabela `agent_instance`

---

# 11. VARIÁVEIS DE AMBIENTE POR CLIENTE

Modelo padrão de `.env` por cliente:

```env
EMPRESA_ID=empresa_a
MODULE_MODE=comercio
AGENT_NAME=hermes_empresa_a

AGENT_INTERNAL_PORT=3101
AGENT_AUTH_TOKEN=trocar_por_token_unico

AGENT_DISABLE_INTERNET=true
AGENT_DISABLE_TERMINAL=true

PROMPT_PROFILE=comercio_default
ALLOWED_FUNCTIONS=buscar_produto,listar_produtos,criar_pedido,consultar_estoque,criar_agendamento,buscar_configuracao_empresa

BACKEND_API_URL=http://api-internal:3000
BACKEND_API_TOKEN=trocar_por_token_interno
LOG_LEVEL=info
```

## 11.1 Regras para env
- um `.env` por cliente
- tokens sempre únicos
- não hardcode secrets
- não compartilhar tokens
- manter padrão consistente

---

# 12. PROMPTS DOS CLIENTES

## 12.1 Prompt global
```text
Você é um funcionário digital interno da empresa.
Você só pode agir com base em dados internos da empresa atual, funções autorizadas e regras do sistema.

É proibido:
- acessar internet;
- buscar informações externas;
- gerar, editar ou sugerir código;
- executar comandos;
- acessar terminal;
- acessar outro cliente;
- usar dados fora do empresa_id atual;
- inventar respostas.
```

## 12.2 Prompt do módulo comércio
```text
Você é o atendente operacional digital do módulo Comércio em Geral.
Ajude com produtos, serviços, estoque, pedidos, agendamentos e financeiro operacional.
Seja objetivo, seguro e fiel aos dados do sistema.
```

## 12.3 Prompt do módulo imobiliária
```text
Você é o atendente consultivo digital do módulo Imobiliária.
Ajude com imóveis, filtros, fotos, recomendação de similares, lead, visita, corretor e status do imóvel.
Nunca invente imóveis, preços ou documentação.
```

---

# 13. FUNÇÕES AUTORIZADAS POR MÓDULO

## 13.1 Comércio
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

## 13.2 Imobiliária
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

# 14. FUNÇÕES PROIBIDAS AO HERMES

- executar terminal
- navegar na internet
- usar browser aberto
- editar código
- instalar dependências
- alterar schema
- rodar SQL livre
- acessar arquivos de outro cliente
- chamar outro Hermes
- acessar secrets de outro cliente
- fazer deploy
- fazer git pull/push
- alterar envs fora do seu escopo

---

# 15. CONTRACTO HTTP DO HERMES

Cada instância Hermes deve expor internamente:

- `POST /agent/run`
- `GET /health`

## 15.1 Request padrão
```json
{
  "empresa_id": "empresa_a",
  "module_mode": "comercio",
  "message": "texto do usuário",
  "context": {
    "contact_id": "id",
    "session_id": "id",
    "role": "cliente"
  }
}
```

## 15.2 Response padrão
```json
{
  "response_text": "texto de resposta",
  "intent": "buscar_produto",
  "confidence": 0.91,
  "requested_action": {
    "name": "buscar_produto",
    "params": {
      "query": "pizza"
    }
  },
  "meta": {
    "requires_confirmation": false
  }
}
```

## 15.3 Regras do contrato
- sempre retornar JSON consistente
- nunca executar a mutação direto no banco
- nunca alterar escopo de empresa
- sempre respeitar `module_mode`
- não responder fora do escopo do cliente

---

# 16. HEALTH CHECK

Cada instância Hermes deve possuir:

- endpoint `/health`
- status operacional simples
- resposta rápida
- indicador de ready/degraded/down

## 16.1 Exemplo
```json
{
  "status": "healthy",
  "empresa_id": "empresa_a",
  "agent_name": "hermes_empresa_a",
  "module_mode": "comercio"
}
```

## 16.2 Estados aceitos
- healthy
- degraded
- down

---

# 17. LOGS

Cada cliente deve ter logs separados.

Estrutura sugerida:

```text
/opt/farollwork/clients/empresa_a/logs
/opt/farollwork/clients/empresa_b/logs
```

## 17.1 Tipos de log
- log do Hermes
- log de erro
- log de health
- log de restart
- log de provisionamento

## 17.2 Regras
- não misturar logs entre clientes
- não expor log sensível publicamente
- manter rotação se necessário
- salvar eventos importantes de restart e falha

---

# 18. TEMPLATES DE CLIENTE

A VPS deve possuir templates base para facilitar o provisionamento automático.

## 18.1 Templates mínimos
- template de `.env`
- template de `docker-compose.yml`
- template de prompt profile
- template de allowed_functions por módulo

## 18.2 Benefício
Quando entrar cliente novo, não será necessário escrever tudo do zero.

---

# 19. DOCKER-COMPOSE PADRÃO POR CLIENTE

Exemplo base conceitual:

```yaml
version: "3.9"

services:
  hermes_empresa_a:
    container_name: hermes_empresa_a
    image: hermes-runtime:latest
    restart: unless-stopped
    env_file:
      - .env
    ports:
      - "3101:3101"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config
    networks:
      - farollwork_internal

networks:
  farollwork_internal:
    external: true
```

## 19.1 Regras
- ajustar nome do serviço por cliente
- ajustar porta por cliente
- ajustar env file por cliente
- ajustar volumes por cliente
- nunca compartilhar volumes entre clientes

---

# 20. STACK PRINCIPAL DE INFRAESTRUTURA

Exemplo conceitual do que deve existir fora das stacks dos clientes:

```yaml
version: "3.9"

services:
  reverse_proxy:
    image: nginx:stable
    restart: unless-stopped

  provisioner:
    image: farollwork-provisioner:latest
    restart: unless-stopped

networks:
  farollwork_internal:
    name: farollwork_internal
```

## 20.1 Papel da stack principal
- manter a rede interna
- receber chamadas administrativas
- preparar ambiente
- servir como base da operação

---

# 21. PROVISIONER LOCAL

## 21.1 Objetivo
Criar um componente chamado `provisioner` para automatizar a criação de novos clientes.

## 21.2 O que ele faz
- recebe payload do backend
- valida token interno
- cria diretório do cliente
- copia templates
- gera `.env`
- gera `docker-compose.yml`
- sobe stack
- testa `/health`
- retorna resposta estruturada

## 21.3 Payload esperado
```json
{
  "empresa_id": "empresa_a",
  "module_mode": "comercio",
  "agent_name": "hermes_empresa_a",
  "port": 3101,
  "auth_token": "token_unico",
  "prompt_profile": "comercio_default",
  "allowed_functions": [
    "buscar_produto",
    "listar_produtos"
  ]
}
```

## 21.4 Resposta esperada
```json
{
  "success": true,
  "empresa_id": "empresa_a",
  "internal_url": "http://hermes_empresa_a:3101",
  "health_status": "healthy"
}
```

---

# 22. PROVISIONAMENTO DE NOVO CLIENTE

Fluxo esperado:

1. backend cria empresa
2. backend cria `agent_instance`
3. backend chama provisioner
4. provisioner cria pasta do cliente
5. provisioner copia templates
6. provisioner gera `.env`
7. provisioner define porta e token
8. provisioner sobe stack
9. provisioner valida health
10. backend marca cliente como ativo

## 22.1 Regra crítica
Tudo isso deve acontecer sem necessidade de edição manual de código.

---

# 23. PAUSA, REATIVAÇÃO E RESTART

O provisioner ou scripts auxiliares devem permitir:

- pausar instância do cliente
- reativar instância do cliente
- reiniciar instância do cliente
- consultar status da instância

## 23.1 Isso precisa existir para a tela administrativa
Porque o painel administrativo deve permitir operação amigável para usuário leigo.

---

# 24. SCRIPTS ADMINISTRATIVOS SUGERIDOS

Criar scripts como:

- `create_client_stack.sh`
- `pause_client_stack.sh`
- `resume_client_stack.sh`
- `restart_client_stack.sh`
- `check_client_health.sh`

## 24.1 Objetivo dos scripts
Dar suporte ao provisioner e às operações manuais controladas, sem improviso.

---

# 25. SEGURANÇA DA VPS

## 25.1 Regras mínimas
- não expor portas desnecessárias
- usar reverse proxy
- usar tokens internos
- isolar env por cliente
- manter logs
- limitar permissões de escrita
- aplicar restart policy
- manter backups

## 25.2 Segurança do Hermes
- sem internet aberta
- sem browser
- sem terminal
- sem root desnecessário
- sem acesso a outros clientes
- sem acesso direto ao banco

---

# 26. BACKUP

Devem ser preservados:

- templates
- envs administrativos
- compose por cliente
- logs críticos
- registros de provisionamento
- arquivos de configuração dos clientes

## 26.1 Regra
Deve ser possível restaurar um cliente sem afetar os outros.

---

# 27. INTEGRAÇÃO COM O BACKEND

O backend fará:

- criação da empresa
- criação de `agent_instance`
- chamada do provisioner
- chamada do Hermes por `empresa_id`
- leitura de health status

A VPS deve estar pronta para isso.

## 27.1 Regras
- o backend é o controlador
- o Hermes responde
- o provisioner prepara o ambiente
- o Hermes nunca fala com Vercel
- o Hermes nunca toca no banco diretamente

---

# 28. RELAÇÃO COM O DOCKER MANAGER DA HOSTINGER

A VPS deve ser organizada de forma compatível com o uso do Docker Manager da Hostinger.

## 28.1 Estratégia recomendada
- stack principal criada e mantida
- stack por cliente criada com base em template
- manutenção por projetos separados
- nada de um container único para tudo

## 28.2 Regra operacional
Trabalhar com compose controlado é melhor do que depender de one-click genérico.

---

# 29. CRITÉRIOS DE ACEITAÇÃO

1. A VPS deve suportar múltiplos Hermes, um por cliente
2. Nenhum Hermes pode se comunicar com outro
3. Cada Hermes deve ter porta, token, env e logs próprios
4. O provisionamento deve ser possível sem codar manualmente
5. O backend deve conseguir chamar o Hermes correto
6. Cada Hermes deve responder apenas ao seu `empresa_id`
7. O ambiente deve ficar organizado para onboarding por tela amigável
8. Os templates devem existir
9. O compose por cliente deve existir
10. O health check deve funcionar por cliente

---

# 30. INSTRUÇÃO FINAL PARA O HERMES DA VPS

Prepare a VPS para operar como infraestrutura de produção do FarollWork, com:

- múltiplas instâncias Hermes
- 1 Hermes por cliente
- isolamento total entre clientes
- provisionamento automático baseado em template
- endpoint `/agent/run`
- endpoint `/health`
- organização por diretório
- stacks independentes
- sem internet aberta para agentes de clientes
- sem terminal para agentes de clientes
- sem comunicação entre Hermes

Não transforme o Hermes atual em agente compartilhado.
Use o Hermes atual apenas para ajudar a estruturar o ambiente e automatizar a operação da VPS.
