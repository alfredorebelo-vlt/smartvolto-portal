# Google Workspace Directory Sync — Volto Smart Portal

Guia para configurar a sincronização automática de colaboradores do Google Workspace.

---

## Como funciona

1. Uma **service account** do Google Cloud impersona o admin do Workspace
2. Chama a **Admin Directory API** para listar todos os utilizadores `@voltodrive.com`
3. Faz upsert dos dados na BD local (tabela `User`)
4. O diretório de Pessoas serve os dados da BD — rápido, sem chamar a API em cada page load
5. Admins podem acionar o sync manualmente no portal (botão na página Pessoas)

---

## Passo 1: Ativar a Admin Directory API

1. Vai ao [Google Cloud Console](https://console.cloud.google.com/) → projeto Volto Smart Portal
2. Menu lateral → **"APIs e serviços" → "Biblioteca"**
3. Pesquisa **"Admin SDK API"** → clica → **"Ativar"**

---

## Passo 2: Criar a Service Account

1. Menu lateral → **"APIs e serviços" → "Credenciais"**
2. Clica **"+ CRIAR CREDENCIAIS" → "Conta de serviço"**
3. Preenche:
   - **Nome**: `VoltoSmart Directory Sync`
   - **ID**: `voltosmart-directory-sync`
4. Clica **"CRIAR E CONTINUAR"** → **"CONCLUIR"** (sem atribuir papéis)
5. Na lista de contas de serviço, clica na que acabaste de criar
6. Vai ao separador **"Chaves"** → **"ADICIONAR CHAVE" → "Criar nova chave"**
7. Escolhe **JSON** → **"CRIAR"**
8. O ficheiro JSON é descarregado — guarda-o em segurança (não faças commit!)

O ficheiro JSON tem este formato:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "voltosmart-directory-sync@...iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

---

## Passo 3: Domain-Wide Delegation no Google Workspace Admin

1. Vai ao [Google Admin Console](https://admin.google.com/) → login com `admin@voltodrive.com`
2. Menu → **"Segurança" → "Controlo de acesso e dados" → "Controlos de API"**
3. Clica **"GERIR DELEGAÇÃO EM TODO O DOMÍNIO"**
4. Clica **"Adicionar novo"**
5. Preenche:
   - **ID do cliente**: copia o `client_id` do ficheiro JSON da service account
   - **Âmbitos OAuth**: `https://www.googleapis.com/auth/admin.directory.user.readonly`
6. Clica **"AUTORIZAR"**

---

## Passo 4: Configurar `.env.local`

### 4.1 — Abre o ficheiro JSON da service account

Após descarregar o ficheiro no Passo 2 (ex: `voltosmart-portal-abc123.json`), abre-o num editor de texto. Deverás ver algo assim:

```json
{
  "type": "service_account",
  "project_id": "voltosmart-portal",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA1234...\n...\n-----END RSA PRIVATE KEY-----\n",
  "client_email": "voltosmart-directory-sync@voltosmart-portal.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  ...
}
```

### 4.2 — Identifica os 3 valores que precisas

| Campo no JSON       | Variável no `.env.local`             |
|---------------------|--------------------------------------|
| `client_email`      | `GOOGLE_WORKSPACE_CLIENT_EMAIL`      |
| `private_key`       | `GOOGLE_WORKSPACE_PRIVATE_KEY`       |
| *(fixo)*            | `GOOGLE_WORKSPACE_ADMIN_EMAIL`       |

### 4.3 — Copia os valores para `.env.local`

Abre o ficheiro `.env.local` na raiz do projeto e preenche as 4 linhas:

```env
# Conta de admin do Workspace que a service account vai impersonar
GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@voltodrive.com"

# Email da service account — copia exatamente o campo "client_email" do JSON
GOOGLE_WORKSPACE_CLIENT_EMAIL="voltosmart-directory-sync@voltosmart-portal.iam.gserviceaccount.com"

# Chave privada — ver instruções abaixo (4.4)
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n"

# Domínio — já está preenchido, não alteres
GOOGLE_WORKSPACE_DOMAIN="voltodrive.com"
```

### 4.4 — Como copiar a `private_key` corretamente (passo mais importante)

A `private_key` é um bloco de texto longo com quebras de linha. No ficheiro JSON está representada com `\n` literais (a sequência barra-n). Há duas formas de a copiar:

#### Opção A — Copia o valor tal como está no JSON (mais simples)

1. No ficheiro JSON, encontra a linha `"private_key": "..."` 
2. Copia **apenas o conteúdo entre aspas** — vai começar em `-----BEGIN RSA PRIVATE KEY-----\n` e terminar em `-----END RSA PRIVATE KEY-----\n`
3. Cola diretamente no `.env.local` entre aspas, numa só linha:

```env
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...(muitos caracteres)...\n-----END RSA PRIVATE KEY-----\n"
```

> O código já trata da conversão dos `\n` para quebras de linha reais.

#### Opção B — Usa o VS Code para verificar

1. Abre o ficheiro JSON no VS Code
2. Clica na linha da `private_key`
3. Copia o valor (com Ctrl+C) — deverás ver uma string longa numa só linha com `\n` intercalados
4. Cola no `.env.local`

### 4.5 — Verifica se ficou correto

O teu `.env.local` deverá ter estas 4 linhas preenchidas (sem aspas vazias):

```env
GOOGLE_WORKSPACE_ADMIN_EMAIL="admin@voltodrive.com"
GOOGLE_WORKSPACE_CLIENT_EMAIL="voltosmart-directory-sync@<o-teu-project-id>.iam.gserviceaccount.com"
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...conteúdo longo...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_WORKSPACE_DOMAIN="voltodrive.com"
```

⚠️ **Atenção**: após editar o `.env.local`, reinicia sempre o servidor (`Ctrl+C` → `npm run dev`) para as novas variáveis serem carregadas.

---

## Passo 5: Fazer o primeiro sync

1. Reinicia o servidor: `npm run dev`
2. Faz login no portal com a tua conta `@voltodrive.com`
3. Vai à página **Pessoas**
4. Clica o botão **"Sincronizar Workspace"** (visível apenas para admins)
5. Aguarda — verás o número de utilizadores sincronizados

---

## Para Produção

No servidor de produção, em vez de `.env.local` usa variáveis de ambiente do sistema ou do serviço de hosting (Vercel, Railway, etc.).

A private key em produção deve ser escapada corretamente (os `\n` como `\\n` numa string JSON, ou variável multi-linha dependendo da plataforma).

---

## Troubleshooting

### "Error: invalid_grant"
- O `GOOGLE_WORKSPACE_ADMIN_EMAIL` não tem permissões de super-admin no Workspace
- Verifica que o domain-wide delegation foi guardado corretamente

### "Error: access_denied" / 403
- O âmbito `admin.directory.user.readonly` não foi adicionado no passo 3
- Aguarda alguns minutos após configurar o delegation (pode demorar a propagar)

### Utilizadores não aparecem após sync
- Verifica que o `GOOGLE_WORKSPACE_DOMAIN` está correto (`voltodrive.com`)
- Confirma que a BD tem a tabela `User` criada (`npx prisma migrate deploy`)
