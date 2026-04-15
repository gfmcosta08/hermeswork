# Scripts de Deploy

## Scripts Disponíveis

### setup-vps.ps1
Setup inicial de uma VPS nova com FarollWork.
```powershell
.\setup-vps.ps1 -VPSHost "193.203.174.173" -VPSUser "root" -Domain "seudominio.com"
```

### deploy.ps1
Deploy do código para VPS (pull + migrate + restart).
```powershell
.\deploy.ps1 -VPSHost "193.203.174.173" -VPSUser "root" -Branch "main"
```

Opções:
- `-SkipBackup` - Pula o backup
- `-SkipMigration` - Pula as migrations

### rollback.ps1
Rollback para um backup específico.
```powershell
.\rollback.ps1 -VPSHost "193.203.174.173" -VPSUser "root" -BackupFile "backup-20240115-143022.tar.gz"
```

### deploy.sh
Script Bash para Linux/Mac.
```bash
chmod +x deploy.sh
./deploy.sh
```

## Variáveis de Ambiente

Para não digitar sempre os parâmetros:
```bash
export VPS_HOST="193.203.174.173"
export VPS_USER="root"
export BRANCH="main"
./deploy.sh
```

## Pré-requisitos (Windows)

```powershell
choco install git putty
```

## Estrutura de Backups

Os backups são salvos em `/var/www/farollwork/backups/` no formato:
```
backup-YYYYMMDD-HHMMSS.tar.gz
```

Para listar backups:
```bash
ssh root@193.203.174.173 "ls -la /var/www/farollwork/backups/"
```

## Testes

Executar testes de integração:
```bash
cd backend
pip install -r requirements-test.txt
pytest tests/integration/test_uazapi_integration.py -v
```

## Fluxo de Deploy

1. Costa faz push no GitHub (branch main)
2. SSH na VPS ou executa script local
3. Script faz:
   - Backup do estado atual
   - Pull do código novo
   - pip install das dependências
   - Alembic migrations
   - Restart do systemd service
   - Health check
4. Se tudo OK, deploy concluído
5. Se problema, executar rollback.ps1
