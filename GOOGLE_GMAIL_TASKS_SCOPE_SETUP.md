# Ativar Gmail e Google Tasks no SmartVolto Portal

Guia para adicionar os scopes de Gmail e Google Tasks ao portal, permitindo mostrar emails por ler e tarefas vencidas no painel de boas-vindas.

---

## O que vai mudar

Após esta configuração, o Hero do portal vai mostrar:
- **Emails por ler** — número de emails não lidos no Gmail, com link direto para a caixa de entrada
- **Tarefas vencidas** — número de tarefas em atraso no Google Tasks, com link para o Google Tasks

---

## Passo 1: Ativar as APIs no Google Cloud Console

### 1.1 — Gmail API

1. Vai ao [Google Cloud Console](https://console.cloud.google.com/) → projeto **SmartVolto Portal**
2. Menu lateral → **"APIs e serviços"** → **"Biblioteca"**
3. Pesquisa **"Gmail API"** → clica → **"ATIVAR"**

### 1.2 — Google Tasks API

1. Na mesma Biblioteca, pesquisa **"Tasks API"**
2. Clica em **"Tasks API"** → **"ATIVAR"**

> Se algum botão diz "GERIR", a API já está ativa.

---

## Passo 2: Adicionar os scopes no OAuth Consent Screen

1. Menu lateral → **"APIs e serviços"** → **"Ecrã de consentimento OAuth"**
2. Clica **"EDITAR APLICAÇÃO"**
3. Na secção **"Âmbitos"**, clica **"ADICIONAR OU REMOVER ÂMBITOS"**
4. No painel lateral, pesquisa e marca os seguintes scopes:

   | API | Scope | Descrição |
   |-----|-------|-----------|
   | Gmail API | `https://www.googleapis.com/auth/gmail.readonly` | Ler emails (só leitura) |
   | Tasks API | `https://www.googleapis.com/auth/tasks.readonly` | Ler tarefas (só leitura) |

5. Clica **"ATUALIZAR"** → **"GUARDAR E CONTINUAR"**

---

## Passo 3: Verificar o estado de publicação da app

Se a app ainda está em modo **"Teste"** (Testing), os scopes sensíveis como o Gmail precisam de estar na lista de utilizadores de teste ou a app tem de estar publicada.

1. No ecrã de consentimento OAuth, verifica o campo **"Estado de publicação"**
2. Se está em **"Teste"**: confirma que o teu email (`alfredorebelo@voltodrive.com`) está na lista de utilizadores de teste
3. Se a organização já usa o portal com domínio `@voltodrive.com`, considera mudar para **"Em produção"** — clica **"PUBLICAR APLICAÇÃO"**

> Em modo de teste, apenas utilizadores na lista podem autorizar scopes sensíveis como o Gmail.

---

## Passo 4: Renovar a sessão no portal

Depois de configurar os scopes, cada utilizador precisa de fazer re-login para autorizar os novos acessos:

1. Abre o portal em `http://localhost:3000` (ou o URL de produção)
2. Na barra de endereço, navega para:
   ```
   /api/auth/reauthorize?callbackUrl=/
   ```
3. O Google vai mostrar um ecrã de autorização com os novos scopes
4. Clica **"Permitir"** — garante que aceitas todos os scopes listados
5. Serás redirecionado para o portal com a sessão atualizada

---

## Passo 5: Verificar no portal

Após o re-login, o Hero da página inicial deve mostrar os novos indicadores:

- **Gmail**: número de emails não lidos com chip clicável
- **Tasks**: número de tarefas vencidas (se houver) com chip clicável

Se os chips não aparecerem, verifica:
- A API está ativa no Cloud Console (Passo 1)
- Os scopes estão no Consent Screen (Passo 2)
- Fizeste o re-login após a configuração (Passo 4)

---

## Troubleshooting

### "Error: 403 — Insufficient Permission"
- O scope não foi adicionado no OAuth Consent Screen (Passo 2)
- A API não está ativa no Cloud Console (Passo 1)

### O ecrã de autorização do Google não mostra os novos scopes
- Aguarda 5–10 minutos após guardar as alterações no Consent Screen
- Tenta em modo incógnito para garantir que não há cache de sessão anterior

### "Error: 400 — Access blocked: app not verified"
- A app está em modo de teste e o utilizador não está na lista de testers
- Adiciona o email em **"Utilizadores de teste"** no Consent Screen, ou publica a app

### Os indicadores aparecem mas mostram zero
- É possível que não haja emails não lidos ou tarefas vencidas — isso é o comportamento correto
- Verifica no Gmail e Google Tasks diretamente para confirmar

---

## Scopes configurados no portal (resumo completo)

| Scope | Para quê |
|-------|----------|
| `openid email profile` | Login básico |
| `drive.readonly` | Drive pessoal + indicador de espaço |
| `calendar.readonly` | Indicador de eventos do dia |
| `gmail.readonly` | Indicador de emails por ler *(novo)* |
| `tasks.readonly` | Indicador de tarefas vencidas *(novo)* |
