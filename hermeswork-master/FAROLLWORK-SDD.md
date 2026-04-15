# FAROLLWORK — SDD (System Design Document)

**Versão:** 1.0
**Data:** 2026-04-14
**Autor:** Costa + Hermes
**Status:** COMPLETO — Pronto para implementação

---

## 1. CONCEITO E VISÃO

### 1.1 O que é o FarollWork

Sistema de gestão empresarial automatizado via WhatsApp. Funciona como um "funcionário digital" que nunca dorme — atende clientes, gerencia agenda, controla estoque, processa orçamentos e muito mais, tudo através de conversas no WhatsApp.

### 1.2 Diferencial

Não é um sistema tradicional onde o usuário precisa abrir um aplicativo e navegar por menus. No FarollWork, o gestor conversa com o sistema como se estivesse conversando com um empregado eficiente. O cliente final também interage via WhatsApp naturalmente, sem precisar baixar nada.

### 1.3 Arquitetura Geral

Cada cliente possui sua própria infraestrutura isolada:

```
┌─────────────────────────────────────────────────────────┐
│                    VPS DO CLIENTE                        │
│                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌───────────┐ │
│   │  WhatsApp   │◄──►│   Hermes    │◄──►│ PostgreSQL│ │
│   │  uazapi     │    │  (cérebro)  │    │  (banco)  │ │
│   └─────────────┘    └─────────────┘    └───────────┘ │
│                            │                            │
│                     ┌──────┴──────┐                     │
│                     │  FarollWork  │                     │
│                     │  (Web Panel) │                     │
│                     └─────────────┘                     │
└─────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │                                    │
         │ Costa acessa pra manutenção        │ Cliente acessa pro uso
         │ (SSH + Admin)                      │ (Gestor + Web)
```

---

## 2. STACK TECNOLÓGICA

### 2.1 Componentes

| Componente | Tecnologia | Função |
|------------|-----------|--------|
| Backend | Hermes (Python/Node.js) | Processamento de mensagens, lógica de negócio |
| Banco de dados | PostgreSQL | Persistência de todos os dados |
| Mensagens | uazapiGO V2 | Conexão WhatsApp Business |
| Web Panel | FarollWork (React/Vue ou similar) | Interface visual de gestão |
| Infraestrutura | VPS (1 por cliente) | Hospedagem self-hosted |

### 2.2 Autenticação uazapiGO

Cada instância precisa de:

```
serverUrl: https://{subdomain}.uazapi.com
instanceToken: {token_da_instancia}
webhookUrl: https://api.farollwork.com/webhook/{cliente_id}
phone: {numero_whatsapp_conectado}
```

### 2.3 Conexão Webhook

- FarollWork fornece URL do webhook
- uazapi envia todas as mensagens recebidas para esse endpoint via POST
- Hermes processa e responde através da API da uazapi

---

## 3. MODELO DE DADOS (PostgreSQL)

### 3.1 Diagrama de Entidade-Relacionamento

```
business (1) ──┬── (N) contact
               ├── (N) product
               ├── (N) inventory
               ├── (N) transaction
               ├── (N) supplier
               ├── (N) partner
               ├── (N) financial_entry
               ├── (N) corretor (se segmento = imobiliária)
               └── (N) property_feature (se imóvel)

contact ────────┬── (N) transaction (customer)
                └── (N) quote_response (se fornecedor/parceiro)

product ────────┬── (N) product_component ── inventory
                ├── (N) transaction_item
                └── (N) property_feature (se imóvel)

transaction ────┬── (N) transaction_item
                └── (N) financial_entry
```

### 3.2 Tabelas Detalhadas

#### business
```sql
CREATE TABLE business (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    segment VARCHAR(100) NOT NULL, -- alimentacao, oficina, imobiliario, etc
    config JSONB DEFAULT '{}',
    -- config guarda: horario_funcionamento, dias_abertos, agendamento_tipo, etc
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Segmentos suportados:**
- `alimentacao` — pizzaria, padaria, lanchonete
- `oficina` — mecânica, elétrica
- `estetica` — salão, manicure
- `imobiliario` — imobiliária
- `distribuidora` — atacarejo, vendas
- `outro` — genérico

**Config padrão:**
```json
{
    "horario_funcionamento": "08:00-18:00",
    "dias_abertos": ["monday","tuesday","wednesday","thursday","friday","saturday"],
    "agendamento_tipo": "gestor", -- "automatico" ou "gestor"
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "notificacoes": {
        "estoque_baixo": true,
        "orcamento_respondido": true,
        "novo_cliente": true,
        "agendamento_pendente": true,
        "pagamento_pendente": true
    }
}
```

---

#### contact
```sql
CREATE TABLE contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    whatsapp_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL, -- cliente, gestor, fornecedor, parceiro, corretor
    name VARCHAR(255),
    segment VARCHAR(100), -- categoria (ex: peças_moto, películas)
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    UNIQUE(business_id, whatsapp_number)
);
```

**Tipos de contato:**
- `cliente` — pessoa que compra/agenda
- `gestor` — dono/responsável pelo negócio
- `fornecedor` — empresa que fornece materiais/pecas
- `parceiro` — empresa que faz serviços complementares
- `corretor` — corretor de imóveis (sempre que segment = imobiliario)

---

#### product
```sql
CREATE TABLE product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    type VARCHAR(50) NOT NULL, -- produto_estoque, produto_final, servico, mao_de_obra
    category VARCHAR(100), -- categoria do produto
    unit VARCHAR(50), -- un, kg, litro, hora, servico
    description TEXT,
    has_inventory_link BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    images JSONB DEFAULT '[]', -- URLs das imagens
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Para segmento imobiliario, campos extras em product:
-- type = 'imovel'
-- category = casa|apartamento|sobrado|kitnet|loft|comercial|residencial|terreno|outro
-- status = disponivel|reservado|vendido|vendido_externo|alugado
-- price = valor de venda ou aluguel
```

**Tipificação de produto:**
- `produto_estoque` — item que vem do estoque (celular, peça)
- `produto_final` — item que não vincula ao estoque (pizza, almoço)
- `servico` — serviço prestado (corte, instalação)
- `mao_de_obra` — mão de obra sem material (consulta, revisão)
- `imovel` — propriedade (segmento imobiliário)

---

#### product_component
```sql
CREATE TABLE product_component (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES product(id),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    quantity_needed DECIMAL(10,3) NOT NULL, -- quanto consome por venda
    cost_at_time DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Usado quando has_inventory_link = true**

---

#### inventory
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50), -- kg, un, litro, pacote, etc
    quantity DECIMAL(10,3) DEFAULT 0,
    purchase_price DECIMAL(12,2), -- preço de compra (por unidade)
    min_threshold DECIMAL(10,3) DEFAULT 0, -- alerta quando abaixo
    location VARCHAR(100), -- deposito, balcão, etc
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### inventory_movement
```sql
CREATE TABLE inventory_movement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id),
    type VARCHAR(50) NOT NULL, -- entrada, saida, ajuste
    quantity DECIMAL(10,3) NOT NULL, -- positivo ou negativo
    reason VARCHAR(100), -- compra, venda, perda, quebra, contagem, ajuste
    notes TEXT,
    date_created TIMESTAMP DEFAULT NOW()
);
```

**Fluxo:**
- Manager compra material: type=entrada, quantity=+10, reason=compra
- Venda consome estoque: type=saida, quantity=-2, reason=venda
- Quebra/estrago: type=saida, quantity=-1, reason=perda
- Contagem real: type=ajuste, quantity pode ser + ou -

---

#### transaction
```sql
CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    customer_id UUID NOT NULL REFERENCES contact(id),
    type VARCHAR(50) NOT NULL, -- agendamento, pedido, encomenda, pergunta
    status VARCHAR(50) NOT NULL DEFAULT 'pendente', -- pendente, confirmado, cancelado, concluido
    date_created TIMESTAMP DEFAULT NOW(),
    date_scheduled TIMESTAMP, -- data/hora agendada
    date_completed TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    -- metadata pode guardar: observacoes, como_cliente_soube, etc
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### transaction_item
```sql
CREATE TABLE transaction_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transaction(id),
    product_id UUID NOT NULL REFERENCES product(id),
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    price_at_time DECIMAL(12,2) NOT NULL, -- preço no momento da venda
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### supplier (fornecedor)
```sql
CREATE TABLE supplier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    contact_id UUID REFERENCES contact(id), -- link pro contact
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    segment VARCHAR(100), -- categoria de produtos que fornece
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### partner (parceiro comercial)
```sql
CREATE TABLE partner (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    contact_id UUID REFERENCES contact(id),
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    segment VARCHAR(100), -- serviço que oferece
    commission DECIMAL(5,2), -- % de comissão
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### quote_request
```sql
CREATE TABLE quote_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    type VARCHAR(50) NOT NULL, -- fornecedor, parceiro
    description TEXT NOT NULL, -- o que está sendo solicitado
    status VARCHAR(50) DEFAULT 'aguardando', -- aguardando, parcial, completo
    date_created TIMESTAMP DEFAULT NOW(),
    deadline TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

#### quote_response
```sql
CREATE TABLE quote_response (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id UUID NOT NULL REFERENCES quote_request(id),
    contact_id UUID NOT NULL REFERENCES contact(id), -- fornecedor ou parceiro
    price DECIMAL(12,2),
    availability VARCHAR(100), -- disponivel, indisponivel, prazo
    message TEXT, -- mensagem adicional do fornecedor
    attachments JSONB DEFAULT '[]', -- URLs de fotos/PDFs anexos
    date_received TIMESTAMP DEFAULT NOW()
);
```

---

#### financial_entry
```sql
CREATE TABLE financial_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    transaction_id UUID REFERENCES transaction(id), -- nullable
    type VARCHAR(50) NOT NULL, -- receita, despesa
    amount DECIMAL(12,2) NOT NULL, -- em centavos
    description TEXT,
    category VARCHAR(100), -- alimentacao, mao_obra, material, diarista, imovel_venda, imovel_comissao, outro
    payment_method VARCHAR(50), -- dinheiro, pix, cartao_credito, cartao_debito
    date_created TIMESTAMP DEFAULT NOW(),
    confirmed BOOLEAN DEFAULT false,
    installments BOOLEAN DEFAULT false, -- é parcelamento?
    total_installments INTEGER DEFAULT 1,
    installment_number INTEGER DEFAULT 1,
    parent_entry_id UUID REFERENCES financial_entry(id), -- entry principal se parcelado
    due_date DATE,
    paid_date DATE
);
```

**Categorias de despesa:**
- `mao_obra` — salários, inúmerário
- `material` — compra de insumos/materiais
- `alimentacao` — despesas com alimentação
- `diarista` — serviço de diarista
- `imovel_venda` — receita de venda de imóvel
- `imovel_comissao` — comissão de corretor
- `outro` — категория livre

---

#### corretor (imobiliário)
```sql
CREATE TABLE corretor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    contact_id UUID NOT NULL REFERENCES contact(id),
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    commission_rate DECIMAL(5,2) DEFAULT 0, -- % de comissão
    sales_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

#### property_feature (imóvel)
```sql
CREATE TABLE property_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES product(id), -- produto do tipo imovel
    key VARCHAR(100) NOT NULL,
    value VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Exemplos de features:**
```
area: "85m²"
quartos: "3"
suites: "2"
banheiros: "2"
vagas_garagem: "2"
piso: "3º andar de 15"
portaria_24h: "sim"
piscina: "não"
endereco: "Rua X, 123, Bairro Y"
bairro: "Centro"
cidade: "São Paulo"
cep: "01234-567"
iptu: "R$500/mês"
condominio: "R$350/mês"
caracteristicas: ["piso frio", "ventilador teto", "sacada"]
```

---

#### expense_category
```sql
CREATE TABLE expense_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- fixa, variavel
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

#### user (sistema de login)
```sql
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES business(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'gestor', -- admin, gestor
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Observações:**
- Admin = Costa (criado na instalação da VPS)
- Gestor = cliente final
- Cada business tem 1 admin + N gestores

---

### 3.3 Índices

```sql
CREATE INDEX idx_contact_business ON contact(business_id);
CREATE INDEX idx_contact_whatsapp ON contact(whatsapp_number);
CREATE INDEX idx_contact_type ON contact(type);
CREATE INDEX idx_product_business ON product(business_id);
CREATE INDEX idx_product_type ON product(type);
CREATE INDEX idx_inventory_business ON inventory(business_id);
CREATE INDEX idx_transaction_business ON transaction(business_id);
CREATE INDEX idx_transaction_status ON transaction(status);
CREATE INDEX idx_transaction_date ON transaction(date_created);
CREATE INDEX idx_financial_business ON financial_entry(business_id);
CREATE INDEX idx_financial_date ON financial_entry(date_created);
CREATE INDEX idx_financial_type ON financial_entry(type);
```

---

## 4. FLUXOS DE NEGÓCIO

### 4.1 Identificação de Contato

**Primeira mensagem de alguém:**
```
1. Hermes recebe mensagem via webhook
2. Consulta contact por whatsapp_number
3. Se não existe → cria novo contact (type = cliente)
4. Responde: "Olá! Aqui é da [Nome do Negócio]. Como posso te ajudar?"
```

**Mensagens seguintes:**
```
1. Hermes identifica contato
2. Responde personalizado: "Olá [Nome], em que posso ajudar?"
```

**Como Hermes sabe quem é gestor/fornecedor/parceiro:**
- Costa cadastra manualmente via Web Panel
- Ou gestor cadastra via WhatsApp: "Cadastra fornecedor: Zé Peças, 1199999999"
- Contact type fica salvo永久mente

---

### 4.2 Gestão de Estoque

**Dois modos de operação:**

#### Modo 1: Vinculado (eletrônicos, peças)
- Product tem `has_inventory_link = true`
- Manager cadastra product + product_components (quais inventory entram)
- Venda: sistema calcula consumo do estoque automaticamente

#### Modo 2: Solto (pizzaria, padaria)
- Product não vincula ao estoque
- Manager atualiza estoque manualmente
- Venda: só registra valor no financeiro, sem baixa de estoque

**Comandos via WhatsApp:**

```
ADICIONAR ITEM:
Gestor: Adicionar farinha ao estoque
Hermes: Quantidade atual?
Gestor: 10 pacotes
Hermes: Unidade de medida?
Gestor: pacotes
Hermes: Preço de compra por pacote (opcional)?
Gestor: R$25
Hermes: Alerta quando baixar de (quantidade mínima)?
Gestor: 3
Hermes: ✅ Estoque criado:
       Farinha | 10 pacotes | Mín: 3 | R$25/un
       Como quer registrar? (entrada/manual/compra)

ATUALIZAR QUANTIDADE:
Gestor: Baixou 2 pacotes de farinha
Hermes: ✅ Farinha: 10 → 8 pacotes
       Movimento registrado: saída de 2

OUTRO EXEMPLO:
Gestor: Comprei 5 pacotes de farinha
Hermes: ✅ Farinha: 8 → 13 pacotes
       Movimento registrado: entrada de 5 por compra

CONSULTAR:
Gestor: Quanto farinha tenho?
Hermes: Farinha: 13 pacotes (mínimo: 3)
        Status: OK

GESTor: Meu estoque
Hermes: Farinha: 13 pacotes
        Açúcar: 8 kg (mínimo: 5)
        Óleo: 4 litros (mínimo: 2)
        STATUS: Açúcar baixo!

ALERTA AUTOMÁTICO:
Hermes: ⚠️ Alerta de estoque:
        Açúcar: 3kg (mínimo 5kg)
        Ação recomendada: comprar mais
```

---

### 4.3 Disparo de Orçamentos

**Fluxo completo:**

```
1. Gestor manda: "EMS, pede orçamento pro fornecedor Ze, João, Marcio"
2. Hermes verifica: quantos fornecedores? (3 = OK, 6 = divide em batches)
3. Hermes inicia primeiro batch de 3
4. Intervalo dinâmico: 30s → 45s+ (sobe se necessário)
5. Fornecedor responde quando quiser
6. Hermes detecta resposta (via webhook)
7. Hermes notifica gestor: "[Fornecedor] respondeu: [conteúdo completo]"
8. Anexos (fotos, PDF) são preservados e encaminhados

LIMITE: Máximo 3 por vez
INTERVALO: Dinâmico (nunca fixo, sempre variável)
APLICA A: TODAS as mensagens (cliente, fornecedor, parceiro, gestor)
```

**Exemplo de resposta:**

```
Hermes: 📬 Respostas recebidas:

• Ze Peças: R$180 (disponível)
• João Autopeças: R$165 (prazo 3 dias)
• Marcio Parts: Sem interesse

Melhor opção: João Autopeças — R$165
```

---

### 4.4 Módulo Imobiliário

**Cadastro de imóvel (via Web Panel):**

```
Campos:
- Nome/Título: "Apt 2 quartos na Afonso Pena"
- Tipo: apartamento
- Finalidade: venda | aluguel
- Preço: R$450.000 | R$1.500/mês
- Status: disponível
- Endereço completo
- Fotos: galeria de até 20 imagens
- Features: área, quartos, suites, banheiros, garagem, etc
- Descrição do corretor: texto livre
```

**Busca por cliente (via WhatsApp):**

```
Cliente: Procuro apartamento com 2 quartos, zona sul, até 1500 de aluguel
Hermes: Vou procurar...

📋 Encontrei 4 imóveis com esse perfil:

1. Apt. 2q, 65m², Garagem 1 — R$1.200/mês
2. Apt. 2q, 72m², Suite, Garagem 2 — R$1.400/mês
3. Apt. 2q, 60m², Garagem 1 — R$1.100/mês
4. Casa 2q, 80m², Garagem 2 — R$1.500/mês

Como quer ver os detalhes?
[1] Link dos imóveis
[2] Descrição completa + fotos (envio em sequência)
[3] Só o primeiro
```

**Envio de detalhes com fotos (intervalo dinâmico):**

```
Cliente: [2] Descrição completa + fotos

Hermes: 📍 Apt. 2q, 72m², Suite, Garagem 2 — R$1.400/mês

Endereço: Rua das Flores, 456, Bairro Alto
Área: 72m² | Quartos: 2 | Suites: 1 | Banheiros: 2
Garagem: 2 vagas
Condomínio: R$350 | IPTU: R$600/ano

Descrição do corretor:
"Apartamento arejado, sol da manhã, próximo a mercado."

📷 [Foto 1] 📷 [Foto 2] 📷 [Foto 3]

[Aguarda intervalo dinâmico...]

📍 Apt. 2q, 65m² — R$1.200/mês
...
```

**Máximo 2-3 imóveis por batch, intervalo dinâmico, fotos preservadas.**

---

**Agendamento de visita:**

```
Cliente: Gostei do imóvel 2 e 5
Hermes: Quer agendar uma visita?
Cliente: Sim
Hermes: Vou procurar um corretor disponível...

📢 Novo lead!
Cliente: Maria (1199999999)
Interessado em: Apt 2q, 72m², R$1.400
Código: IMOV-2024-003

Seu corretor Carlos entrará em contato em breve.
```

**Corretor recebe via WhatsApp** (mensagem com dados do lead)

---

**Venda realizada:**

```
Gestor vai no Web Panel:
→ Seleciona imóvel → "Registrar venda"
→ Corretor: Carlos
→ Valor: R$450.000
→ Comissão: R$13.500 (calculada automático)
→ Pago ao corretor: [sim/não]

Sistema cria:
- financial_entry (receita) = R$450.000
- financial_entry (despesa) = R$13.500 (comissão)
- product.status = 'vendido'
- corretor.sales_count +1
```

**Venda externa (sem corretor do imobiliário):**

```
Gestor: "Esse imóvel foi vendido por fora"
→ Status: vendido_externo
→ Sem comissão
→ Imóvel sai da lista de disponíveis
```

---

### 4.5 Upload Bulk (Importação em Massa)

**Formatos suportados:**
- Imagem (foto nota fiscal) — AI Vision extrai texto
- PDF (nota fiscal, catálogo) — OCR + AI Vision
- Excel (.xlsx, .xls) — parsing direto
- CSV — parsing direto
- JSON — parsing direto

**Canais:**
- WhatsApp: cliente envia arquivo + comando "cadastra isso"
- Web Panel: botão "Importar" + seleção de arquivo

**Fluxo:**

```
1. Arquivo recebido
2. Sistema identifica tipo (imagem/PDF/Excel/CSV/JSON)
3. Extração de dados:
   - Imagem/PDF → AI Vision extrai texto/tabelas
   - Excel/CSV → parsing de colunas
4. AI interpreta e mapeia campos:
   - Nome do produto
   - Preço (venda e custo se disponível)
   - Unidade (un, kg, litro)
   - Quantidade (se nota fiscal)
5. Preview mostrado ao gestor
6. Gestor confirma
7. Sistema cria todos os registros
8. Retorna relatório do que foi criado
```

**Conflict handling:**

```
Hermes: ⚠️ "Pizza Mussarela" já existe.
     Sistema atual: R$42
     PDF/Imagem: R$45
     
     [1] Atualizar para R$45
     [2] Manter R$42
     [3] Ignorar
     [4] Criar como diferente
```

**Casos de uso:**
- Cadastro inicial: cliente envia planilha com todos produtos
- Dia a dia: cliente envia nota fiscal → cadastra produtos novos
- Atualização estoque: cliente envia planilha de compra

---

### 4.6 Transações

**Tipos:**
- `agendamento` — cliente agenda horário (serviço)
- `pedido` — cliente faz pedido (produto)
- `encomenda` — cliente encomenda (produção sob medida)
- `pergunta` — cliente pergunta algo

**Status:**
```
pendente → confirmado → concluido
                ↓
            cancelado
```

**Fluxo de agendamento (duas modos):**

```
MODO AUTOMÁTICO:
1. Cliente: "Quero agendar às 14h"
2. Hermes verifica disponibilidade
3. Hermes confirma direto: "✅ Agendado para hoje às 14h com Maria"
4. Gestor é notificado (se configurado)

MODO GESTOR:
1. Cliente: "Quero agendar às 14h"
2. Hermes: "Aguardando confirmação do gestor"
3. Hermes notifica gestor: "📅 Novo agendamento: Cliente Maria, hoje 14h"
4. Gestor confirma → Hermes avisa cliente: "✅ Agendamento confirmado"
5. Gestor recusa → Hermes avisa cliente: "❌ Agendamento cancelado"
```

---

### 4.7 Financeiro

**Entrada de dinheiro (receita):**

```
来源:
- Transaction concluída (venda, serviço)
- Venda de imóvel (imovel_venda)
- Comissão de parceiro (se houver)

Quando pago:
- No ato (pix, dinheiro, cartão)
- Entrada + parcelamento

Exemplo parcelamento:
Compra TV R$2000, entrada R$500, resto em 3x
→ entry principal: amount=200000, installments=true, total=3
→ entry 1/3: amount=50000, installment_number=1, parent=entry_principal
→ entry 2/3: amount=50000, installment_number=2, parent=entry_principal
→ entry 3/3: amount=50000, installment_number=3, parent=entry_principal
```

**Saída de dinheiro (despesa):**

```
来源:
- Compra de material/estoque
- Pagamento a fornecedores
- Comissão de corretor (imovel_comissao)
- diarista (serviço temporário)
- despesa customizada que gestor lança manualmente

Gestor pode lançar despesa a qualquer momento:
"EMS, contratei diarista hoje, R$150"
→ Cria financial_entry type=despesa, category=diarista, amount=15000
```

**Categorias de despesa:**
```
- mao_obra: salários, kerum
- material: compra insumos/materiais
- alimentacao: despesas com alimentação
- diarista: serviço de diarista (não recorrente)
- imovel_venda: receita de venda
- imovel_comissao: comissão de corretor
- outro: categoria livre
```

**Fechamento de caixa:**

```
Gestor: "EMS, fechar caixa hoje"
Hermes:
💰 Fechamento de Caixa — 14/04/2026

📈 ENTRADAS: R$450,00 (12 vendas)
📉 SAÍDAS: R$120,00 (3 despesas)
💵 SALDO: R$330,00

Detalhe por forma de pagamento:
• PIX: R$280,00
• Dinheiro: R$100,00
• Crédito: R$50,00
• Débito: R$20,00

Detalhe por categoria:
• Vendas: R$400,00
• Encomendas: R$50,00

Deseja confirmar fechamento? (sim/nao)
```

**Relatórios:**

```
Gestor pode pedir:
- "EMS, relatório do dia"
- "EMS, relatório semanal"
- "EMS, relatório do mês"
- "EMS, relatório por produto"
- "EMS, relatório de despesas"

Hermes gera com:
- Total receitas / despesas / lucro
- Breakdown por categoria
- Breakdown por método pagamento
- Comparativo com período anterior
```

---

## 5. SISTEMA DE NOTIFICAÇÕES

### 5.1 Canais

- **WhatsApp:** mensagem direta para o gestor
- **Web Panel:** notificação visual no painel

### 5.2 Regras por Tipo

| Evento | Notifica? | Canal |
|--------|-----------|-------|
| Estoque baixo | ✅ Sempre | WhatsApp + Web |
| Orçamento respondido | ✅ Sempre | WhatsApp + Web |
| Novo cliente | Só se agendamento requer confirmação | WhatsApp |
| Agendamento pendente | Só se modo = gestor | WhatsApp + Web |
| Pagamento pendente | ✅ Sempre | WhatsApp + Web |
| Despesa recorrente | ❌ Não | Gestor lança manualmente |
| Lead de imóvel (imobiliário) | ✅ Sempre | WhatsApp |

### 5.3 Configuração

```
Config do business (config JSON):
{
    "notificacoes": {
        "estoque_baixo": true,       -- se false, não notifica
        "orcamento_respondido": true,
        "novo_cliente": true,
        "agendamento_pendente": true,
        "pagamento_pendente": true
    },
    "agendamento_tipo": "gestor"  -- ou "automatico"
}
```

**Estoque baixo:**
- Trigger: quantity < min_threshold
- Sempre notifica, não tem toggle (é informação crítica)

**Pagamento pendente:**
- Trigger: entrada recebida, resta parcela
- Notifica sempre

---

## 6. IDENTIDADE VISUAL

### 6.1 Nome

**FarollWork** — junção de Faroll (marca) + Work (trabalho/gestão)

### 6.2 Logo

Farol em aquarela estilo vintage/lúdico (fornecido por Costa)

### 6.3 Paleta de Cores

| Cor | HEX | Uso |
|-----|-----|-----|
| Amarelo Luz | #FCE382 | Luz do farol, destaques |
| Verde-Amarelo | #E4E982 | Lanterna, badges positive |
| Coral/Rosa | #DF8B82 | Farol, botões secondary |
| Cinza Claro | #DFE0E5 | Backgrounds, cards |
| Cinza Escuro | #2A2A2A | Texto, header |
| Ocre/Dourado | #D59846 | Sol, valores, money |
| Turquesa | #86C9CD | Mar, botões primary |
| Azul-Petróleo | #65B1B7 | Links, informações |
| Azul/Cinza Pastel | #CAD5DD | Backgrounds suaves |
| Marrom Terra | #9E7452 | Barco, detalhes vintage |

### 6.4 Aplicação

- **Web Panel:** Header com logo + nome "FarollWork"
- **Botões:** Primário em turquesa, secundário em coral
- **Cartões:** Background cinza claro, bordas suaves
- **Mensagens:** WhatsApp usa emojis nos tons da paleta
- **Relatórios:** Headers em ocre/dourado
- **Favicon:** Farol estilizado

---

## 7. SEGURANÇA E INFRAESTRUTURA

### 7.1 Autenticação (Login)

- Email + senha (obrigatório)
- Recuperação de senha via email (token expira 1h)
- Sessão com JWT (expira em 7 dias)
- Logout força em todos dispositivos
- Opcional: 2FA via WhatsApp
- Opcional: Login via Google (OAuth)

### 7.2 Senhas

- Hash bcrypt, nunca plain text
- Mínimo 8 caracteres
- Rate limit: 5 tentativas → bloqueia 15min

### 7.3 HTTPS

- Certificado Let's Encrypt (automático)
- Todos os endpoints em HTTPS

### 7.4 Backups

```
Horário: 3:00 da manhã (configurável)
Manutenção: últimos 3 backups (3 dias rolling)

Conteúdo:
- Dump PostgreSQL (.sql.gz)
- Pasta uploads/ (arquivos)
- Configurações do sistema

Local: /backups na VPS
Opcional: sync com cloud (Google Drive, S3)
```

### 7.5 Upload de Arquivos

```
Tamanho máximo: 10MB por arquivo

Formatos:
- Imagens: JPG, PNG, WebP
- Documentos: PDF
- Planilhas: XLSX, XLS, CSV
- Outros: JSON

Imagens:
- Compactação automática (80% qualidade JPEG)
- Thumbnail 300x300px para preview
- Redimensionamento se > 2000px largura

Galeria de imóveis:
- Até 20 fotos por imóvel
- Compactação automática
- Preserva qualidade no envio ao cliente
```

---

## 8. DEPLOY PIPELINE

### 8.1 Fluxo

```
[Local Costa] → GitHub → [VPS Staging] → [VPS Cliente/Produção]
```

### 8.2 Desenvolvimento Local

```
1. Costa desenvolve no computador local
2. Testa localmente
3. Push para GitHub (repo privado farollwork-api)
4. Branch: develop (teste) / main (produção)
```

### 8.3 Staging (VPS de Costa ou local)

```
1. Merge na branch develop
2. GitHub webhook dispara deploy pra VPS staging
3. Costa testa tudo
4. Se OK → merge na main → deploy produção
```

### 8.4 Produção (VPS do Cliente)

**ANTES de qualquer update → BACKUP AUTOMÁTICO:**

```
1. Hermes conecta na VPS do cliente via SSH
2. Faz dump completo do PostgreSQL
3. Copia arquivos do sistema
4. Compacta e salva em /backups
5. SÓ DEPOIS faz o deploy
```

**Deploy com ZERO DOWNTIME:**

```
1. Para serviços (move tráfego)
2. Baixa novo código do GitHub
3. Migra banco se necessário (só adiciona, nunca remove)
4. Sobe serviços novamente
5. Testa se está rodando
6. Marca como OK
```

**Se der problema → ROLLBACK INSTANTÂNEO:**

```
1. Restaura PostgreSQL do backup
2. Restaura arquivos do backup
3. Volta versão anterior
4. Cliente nem percebe
```

### 8.5 Proteção do Banco

```
REGRAS FUNDAMENTAIS:
- NUNCA altera ou apaga dados existentes
- Migration só ADICIONA colunas/tabelas (nunca remove)
- Todas as alterações são revertíveis
- Backup + rollback = garantia total
```

### 8.6 Versionamento

```
- Cada cliente pode ter versão específica
- Costa controla qual versão cada cliente roda
- Não força update se cliente não quiser
- Changelog disponível pra cliente ver o que mudou
```

---

## 9. ESTRUTURA DE ACESSOS

### 9.1 Tipos de Acesso

```
ACESSO COSTA (root/admin):
├── Via SSH (terminal da VPS)
├── Via Web Panel (admin, todas as configurações)
├── Acesso a todos os clientes (por VPS)
└── Master key criado na instalação

ACESSO CLIENTE (gestor):
├── Via WhatsApp (Hermes)
├── Via Web Panel (gestor, dados do DELE)
├── Login: email + senha
└── Não afetado quando Costa faz manutenção
```

### 9.2 Fluxo de Acesso Inicial

```
1. Costa recebe VPS nova
2. Costa instala/configura tudo (SSH, PostgreSQL, Hermes, FarollWork)
3. Costa cria login ADMIN (dele)
4. Costa cria login GESTOR (cliente)
5. Cliente acessa com login DELE
6. Costa acessa com admin quando precisa manter
```

### 9.3 Segurança

```
- Costa SEMPRE tem acesso admin (não depende da senha do cliente)
- Se cliente muda senha, Costa continua acessando via admin
- Todas as ações são logadas (audit trail)
```

---

## 10. WEB PANEL

### 10.1 Telas Principais

```
Dashboard
├── Resumo do dia (vendas, despesas, lucro)
├── Alertas (estoque baixo, agendamentos pendentes)
├── Atalhos rápidos

Negócio (configurações)
├── Dados da empresa (nome, segmento, logo)
├── Horário de funcionamento
├── Configurações de WhatsApp (uazapi credentials)
├── Notificações (on/off por tipo)

Produtos
├── Lista de produtos
├── Cadastrar/editar produto
├── Vincular ao estoque (sim/não)
├── Galeria de fotos (se imóvel)

Estoque
├── Lista de itens
├── Cadastrar/editar item
├── Movimentações (histórico)
├── Alertas configurados

Transações
├── Lista de transações
├── Filtros (status, data, tipo)
├── Detalhes de cada transação

Financeiro
├── Entradas e saídas
├── Fechamento de caixa
├── Relatórios (dia/semana/mês/produto)
├── Lançar despesa manual

Contatos
├── Lista de contatos (clientes, fornecedores, parceiros)
├── Cadastrar/editar contato
├── Ver histórico de interações

Orçamentos
├── Solicitações pendentes
├── Respostas recebidas
├── Disparar orçamento (selecionar fornecedores)

Imobiliário (se segment = imobiliario)
├── Imóveis cadastrados
├── Status (disponível/reservado/vendido)
├── Corretores cadastrados
├── Leads recebidos
├── Vendas registradas

Upload Bulk
├── Selecionar arquivo (imagem/PDF/Excel/CSV)
├── Preview do que será importado
├── Confirmar importação

Configurações de Conta
├── Alterar senha
├── Email
├── Nome
├── 2FA (opcional)
```

### 10.2 Layout Visual

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo FarollWork]              [Notificações] [Usuário] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Sidebar]                                                  │
│  📊 Dashboard                                               │
│  🏪 Negócio                                                │
│  📦 Produtos                                               │
│  🗃️ Estoque                                               │
│  📋 Transações                                             │
│  💰 Financeiro                                             │
│  👥 Contatos                                               │
│  📨 Orçamentos                                             │
│  🏠 Imobiliário (se aplicável)                             │
│  📤 Upload Bulk                                            │
│  ⚙️ Configurações                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Cores:**
- Sidebar: Cinza escuro #2A2A2A
- Background: Cinza claro #DFE0E5
- Botão primário: Turquesa #86C9CD
- Botão secundário: Coral #DF8B82
- Texto: Cinza escuro #2A2A2A

---

## 11. ENDPOINTS DA API (FarollWork)

### 11.1 Webhook (recebe mensagens da uazapi)

```
POST /webhook/{cliente_id}
Headers: Content-Type: application/json
Body: JSON payload da uazapi

Responde: 200 OK (acknowledgement)
```

### 11.2 Autenticação

```
POST /auth/login
Body: { email, password }
Response: { token, user }

POST /auth/recovery
Body: { email }
Response: { message: "Email enviado" }

POST /auth/reset
Body: { token, new_password }

POST /auth/logout
Headers: Authorization: Bearer {token}
```

### 11.3 CRUD Recursos

```
GET/POST /business
GET/PUT /business/{id}

GET/POST /contacts
GET/PUT/DELETE /contacts/{id}

GET/POST /products
GET/PUT/DELETE /products/{id}

GET/POST /inventory
GET/PUT/DELETE /inventory/{id}
POST /inventory/movement

GET/POST /transactions
GET/PUT/DELETE /transactions/{id}
POST /transactions/{id}/confirm
POST /transactions/{id}/cancel

GET/POST /financial
GET/POST /financial/report

POST /suppliers
POST /partners
POST /quote-request
POST /upload-bulk
```

---

## 12. CONFIGURAÇÃO UAZAPI (instância)

```
Instance Name: farollwork_{cliente_id}
ServerUrl: https://farollbr.uazapi.com
Token: {instance_token}
WebhookUrl: https://api.farollwork.com/webhook/{cliente_id}

Numéro conectado: {whatsapp_number}

webhook Eventos ativados:
- message (mensagens recebidas)
- connection (status da conexão)
```

---

## 13. LIMITE DE MENSAGENS (Anti-bloqueio)

```
REGRA: MÁXIMO 3 mensagens por batch
INTERVALO: Dinâmico (inicia em 30s, sobe para 45s+ se necessário)

APLICA A TODAS as mensagens:
- Envio pra fornecedor
- Envio pra parceiro comercial
- Resposta pra cliente
- Notificação pro gestor
- Envio de fotos/anexos

NUNCA intervalo fixo — sempre dinâmico
Se Meta identificar padrão, intervalo sobe automaticamente
```

---

## 14. PENDENTE / TBD

```
✅ Conceito — DEFINIDO
✅ Stack — DEFINIDO
✅ Modelo de dados — DEFINIDO
✅ uazapi — DEFINIDO (credenciais de instância)
✅ Fluxos de negócio — DEFINIDOS
✅ Upload Bulk — DEFINIDO
✅ Financeiro — DEFINIDO
✅ Onboarding Gestor — DEFINIDO
✅ Notificações — DEFINIDO
✅ Deploy Pipeline — DEFINIDO
✅ Identidade Visual — DEFINIDO
✅ Segurança — DEFINIDA
✅ Acesso — DEFINIDO
✅ Web Panel — DEFINIDO

⏳ Teste de integração com uazapi (implementação)
⏳ Script de deploy (implementação)
⏳ Teste de webhook (implementação)
```

---

## 15. PRÓXIMOS PASSOS

```
1. Criar repo GitHub (farollwork-api, farollwork-panel)
2. Setup PostgreSQL na VPS staging
3. Implementar modelo do banco (migrations)
4. Implementar Hermes (webhook receiver + processador)
5. Implementar API endpoints básicos
6. Testar integração com uazapi (webhook + send message)
7. Implementar Web Panel básico
8. Testar fluxo completo (webhook → Hermes → uazapi → cliente)
9. Setup deploy pipeline
10. Testar em staging antes de ir pra produção
```

---

**FIM DO SDD**

Documento completo e minucioso para implementação do FarollWork.
Versão 1.0 — 14/04/2026
