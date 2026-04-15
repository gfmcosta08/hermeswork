# FarollWork Rollback Script
# Executar como: powershell -File rollback.ps1 -BackupFile backup-20240115-143022.tar.gz

param(
    [string]$VPSHost = "193.203.174.173",
    [string]$VPSUser = "root",
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  FarollWork Rollback" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Parar servico
Write-Host "[>>>] Parando servico..." -ForegroundColor Cyan
$sshCmd = "ssh -o StrictHostKeyChecking=no ${VPSUser}@${VPSHost}"
& $sshCmd "systemctl stop farollwork"

# Restaurar backup
Write-Host "[>>>] Restaurando backup: $BackupFile" -ForegroundColor Cyan
$restoreCmd = @"
cd /var/www/farollwork
tar -xzf backups/${BackupFile} -C /
"@

& $sshCmd $restoreCmd

# Reiniciar servico
Write-Host "[>>>] Reiniciando servico..." -ForegroundColor Cyan
& $sshCmd "systemctl start farollwork && sleep 3 && systemctl status farollwork --no-pager"

Write-Host ""
Write-Host "[OK] Rollback concluido!" -ForegroundColor Green
