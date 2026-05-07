# Configuração da Base de Dados
## SmartVolto Portal — MySQL com XAMPP (Local) e Apache (Produção)

---

## PARTE 1: CONFIGURAÇÃO LOCAL (XAMPP)

### Passo 1: Instalar XAMPP

1. Descarrega XAMPP em https://www.apachefriends.org/
2. Escolhe a versão com PHP 8.1+ e MySQL 8.0+
3. Instala com as definições padrão
4. Abre o Painel de Controlo do XAMPP
   - Clica em **Iniciar** para Apache (deve ficar verde)
   - Clica em **Iniciar** para MySQL (deve ficar verde)

### Passo 2: Verifica que o MySQL está em Execução

```bash
# Abre linha de comando/terminal e testa a ligação
mysql -u root -p
# Pressiona Enter (sem palavra-passe, padrão do XAMPP novo)
# Deves ver: mysql>
# Sai com: exit
```

### Passo 3: Cria a Base de Dados e Utilizador

```bash
# Liga-te como root
mysql -u root

# Cria a base de dados
CREATE DATABASE smartvolto_portal_dev;

# Cria um utilizador dedicado (segurança)
CREATE USER 'smartvolto_dev'@'localhost' IDENTIFIED BY 'tua_palavra_passe_segura_aqui';

# Concede permissões
GRANT ALL PRIVILEGES ON smartvolto_portal_dev.* TO 'smartvolto_dev'@'localhost';

# Aplica as alterações
FLUSH PRIVILEGES;

# Verifica
SHOW GRANTS FOR 'smartvolto_dev'@'localhost';

# Sai
exit
```

**Importante**: Substitui `'tua_palavra_passe_segura_aqui'` com uma palavra-passe forte. Guarda-a — vais precisar dela no `.env.local`.

### Passo 4: Configura as Variáveis de Ambiente

Na raiz do projeto, cria ou edita `.env.local`:

```env
# Base de Dados (MySQL Local via XAMPP)
DATABASE_URL="mysql://smartvolto_dev:tua_palavra_passe_aqui@localhost:3306/smartvolto_portal_dev"

# Configuração NextAuth
NEXTAUTH_SECRET="gera-uma-cadeia-aleatoria-com-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (configura depois no Google Cloud Console)
GOOGLE_CLIENT_ID="teu-id-cliente-google"
GOOGLE_CLIENT_SECRET="teu-secret-google"

# Google Workspace Directory API (configura depois)
GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@voltodrive.com"
GOOGLE_WORKSPACE_PRIVATE_KEY="tua-chave-privada-da-conta-servico"
GOOGLE_WORKSPACE_PROJECT_ID="teu-id-projeto"
```

**Gera NEXTAUTH_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copia a saída e cola em NEXTAUTH_SECRET.

### Passo 5: Atualiza o Schema do Prisma

O ficheiro `prisma/schema.prisma` já foi atualizado com:
- Campos de Google Workspace (googleUserId, givenName, familyName, jobTitle, department, etc.)
- Enum UserStatus (ACTIVE, INACTIVE, SUSPENDED, PENDING)
- Índices para performance

Verifica que tem `url = env("DATABASE_URL")` na secção `datasource`.

### Passo 6: Executa a Migração Inicial

```bash
# A partir da raiz do projeto
cd "c:\VoltoDrive Apps\smartvolto portal"

# Gera e executa a migração
npx prisma migrate dev --name init

# Quando pedir um nome para a migração, escreve: init
# Isto vai:
# 1. Criar ficheiros de migração em prisma/migrations/
# 2. Aplicar a migração à base de dados smartvolto_portal_dev
# 3. Gerar o cliente Prisma
```

Verifica se as tabelas foram criadas:
```bash
mysql -u smartvolto_dev -p smartvolto_portal_dev
# Mostra tabelas
SHOW TABLES;
# Deves ver: Account, Announcement, Session, User, Role, VerificationToken
exit
```

### Passo 7: Inicia o Servidor de Desenvolvimento

```bash
npm run dev
```

Abre o browser em http://localhost:3000

Testa a ligação à BD:
```bash
curl http://localhost:3000/api/test-db
```

Resposta esperada:
```json
{
  "status": "connected",
  "users": 0,
  "announcements": 0
}
```

---

## PARTE 2: IMPLEMENTAR DADOS DE TESTE (Opcional)

### Cria o Ficheiro de Seed

Cria `prisma/seed.ts`:

```typescript
import { PrismaClient, UserStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpa dados existentes
  await prisma.announcement.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Cria utilizadores de teste
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ricardo@voltodrive.com',
        name: 'Ricardo Oliveira',
        givenName: 'Ricardo',
        familyName: 'Oliveira',
        jobTitle: 'Diretor Executivo',
        department: 'Gestão',
        isAdmin: true,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sofia@voltodrive.com',
        name: 'Sofia Santos',
        givenName: 'Sofia',
        familyName: 'Santos',
        jobTitle: 'Product Manager',
        department: 'Produto',
        isAdmin: false,
        status: UserStatus.ACTIVE,
      },
    }),
  ])

  console.log(`Criados ${users.length} utilizadores`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

### Atualiza package.json

Adiciona a secção de seed:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Executa o Seed

```bash
npx prisma db seed
```

---

## PARTE 3: IMPLEMENTAÇÃO EM PRODUÇÃO (smartvolto.voltodrive.com)

### Pré-requisitos
- Acesso SSH/painel de controlo do servidor smartvolto.voltodrive.com
- Apache com mod_rewrite ativado
- MySQL 8.0+ instalado no servidor
- Node.js 18+ instalado no servidor
- Domínio já apontado para o IP do servidor no DNS

### Passo 1: Cria a Base de Dados de Produção

Liga-te ao servidor via SSH:
```bash
ssh utilizador@smartvolto.voltodrive.com
```

Conecta-te ao MySQL e cria a BD de produção:
```bash
mysql -u root -p
# Introduz a tua palavra-passe de root do servidor

# Cria a base de dados de produção
CREATE DATABASE smartvolto_portal_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Cria utilizador dedicado de produção
CREATE USER 'smartvolto_prod'@'localhost' IDENTIFIED BY 'palavra_passe_forte_produca_aqui';

# Concede permissões
GRANT ALL PRIVILEGES ON smartvolto_portal_prod.* TO 'smartvolto_prod'@'localhost';
FLUSH PRIVILEGES;

# Verifica
SHOW GRANTS FOR 'smartvolto_prod'@'localhost';
exit
```

### Passo 2: Configura o Diretório da Aplicação

```bash
# Navega até à raiz web (ajusta conforme o teu host)
cd /var/www/

# Clone o projeto
git clone https://github.com/voltodrive/smartvolto-portal.git smartvolto
# OU faz upload via SFTP

cd smartvolto

# Instala dependências
npm install --production

# Compila a aplicação Next.js
npm run build
```

### Passo 3: Cria o Ficheiro de Ambiente de Produção

Cria `.env.production.local` no servidor:

```env
# Base de Dados (MySQL de Produção)
DATABASE_URL="mysql://smartvolto_prod:palavra_passe_forte_produca_aqui@localhost:3306/smartvolto_portal_prod"

# NextAuth
NEXTAUTH_SECRET="gera-outra-cadeia-aleatoria-de-32-caracteres"
NEXTAUTH_URL="https://smartvolto.voltodrive.com"

# Google OAuth
GOOGLE_CLIENT_ID="teu-id-cliente-google-producao"
GOOGLE_CLIENT_SECRET="teu-secret-google-producao"

# Google Workspace
GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@voltodrive.com"
GOOGLE_WORKSPACE_PRIVATE_KEY="tua-chave-privada"
GOOGLE_WORKSPACE_PROJECT_ID="teu-id-projeto"

# Environment
NODE_ENV="production"
```

### Passo 4: Executa a Migração de Produção

```bash
# A partir de /var/www/smartvolto
npx prisma migrate deploy

# Isto aplica todas as migrações à BD de produção sem gerar novas
```

### Passo 5: Configura o VirtualHost do Apache

Cria/atualiza a configuração do Apache:

```bash
sudo nano /etc/apache2/sites-available/smartvolto.voltodrive.com.conf
```

Adiciona a configuração:
```apache
<VirtualHost *:80>
    ServerName smartvolto.voltodrive.com
    ServerAlias www.smartvolto.voltodrive.com
    ServerAdmin admin@voltodrive.com

    # Redireciona HTTP para HTTPS
    Redirect permanent / https://smartvolto.voltodrive.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName smartvolto.voltodrive.com
    ServerAlias www.smartvolto.voltodrive.com
    ServerAdmin admin@voltodrive.com

    DocumentRoot /var/www/smartvolto/.next/static

    # Configuração SSL (usa Let's Encrypt)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/smartvolto.voltodrive.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/smartvolto.voltodrive.com/privkey.pem

    # Ativa mod_rewrite
    <Directory /var/www/smartvolto>
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ http://localhost:3000%{REQUEST_URI} [P,QSA]
    </Directory>

    # Proxy para a aplicação Node.js (porta 3000)
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/ nocanon
    ProxyPassReverse / http://localhost:3000/

    # Headers de segurança
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"

    # Ativa compressão
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
    </IfModule>

    ErrorLog ${APACHE_LOG_DIR}/smartvolto.voltodrive.com-error.log
    CustomLog ${APACHE_LOG_DIR}/smartvolto.voltodrive.com-access.log combined
</VirtualHost>
```

Ativa o site e módulos necessários:
```bash
sudo a2ensite smartvolto.voltodrive.com.conf
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod ssl
sudo a2enmod headers
sudo a2enmod deflate

# Testa a configuração do Apache
sudo apache2ctl configtest
# Deve retornar: Syntax OK

# Reinicia Apache
sudo systemctl restart apache2
```

### Passo 6: Configura Certificado SSL (Let's Encrypt)

```bash
# Instala Certbot
sudo apt-get install certbot python3-certbot-apache

# Obtém o certificado
sudo certbot certonly --apache -d smartvolto.voltodrive.com -d www.smartvolto.voltodrive.com

# Segue as instruções para verificar o domínio
# O certificado será instalado em:
# /etc/letsencrypt/live/smartvolto.voltodrive.com/

# Configura renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Passo 7: Inicia a Aplicação Next.js (Recomenda-se PM2)

Instala PM2 globalmente:
```bash
npm install -g pm2
```

Cria ficheiro PM2 em `/var/www/smartvolto/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'smartvolto-portal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/smartvolto',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/smartvolto/error.log',
    out_file: '/var/log/smartvolto/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

Inicia a aplicação:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Verifica se está em execução
pm2 status
```

### Passo 8: Verifica a Implementação de Produção

Testa a aplicação:
```bash
# Verifica se a API responde
curl -I https://smartvolto.voltodrive.com/

# Esperado: HTTP/2 200
```

Visita no browser: https://smartvolto.voltodrive.com/api/test-db

---

## PARTE 4: BACKUP E MANUTENÇÃO

### Backups Automáticos (Produção)

Cria script de backup em `/var/www/smartvolto/backup-bd.sh`:

```bash
#!/bin/bash
DIRETORIO_BACKUP="/var/backups/smartvolto"
DATA=$(date +%Y%m%d_%H%M%S)
NOME_BD="smartvolto_portal_prod"
UTILIZADOR_BD="smartvolto_prod"

mkdir -p $DIRETORIO_BACKUP

# Faz backup da base de dados
mysqldump -u $UTILIZADOR_BD -p -h localhost $NOME_BD | gzip > $DIRETORIO_BACKUP/smartvolto_$DATA.sql.gz

# Mantém apenas backups dos últimos 30 dias
find $DIRETORIO_BACKUP -name "smartvolto_*.sql.gz" -mtime +30 -delete

echo "Backup concluído: $DIRETORIO_BACKUP/smartvolto_$DATA.sql.gz"
```

Torna executável e adiciona ao crontab:
```bash
chmod +x /var/www/smartvolto/backup-bd.sh

# Agenda backup diário às 2 da manhã
crontab -e
# Adiciona: 0 2 * * * /var/www/smartvolto/backup-bd.sh
```

### Monitoriza o Tamanho da BD

```bash
mysql -u smartvolto_prod -p smartvolto_portal_prod
# Verifica o tamanho
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS tamanho_mb
FROM information_schema.tables
WHERE table_schema = 'smartvolto_portal_prod';
exit
```

---

## PARTE 5: CHECKLIST DE TESTES LOCAL

- [ ] MySQL em execução no XAMPP
- [ ] `.env.local` configurado com DATABASE_URL
- [ ] `npx prisma migrate dev` concluído com sucesso
- [ ] Tabelas criadas: `mysql -u smartvolto_dev -p smartvolto_portal_dev -e "SHOW TABLES;"`
- [ ] `npm run dev` começa sem erros
- [ ] http://localhost:3000 carrega sem erros na consola
- [ ] http://localhost:3000/api/test-db retorna contagens de utilizadores/anúncios
- [ ] Todas as ligações de navegação funcionam na app
- [ ] Dados simulados aparecem corretamente

---

## PARTE 6: CHECKLIST DE IMPLEMENTAÇÃO EM PRODUÇÃO

- [ ] BD de produção criada e utilizador configurado
- [ ] `.env.production.local` adicionado ao servidor (não em git)
- [ ] `npm install --production && npm run build` concluído
- [ ] `npx prisma migrate deploy` bem-sucedido
- [ ] VirtualHost do Apache configurado
- [ ] Certificado SSL obtido via Let's Encrypt
- [ ] Módulos do Apache ativados (rewrite, proxy, ssl, headers)
- [ ] ecosystem.config.js do PM2 criado e iniciado
- [ ] https://smartvolto.voltodrive.com acessível
- [ ] Backups da BD automatizados via cron
- [ ] Logs do servidor monitorizados para erros

---

## Resolução de Problemas

### Erro "Connection refused"
- O MySQL está em execução? (deve estar verde no XAMPP)
- Verifica DATABASE_URL em `.env.local`
- Windows: Verifica se a porta 3306 não está bloqueada pela firewall

### Erro "Table doesn't exist"
- Executa novamente: `npx prisma migrate dev`
- Verifica: `npx prisma generate`

### Erro "Permission denied" em produção
- Verifica propriedade dos ficheiros: `sudo chown -R www-data:www-data /var/www/smartvolto`
- Verifica permissões: `chmod 755 /var/www/smartvolto`

### NextAuth falha em produção
- Verifica NEXTAUTH_URL coincide com o domínio: `https://smartvolto.voltodrive.com`
- NEXTAUTH_SECRET deve ter 32+ caracteres
- Google OAuth deve ter as URLs de produção autorizadas na Google Cloud Console

---

## Próximos Passos

1. ✅ Completa a configuração local (Passos 1-7)
2. ✅ Testa operações da BD
3. ✅ Implementa em produção seguindo Parte 3
4. ✅ Configura backups automáticos
5. ⏳ Integração com Google Workspace (quando estiver pronto)
6. ⏳ Implementar toggle de modo escuro
7. ⏳ Implementar página de Diretório de Pessoas
