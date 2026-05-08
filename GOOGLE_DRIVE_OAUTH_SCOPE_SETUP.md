# Configurar OAuth Scope da Google Drive API — Volto Smart Portal

Guia para adicionar o scope do Google Drive ao projeto no Google Cloud Console, permitindo que o portal aceda a ficheiros e pastas do Google Drive dos colaboradores.

---

## Porquê configurar o scope da Drive?

O Volto Smart Portal precisa de aceder ao Google Drive para:
- Listar ficheiros e pastas partilhadas dentro do domínio `@voltodrive.com`
- Ler metadados de documentos (nome, tipo, proprietário, data de modificação)
- Integrar o Drive com o diretório de Pessoas (ex: pasta de cada colaborador)

Para isso é necessário:
1. Ativar a **Google Drive API** no projeto do Google Cloud Console
2. Adicionar o scope `drive` (ou um scope mais restrito) à **service account** existente
3. Autorizar esse scope no **Google Workspace Admin** (domain-wide delegation)

---

## Passo 1: Ativar a Google Drive API

1. Vai ao [Google Cloud Console](https://console.cloud.google.com/) e seleciona o projeto **Volto Smart Portal**
2. No menu lateral esquerdo, clica em **"APIs e serviços"** → **"Biblioteca"**
3. Na caixa de pesquisa, escreve **"Google Drive API"**
4. Clica no resultado **"Google Drive API"** (publicado por Google)
5. Clica no botão **"ATIVAR"**

> Se o botão diz "GERIR" em vez de "ATIVAR", a API já está ativa — passa ao Passo 2.

---

## Passo 2: Escolher o scope correto

Os scopes definem o nível de acesso que a aplicação tem ao Drive. Usa sempre o scope **menos permissivo** que satisfaça as tuas necessidades:

| Scope | Acesso | Quando usar |
|-------|--------|-------------|
| `https://www.googleapis.com/auth/drive.readonly` | Leitura de todos os ficheiros | Listar e ler ficheiros sem os modificar |
| `https://www.googleapis.com/auth/drive.metadata.readonly` | Apenas metadados (nome, tipo, datas) | Indexar ficheiros sem aceder ao conteúdo |
| `https://www.googleapis.com/auth/drive.file` | Apenas ficheiros criados pela app | Quando a app cria os próprios ficheiros |
| `https://www.googleapis.com/auth/drive` | Acesso total | Evitar — só se precisares de escrita |

**Recomendado para o Volto Smart Portal:** `https://www.googleapis.com/auth/drive.readonly`

---

## Passo 3: Adicionar o scope no OAuth Consent Screen

> Este passo é necessário se usares **OAuth 2.0 para utilizadores** (não service account). Se usas apenas service account com domain-wide delegation, passa ao Passo 4.

1. No Google Cloud Console, vai a **"APIs e serviços"** → **"Ecrã de consentimento OAuth"**
2. Clica em **"EDITAR APLICAÇÃO"**
3. Na secção **"Âmbitos"**, clica em **"ADICIONAR OU REMOVER ÂMBITOS"**
4. No painel que aparece à direita:
   - Pesquisa `drive`
   - Marca a caixa ao lado de **"Google Drive API — .../auth/drive.readonly"**
   - Ou cola manualmente o scope na caixa de texto em baixo
5. Clica **"ATUALIZAR"**
6. Desce até ao fundo e clica **"GUARDAR E CONTINUAR"**

---

## Passo 4: Autorizar o scope na Service Account (Domain-Wide Delegation)

Este é o passo mais importante. Sem ele, a service account não consegue aceder ao Drive dos utilizadores do domínio.

1. Vai ao [Google Admin Console](https://admin.google.com/) — login com `admin@voltodrive.com`
2. No menu lateral, navega para **"Segurança"** → **"Controlo de acesso e dados"** → **"Controlos de API"**
3. Clica em **"GERIR DELEGAÇÃO EM TODO O DOMÍNIO"**
4. Encontra a entrada da service account `voltosmart-directory-sync` (criada no guia anterior)
5. Clica no ícone de **editar (lápis)** à direita dessa entrada
6. No campo **"Âmbitos OAuth"**, adiciona o novo scope a seguir ao que já existe:

   **Antes (só tinha):**
   ```
   https://www.googleapis.com/auth/admin.directory.user.readonly
   ```

   **Depois (adiciona separado por vírgula):**
   ```
   https://www.googleapis.com/auth/admin.directory.user.readonly,https://www.googleapis.com/auth/drive.readonly
   ```

7. Clica **"AUTORIZAR"**

> Os scopes são separados por vírgula, sem espaços. Não apagues o scope anterior — adiciona o novo a seguir.

---

## Passo 5: Verificar a configuração

### 5.1 — Confirmar no Google Cloud Console

1. Vai a **"APIs e serviços"** → **"APIs e serviços ativados"**
2. Confirma que **"Google Drive API"** aparece na lista com estado **"Ativada"**

### 5.2 — Confirmar no Google Admin Console

1. Vai a **"Segurança"** → **"Controlos de API"** → **"GERIR DELEGAÇÃO EM TODO O DOMÍNIO"**
2. Na linha da service account, confirma que a coluna **"Âmbitos OAuth"** mostra os dois scopes

### 5.3 — Testar via portal (quando o código estiver implementado)

1. Reinicia o servidor: `npm run dev`
2. Faz login com a tua conta `@voltodrive.com`
3. Testa a funcionalidade de Drive — se aparecer erro 403, verifica o Passo 4

---

## Passo 6: Atualizar o código da service account

No código que inicializa a Google Auth, adiciona o scope da Drive:

```typescript
// lib/google-auth.ts (ou equivalente)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_WORKSPACE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_WORKSPACE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/admin.directory.user.readonly',
    'https://www.googleapis.com/auth/drive.readonly', // novo scope
  ],
});
```

---

## Troubleshooting

### "Error: 403 — Insufficient Permission"
- O scope não foi adicionado no domain-wide delegation (Passo 4)
- Aguarda 5–10 minutos após guardar — as alterações no Admin Console podem demorar a propagar
- Confirma que não há espaços entre os scopes na lista separada por vírgulas

### "Error: 403 — Access Not Configured"
- A Google Drive API não está ativada no projeto (Passo 1)
- Vai ao Cloud Console e ativa-a

### "Error: 400 — Invalid Scope"
- O scope está mal escrito — copia exatamente de um dos valores na tabela do Passo 2
- Confirma que começa por `https://www.googleapis.com/auth/`

### "Error: invalid_grant"
- O email em `GOOGLE_WORKSPACE_ADMIN_EMAIL` não tem permissões de super-admin
- O domain-wide delegation não foi guardado para esta service account

### A API está ativada mas continua a dar erro
- Confirma que estás no projeto correto no Cloud Console (canto superior esquerdo)
- A service account usada no código é a mesma que tem o delegation configurado

---

## Referências

- [Google Drive API — Scopes disponíveis](https://developers.google.com/drive/api/guides/api-specific-auth)
- [Domain-Wide Delegation — Documentação oficial](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Admin Console](https://admin.google.com/)
