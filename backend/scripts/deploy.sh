#!/bin/bash
# FarollWork Deploy Script para Linux/Mac
# Execute: chmod +x deploy.sh && ./deploy.sh

set -e

VPS_HOST="${VPS_HOST:-193.203.174.173}"
VPS_USER="${VPS_USER:-root}"
BRANCH="${BRANCH:-main}"
SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_MIGRATION="${SKIP_MIGRATION:-false}"

echo "========================================"
echo "  FarollWork Deploy Script"
echo "========================================"
echo "Host: $VPS_HOST"
echo "Branch: $BRANCH"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${CYAN}[>>>]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[X]${NC} $1"; }

# SSH command
SSH_CMD="ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST}"

# Backup
if [ "$SKIP_BACKUP" != "true" ]; then
    info "Criando backup..."

    $SSH_CMD << 'EOF'
        cd /var/www/farollwork
        mkdir -p backups
        tar -czf backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz app/ uploads/ .env 2>/dev/null || true
        echo "Backup criado"
EOF

    success "Backup criado"
fi

# Update code
info "Atualizando codigo..."
$SSH_CMD "cd /var/www/farollwork && git pull origin ${BRANCH}"
success "Codigo atualizado"

# Install deps
info "Instalando dependencias..."
$SSH_CMD << 'EOF'
    cd /var/www/farollwork
    source venv/bin/activate
    pip install -r requirements.txt --quiet
EOF
success "Dependencias instaladas"

# Migration
if [ "$SKIP_MIGRATION" != "true" ]; then
    info "Executando migrations..."
    $SSH_CMD "cd /var/www/farollwork && alembic upgrade head"
    success "Migrations executadas"
fi

# Restart service
info "Reiniciando servico..."
$SSH_CMD "systemctl restart farollwork && sleep 3"
success "Servico reiniciado"

# Health check
info "Verificando health..."
HEALTH=$($SSH_CMD "curl -s http://localhost:8000/health" 2>/dev/null || echo "")

if echo "$HEALTH" | grep -q "healthy"; then
    success "API respondendo: $HEALTH"
else
    warn "API pode nao estar respondendo"
fi

echo ""
echo "========================================"
echo "  Deploy concluido!"
echo "========================================"
echo ""
echo "URLs:"
echo "  API: http://${VPS_HOST}/fw/api/v1/"
echo "  Webhook: http://${VPS_HOST}/fw/webhook/{business_id}"
