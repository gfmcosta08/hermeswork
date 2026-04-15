# FarollWork VPS Setup Script
# Executar como: powershell -File setup-vps.ps1

param(
    [string]$VPSHost = "193.203.174.173",
    [string]$VPSUser = "root",
    [string]$Domain = "farollwork.com",
    [string]$DBPassword = "",
    [string]$JWTSecret = ""
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FarollWork VPS Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Gerar senhas se nao fornecidas
if (-not $DBPassword) {
    $DBPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "DB Password gerado: $DBPassword" -ForegroundColor Yellow
}

if (-not $JWTSecret) {
    $JWTSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "JWT Secret gerado: $JWTSecret" -ForegroundColor Yellow
}

$sshCmd = "ssh -o StrictHostKeyChecking=no ${VPSUser}@${VPSHost}"

# Atualizar sistema
Write-Host "[>>>] Atualizando sistema..." -ForegroundColor Cyan
& $sshCmd "apt update && apt upgrade -y"

# Instalar dependencias
Write-Host "[>>>] Instalando dependencias..." -ForegroundColor Cyan
& $sshCmd @"
apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib certbot python3-certbot-nginx git
"@

# Configurar PostgreSQL
Write-Host "[>>>] Configurando PostgreSQL..." -ForegroundColor Cyan
& $sshCmd @"
sudo -u postgres psql -c "CREATE DATABASE hermeswork;"
sudo -u postgres psql -c "CREATE USER farolluser WITH PASSWORD '${DBPassword}';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hermeswork TO farolluser;"
sudo -u postgres psql -d hermeswork -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
"@

# Criar usuario do sistema
Write-Host "[>>>] Criando usuario..." -ForegroundColor Cyan
& $sshCmd @"
useradd -m -s /bin/bash farollwork || true
usermod -aG www-data farollwork
"@

# Criar diretorios
Write-Host "[>>>] Criando estrutura de diretorios..." -ForegroundColor Cyan
& $sshCmd @"
mkdir -p /var/www/farollwork
mkdir -p /var/www/farollwork/uploads
mkdir -p /var/www/farollwork/backups
mkdir -p /var/www/farollwork/logs
chown -R farollwork:www-data /var/www/farollwork
chmod -R 775 /var/www/farollwork
"@

# Configurar Nginx
Write-Host "[>>>] Configurando Nginx..." -ForegroundColor Cyan
$nginxConfig = @"
server {
    listen 80;
    server_name ${Domain} www.${Domain};

    client_max_body_size 20M;

    location / {
        root /var/www/farollwork/static;
        try_files \$uri \$uri/ /index.html;
    }

    location /fw/ {
        proxy_pass http://127.0.0.1:8000/fw/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        alias /var/www/farollwork/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
"@

& $sshCmd "echo '$nginxConfig' > /etc/nginx/sites-available/farollwork"
& $sshCmd "ln -sf /etc/nginx/sites-available/farollwork /etc/nginx/sites-enabled/"
& $sshCmd "rm -f /etc/nginx/sites-enabled/default"
& $sshCmd "nginx -t && systemctl reload nginx"

# Criar .env
Write-Host "[>>>] Criando arquivo .env..." -ForegroundColor Cyan
$envContent = @"
DATABASE_URL=postgresql+asyncpg://farolluser:${DBPassword}@localhost:5432/hermeswork
SECRET_KEY=${JWTSecret}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
UAZAPI_DEFAULT_URL=https://farollbr.uazapi.com
UAZAPI_MAX_BATCH_SIZE=3
UAZAPI_INITIAL_INTERVAL=30
UAZAPI_MAX_INTERVAL=60
"@

& $sshCmd "echo '$envContent' > /var/www/farollwork/.env"
& $sshCmd "chown farollwork:www-data /var/www/farollwork/.env && chmod 600 /var/www/farollwork/.env"

# Configurar systemd service
Write-Host "[>>>] Configurando servico systemd..." -ForegroundColor Cyan
$serviceContent = @"
[Unit]
Description=FarollWork API
After=network.target postgresql.service

[Service]
Type=simple
User=farollwork
WorkingDirectory=/var/www/farollwork
EnvironmentFile=/var/www/farollwork/.env
ExecStart=/var/www/farollwork/venv/bin/gunicorn app.main:app --bind 127.0.0.1:8000 --workers 4 --timeout 120
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"@

& $sshCmd "echo '$serviceContent' > /etc/systemd/system/farollwork.service"
& $sshCmd "systemctl daemon-reload"
& $sshCmd "systemctl enable farollwork"

# Setup Python venv
Write-Host "[>>>] Configurando Python virtualenv..." -ForegroundColor Cyan
& $sshCmd @"
cd /var/www/farollwork
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
"@

# HTTPS com Let's Encrypt
Write-Host "[>>>] Configurando HTTPS..." -ForegroundColor Cyan
& $sshCmd "certbot --nginx -d ${Domain} -d www.${Domain} --non-interactive --agree-tos -m admin@${Domain}"

# Clone do repo (vai pedir token)
Write-Host "[>>>] Baixando codigo..." -ForegroundColor Cyan
Write-Host "Voce precisara fornecer o token GitHub quando solicitado" -ForegroundColor Yellow
& $sshCmd @"
cd /var/www/farollwork
git clone https://github.com/seu-user/farollwork-api.git .
git checkout main
"@

# Iniciar servico
Write-Host "[>>>] Iniciando servico..." -ForegroundColor Cyan
& $sshCmd "systemctl start farollwork && sleep 5 && systemctl status farollwork --no-pager"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup concluido!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Salve estas informacoes:"
Write-Host "  Database: hermeswork" -ForegroundColor Yellow
Write-Host "  DB User: farolluser" -ForegroundColor Yellow
Write-Host "  DB Password: $DBPassword" -ForegroundColor Yellow
Write-Host "  JWT Secret: $JWTSecret" -ForegroundColor Yellow
Write-Host ""
Write-Host "Proximos passos:"
Write-Host "  1. Configure o webhook do uazapi para: https://${Domain}/fw/webhook/" -ForegroundColor Cyan
Write-Host "  2. Acesse o painel em: https://${Domain}/fw/" -ForegroundColor Cyan
