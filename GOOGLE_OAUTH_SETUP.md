# Configuração Google OAuth — Volto Smart Portal

Guia passo-a-passo para criar credenciais OAuth no Google Cloud Console.

---

## Passo 1: Aceder ao Google Cloud Console

1. Vai a https://console.cloud.google.com/
2. Faz login com a conta **admin@voltodrive.com** (ou outra conta com permissões de admin no Workspace)

---

## Passo 2: Criar (ou selecionar) um projeto

### Opção A — Criar um novo projeto

1. No topo da página, clica no seletor de projeto
2. Clica **"NOVO PROJETO"**
3. Preenche:
   - **Nome do projeto**: `Volto Smart Portal`
   - **Organização**: voltodrive.com (se aparecer)
   - **Localização**: voltodrive.com
4. Clica **"CRIAR"**
5. Aguarda alguns segundos e seleciona o projeto recém-criado

### Opção B — Usar projeto existente
- Seleciona o projeto que já usas para o Workspace

---

## Passo 3: Configurar o ecrã de consentimento OAuth

1. No menu lateral, vai a **"APIs e serviços" → "Ecrã de consentimento OAuth"**
2. Escolhe **"Interno"** (apenas utilizadores @voltodrive.com)
3. Clica **"CRIAR"**
4. Preenche:
   - **Nome da app**: `Volto Smart Portal`
   - **Email de apoio do utilizador**: admin@voltodrive.com
   - **Logótipo da app** (opcional): faz upload de `public/brand/symbol.png`
   - **Domínio da app**:
     - **Página inicial**: `https://voltosmart.voltodrive.com`
     - **Política de privacidade**: deixa vazio por agora (obrigatório só em produção)
     - **Termos de serviço**: deixa vazio
   - **Domínios autorizados**: adiciona `voltodrive.com`
   - **Email do programador**: o teu email
5. **"GUARDAR E CONTINUAR"**
6. Em **"Âmbitos"**: clica **"GUARDAR E CONTINUAR"** sem adicionar nada (os scopes básicos chegam)
7. **"VOLTAR AO PAINEL"**

---

## Passo 4: Criar credenciais OAuth Client ID

1. No menu lateral, vai a **"APIs e serviços" → "Credenciais"**
2. Clica **"+ CRIAR CREDENCIAIS"** → **"ID de cliente OAuth"**
3. Preenche:
   - **Tipo de aplicação**: `Aplicação Web`
   - **Nome**: `Volto Smart Portal — Web`
4. **Origens de JavaScript autorizadas** (adiciona ambas):
   ```
   http://localhost:3000
   https://voltosmart.voltodrive.com
   ```
5. **URIs de redirecionamento autorizados** (adiciona ambas):
   ```
   http://localhost:3000/api/auth/callback/google
   https://voltosmart.voltodrive.com/api/auth/callback/google
   ```
6. Clica **"CRIAR"**
7. Aparece uma janela com:
   - **ID de cliente** → copia
   - **Segredo do cliente** → copia

---

## Passo 5: Configurar `.env.local`

Abre o ficheiro `.env.local` na raiz do projeto e preenche:

```env
AUTH_GOOGLE_ID="cola-aqui-o-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="cola-aqui-o-client-secret"
```

⚠️ **Importante**: NUNCA faças commit do `.env.local`. O ficheiro já está no `.gitignore`.

---

## Passo 6: Testar localmente

1. No terminal, executa:
   ```bash
   npm run dev
   ```
2. Abre http://localhost:3000
3. Deves ser redirecionado para `/login`
4. Clica **"Entrar com Google"**
5. Escolhe a tua conta `@voltodrive.com`
6. Após autorizar, deves ser redirecionado para o portal

### Testes a fazer

- [ ] Login com conta `@voltodrive.com` → entra com sucesso
- [ ] Login com conta `@gmail.com` ou outro domínio → erro "Acesso negado"
- [ ] Após login, vê o teu nome real no canto inferior da sidebar
- [ ] Clica no menu de utilizador → "Terminar sessão" → volta ao `/login`
- [ ] Tentar aceder a `/` sem login → redireciona para `/login`

---

## Para Produção (voltosmart.voltodrive.com)

Quando deployares, atualiza:

1. **`.env.production.local` no servidor**:
   ```env
   AUTH_GOOGLE_ID="mesmo-id-que-localmente"
   AUTH_GOOGLE_SECRET="mesmo-secret-que-localmente"
   AUTH_SECRET="gera-um-novo-aleatorio"
   AUTH_TRUST_HOST="true"
   NEXTAUTH_URL="https://voltosmart.voltodrive.com"
   ```

2. **Regista o domínio em produção** (Passo 4) — já está feito se seguiste este guia.

---

## Resolução de Problemas

### "Erro 400: redirect_uri_mismatch"
- O URI no Google Cloud não coincide com o usado pela aplicação
- Confirma que adicionaste **exatamente**: `http://localhost:3000/api/auth/callback/google`
- Sem barra no fim, com `/api/auth/callback/google` (não `/auth/callback`)

### "Acesso negado" mesmo com conta @voltodrive.com
- Verifica que o **ecrã de consentimento** está em modo **Interno** (não Externo)
- Verifica que o domínio `voltodrive.com` está em **Domínios autorizados**

### "Configuration error"
- O `AUTH_GOOGLE_ID` ou `AUTH_GOOGLE_SECRET` estão vazios ou mal copiados
- Reinicia o servidor após alterar `.env.local`

### "OAuthAccountNotLinked"
- Tentaste fazer login com Google numa conta que já existe na BD com outro provider
- Apaga o utilizador da BD via phpMyAdmin e tenta novamente

---

## Próximo Passo: Google Workspace Directory API

Quando o login estiver a funcionar, vamos configurar a **service account** com **domain-wide delegation** para sincronizar utilizadores do Workspace para a BD. Isso será um guia separado quando avançarmos para essa fase.
