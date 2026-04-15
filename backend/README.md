# FarollWork Backend

Sistema de gestão empresarial via WhatsApp - Backend FastAPI.

## Stack

- **Backend**: FastAPI + PostgreSQL + SQLAlchemy 2 + Alembic
- **Autenticação**: JWT com business_id e roles
- **Multi-tenant**: 1 negócio = 1 business + seus usuários

## Instalação

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edite .env com suas configurações de banco
```

## Rodar

```bash
uvicorn app.main:app --reload --port 8000
```

## Estrutura

```
backend/
├── app/
│   ├── main.py          # FastAPI app
│   ├── config.py        # Configurações
│   ├── database.py      # Conexão PostgreSQL
│   ├── models/          # Modelos SQLAlchemy
│   ├── schemas/         # Schemas Pydantic
│   ├── api/             # Rotas da API
│   ├── core/            # Segurança, deps
│   └── services/        # uazapi integration
├── alembic/             # Migrations
└── uploads/             # Arquivos上传
```

## API Endpoints

### Auth
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/recovery` - Recuperação de senha
- `POST /api/v1/auth/logout` - Logout

### Recursos
- `GET/POST /api/v1/business` - Negócio
- `GET/POST /api/v1/contacts` - Contatos
- `GET/POST /api/v1/products` - Produtos
- `GET/POST /api/v1/inventory` - Estoque
- `GET/POST /api/v1/transactions` - Transações
- `GET/POST /api/v1/financial` - Financeiro
- `GET/POST /api/v1/suppliers` - Fornecedores
- `GET/POST /api/v1/partners` - Parceiros
- `GET/POST /api/v1/quote-requests` - Orçamentos
- `GET/POST /api/v1/corretors` - Corretores
- `GET/POST /api/v1/expense-categories` - Categorias de despesa
- `GET/POST /api/v1/uazapi/config` - Config uazapi

### Upload
- `POST /api/v1/upload/image` - Upload de imagem
- `POST /api/v1/upload/product-images/{id}` - Imagens de produto
- `POST /api/v1/upload/bulk` - Importação em massa (JSON)

### Webhook
- `POST /fw/webhook/{business_id}` - Webhook uazapi
- `GET /fw/webhook/{business_id}/status` - Status do webhook

### Busca
- `GET /api/v1/search/properties` - Busca de imóveis

## uazapi Integration

O sistema integra com uazapiGO para envio de mensagens WhatsApp:

```python
# Configuração por business
uazapi = UazapiService(db, business_id)
result = await uazapi.send_text("55XXXXXXXXX", "Mensagem")
```

## Rate Limiting (Anti-bloqueio)

- Máximo 3 mensagens por batch
- Intervalo dinâmico: 30s inicial, sobe para 45s+ se necessário
- Aplica a todas as mensagens

## Deploy

```bash
# Nginx config (proxy para FastAPI na porta 8000)
location /fw/api/ {
    proxy_pass http://127.0.0.1:8000/api/;
}

location /fw/webhook/ {
    proxy_pass http://127.0.0.1:8000/fw/webhook/;
}
```
