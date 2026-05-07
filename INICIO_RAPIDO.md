# Início Rápido: Configuração Local da Base de Dados

## Configuração em 5 Minutos (XAMPP)

### 1. Inicia o XAMPP
- Abre o Painel de Controlo do XAMPP
- Clica em **Iniciar** para Apache (deve ficar verde)
- Clica em **Iniciar** para MySQL (deve ficar verde)

### 2. Cria o Utilizador da BD
```bash
mysql -u root
CREATE DATABASE smartvolto_portal_dev;
CREATE USER 'smartvolto_dev'@'localhost' IDENTIFIED BY 'sua_palavra_passe';
GRANT ALL PRIVILEGES ON smartvolto_portal_dev.* TO 'smartvolto_dev'@'localhost';
FLUSH PRIVILEGES;
exit
```

### 3. Configura as Variáveis de Ambiente
Copia `.env.example` para `.env.local` e atualiza:
```env
DATABASE_URL="mysql://smartvolto_dev:sua_palavra_passe@localhost:3306/smartvolto_portal_dev"
NEXTAUTH_SECRET="gera-com-este-comando-abaixo"
NEXTAUTH_URL="http://localhost:3000"
```

Gera NEXTAUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Executa a Migração
```bash
npx prisma migrate dev --name init
```

### 5. Inicia o Servidor
```bash
npm run dev
```

Abre http://localhost:3000

---

## Verifica a Ligação

Testa a BD:
```bash
curl http://localhost:3000/api/test-db
```

Resposta esperada:
```json
{"status": "connected", "users": 0, "announcements": 0}
```

---

## Resolução Rápida de Problemas

| Problema | Solução |
|----------|---------|
| "Connection refused" | MySQL está a correr? Verde no XAMPP? |
| "Table doesn't exist" | `npx prisma migrate dev` novamente |
| Porta 3000 ocupada | `npm run dev -- -p 3001` |
| Palavra-passe incorreta | Verifica DATABASE_URL em `.env.local` |

---

## Próximos Passos

1. ✅ Configuração local concluída
2. ⏳ Implementar toggle de modo escuro
3. ⏳ Criar página de Diretório de Pessoas
4. ⏳ Integração com Google Workspace
5. ⏳ Deploy em produção (smartvolto.voltodrive.com)

---

## Documentação Completa

Para instruções detalhadas sobre produção, backups, e resolução de problemas:
→ Vê **CONFIGURACAO_BD.md**
