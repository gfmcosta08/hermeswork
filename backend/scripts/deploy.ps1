# FarollWork Deploy Script para VPS
# Executar como: powershell -File deploy.ps1

param(
    [string]$VPSHost = "193.203.174.173",
    [string]$VPSUser = "root",
    [string]$VPSPassword = "",
    [string]$GitHubRepo = "https://github.com/seu-user/farollwork-api.git",
    [string]$Branch = "main",
    [switch]$SkipBackup,
    [switch]$SkipMigration
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FarollWork Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Cores
$SUCCESS = "Green"
$WARNING = "Yellow"
$ERROR = "Red"
$INFO = "Cyan"

function Write-Step {
    param([string]$Message)
    Write-Host "`n[>>>] $Message" -ForegroundColor $INFO
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor $SUCCESS
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $WARNING
}

function Write-Err {
    param([string]$Message)
    Write-Host "[X] $Message" -ForegroundColor $ERROR
}

# Verifica dependencias
Write-Step "Verificando dependencias..."

$deps = @("git", "pscp", "plink")
$missing = @()
foreach ($dep in $deps) {
    $result = Get-Command $dep -ErrorAction SilentlyContinue
    if (-not $result) {
        $missing += $dep
    }
}

if ($missing.Count -gt 0) {
    Write-Warn "Dependencias faltando: $($missing -join ', ')"
    Write-Host "Instale com: choco install $($missing -join ' ')" -ForegroundColor Yellow
}

# Backup
if (-not $SkipBackup) {
    Write-Step "Criando backup..."

    $backupCmd = @"
cd /var/www/farollwork
if [ -d "backups" ]; then
    tar -czf backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz app/ uploads/ .env 2>/dev/null || true
fi
"@

    $sshCmd = "ssh -o StrictHostKeyChecking=no ${VPSUser}@${VPSHost}"
    & $sshCmd $backupCmd

    Write-Success "Backup criado"
}

# Pull do codigo
Write-Step "Atualizando codigo via Git..."

$deployCmd = @"
cd /var/www/farollwork
git pull origin ${Branch}
"@

$sshCmd = "ssh -o StrictHostKeyChecking=no ${VPSUser}@${VPSHost}"
& $sshCmd $deployCmd

Write-Success "Codigo atualizado"

# Instalar dependencias
Write-Step "Instalando dependencias Python..."

$pipCmd = @"
cd /var/www/farollwork
pip install -r requirements.txt --quiet
"@

& $sshCmd $pipCmd

Write-Success "Dependencias instaladas"

# Migracoes
if (-not $SkipMigration) {
    Write-Step "Executando migrations..."

    $migrateCmd = @"
cd /var/www/farollwork
alembic upgrade head
"@

    & $sshCmd $migrateCmd

    Write-Success "Migrations executadas"
}

# Restart do servico
Write-Step "Reiniciando servico..."

$restartCmd = @"
systemctl restart farollwork
sleep 3
systemctl status farollwork --no-pager
"@

& $sshCmd $restartCmd

Write-Success "Servico reiniciado"

# Health check
Write-Step "Verificando health check..."

$healthCheck = Invoke-WebRequest -Uri "http://${VPSHost}/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue

if ($healthCheck.StatusCode -eq 200) {
    Write-Success "API respondendo: $($healthCheck.Content)"
} else {
    Write-Warn "API pode nao estar respondendo corretamente"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deploy concluido!" -ForegroundColor $SUCCESS
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:"
Write-Host "  API: http://${VPSHost}/fw/api/v1/"
Write-Host "  Webhook: http://${VPSHost}/fw/webhook/{business_id}"
Write-Host "  Health: http://${VPSHost}/health"
