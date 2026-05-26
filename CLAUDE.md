# Volto Smart Portal — Contexto para Desenvolvimento

Portal intranet da VoltoDrive (voltosmart.voltodrive.com). Acesso restrito a emails @voltodrive.com.

## Stack

- **Next.js 15** (App Router, RSC) + **TypeScript**
- **NextAuth v5** (auth.js beta) — JWT strategy, Google OAuth
- **Prisma 7** com `@prisma/adapter-mariadb` — MariaDB via Unix socket
- **Tailwind CSS v4** + shadcn/ui (components.json)
- **Tiptap** — editor de rich text (Manual)
- **Google APIs** — Calendar, Drive, Gmail, Tasks, Admin Directory (Workspace sync)
- **Deploy**: GitHub Actions → FTP → cPanel Passenger Node.js

## Estrutura de ficheiros relevantes

```
src/
  app/
    page.tsx              # Root → redireciona para /home
    login/                # Página de login Google
    api/
      auth/               # NextAuth handlers + /reauthorize
      admin/              # Todas as rotas de gestão (protegidas por isAdmin)
      calendar/           # Events, shared calendars
      docs/               # Drive file browsing
      tasks/              # Google Tasks
      home/indicators/    # KPIs do hero (Drive quota, Calendar, Gmail, Tasks)
      people/             # Diretório de colaboradores
      manual/             # CRUD de artigos + importação PDF (Anthropic)
      announcements/      # Feed de anúncios
      tools/              # Smart Tools (HTML embeds)
      dashboard/widgets/  # Widgets configuráveis do dashboard

  components/
    portal/
      app-shell.tsx       # Layout principal: sidebar + topbar + slot de conteúdo
      sidebar.tsx         # Navegação lateral (seções por role)
      home.tsx            # Dashboard: hero indicators + widgets
      feed.tsx            # Anúncios
      people.tsx          # Diretório
      calendar.tsx        # Agenda pessoal e calendários partilhados
      docs.tsx            # Google Drive browser
      manual/             # Manual operações (árvore de categorias + editor Tiptap)
      tools.tsx           # Smart Tools
      admin/              # Painéis de administração

  lib/
    prisma.ts             # Singleton Prisma — socket MariaDB via MARIADB_SOCKET_PATH
    google-oauth.ts       # getGoogleOAuth2(userId) — lê/persiste tokens da tabela Account
    audit.ts              # Registo de auditoria (AuditLog)
    manual-seed-data.ts   # Dados para seed do manual (usado por /api/admin/seed-manual)
    directory/            # Sync Google Workspace → BD (mock-provider como fallback dev)

  auth.ts                 # NextAuth config Node runtime (inclui DB queries na session callback)
  auth.config.ts          # NextAuth config Edge (middleware) — sem Prisma

prisma/
  schema.prisma           # Schema completo

scripts/
  db/                     # SQL de init/backup
  *.mjs                   # Scripts de seed e manutenção (correr localmente)
  env-production-template.txt

server.js                 # Entry point Passenger (lê .env.production, arranca Next.js)
```

## Autenticação e autorização

- Login exclusivo por Google OAuth (@voltodrive.com)
- `session callback` em `src/auth.ts` — consulta a BD em **cada request** autenticado para obter `isAdmin`, `roleId`, `sections`
- `isAdmin = true` → acesso total; caso contrário, `role.sections` define o que é visível
- `src/auth.config.ts` corre em Edge (middleware) — sem Prisma, só verifica se está autenticado e se o path é público

## Tokens Google (Calendar, Drive, etc.)

- Armazenados na tabela `Account` (campo `access_token`, `refresh_token`, `scope`)
- `getGoogleOAuth2(userId)` em `src/lib/google-oauth.ts` — lê da BD, auto-refresh via evento `"tokens"`
- Se o token expirar sem refresh válido → widgets mostram "Renovar sessão" → `/api/auth/reauthorize` força re-consent

## Base de dados (produção)

- MariaDB em cPanel — só aceita ligações via **Unix socket** (`/var/lib/mysql/mysql.sock`)
- `MARIADB_SOCKET_PATH` em `.env.production` activa o socket em `src/lib/prisma.ts`
- **Não há `prisma migrate deploy` em produção** — alterações ao schema devem ser aplicadas manualmente via phpMyAdmin antes de fazer deploy do código

### Adicionar coluna ao schema (processo correto)

1. Editar `prisma/schema.prisma`
2. Correr `npx prisma migrate dev --name descricao` localmente (gera SQL em `prisma/migrations/`)
3. Copiar o SQL gerado e executar no phpMyAdmin de produção
4. Fazer commit + push (o deploy envia o Prisma client atualizado)

## Deploy

1. Push para `main` → GitHub Actions faz build (`npm run build`) + FTP mirror para o servidor
2. FTP exclui: `node_modules/`, `.env*`, `.git/`, `.claude/`, `.sql`
3. Após deploy, reiniciar o Passenger: **cPanel → Setup Node.js App → Restart**
4. `.env.production` existe **só no servidor** (File Manager) — nunca commitado

## Desenvolvimento local

```bash
npm install
# Cria .env.local a partir de .env.example e preenche as variáveis
npx prisma generate
npx prisma migrate dev
npm run dev
```

Sem Google Workspace configurado, o diretório usa `mock-provider.ts` como fallback.

## Adicionar uma nova secção

1. **Rota Next.js**: criar `src/app/api/<nome>/route.ts`
2. **Componente**: criar `src/components/portal/<nome>.tsx`
3. **Navegação**: adicionar entrada em `src/components/portal/sidebar.tsx` (array de secções)
4. **Permissões**: adicionar a chave de secção ao schema de roles em `prisma/schema.prisma` (campo `sections` JSON do modelo `Role`)
5. **Admin** (se necessário): criar rota em `src/app/api/admin/<nome>/` e painel em `src/components/portal/admin/`

## Variáveis de ambiente (resumo)

Ver `.env.example` para a lista completa. Variáveis críticas em produção:
- `DATABASE_URL`, `MARIADB_SOCKET_PATH`
- `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL`
- `ANTHROPIC_API_KEY` — importação de PDFs para o Manual
- `RESTART_TOKEN` — endpoint `/api/restart` (reinício remoto do Passenger)
- `GOOGLE_WORKSPACE_*` — sincronização do diretório de colaboradores
