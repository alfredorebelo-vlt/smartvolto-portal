# Resolver Erro do MySQL no XAMPP

## Erro: "MySQL shutdown unexpectedly"

Este erro é comum e tem várias soluções. Segue estas etapas **por ordem**:

---

## Solução 1: Porta Bloqueada (MAIS COMUM)

### Verifica se a porta 3306 está em uso

**Windows - Command Prompt (como Admin):**
```bash
netstat -ano | findstr :3306
```

Se aparecer algo como `LISTENING`, a porta está ocupada.

### Termina o processo que está a usar a porta

Se viste um PID (número no final da linha), executa:
```bash
taskkill /PID [numero_aqui] /F
```

Exemplo:
```bash
taskkill /PID 5432 /F
```

Depois tenta iniciar o MySQL novamente no XAMPP.

---

## Solução 2: Ficheiros de Lock Corrompidos

### Elimina os ficheiros de lock do MySQL

1. Abre Explorador de Ficheiros
2. Navega para: `C:\xampp\mysql\data\`
3. Procura por ficheiros chamados:
   - `ibdata1.lock`
   - `mysql.sock`
   - Ficheiros `.pid`

4. Elimina-os (se existirem)
5. Tenta iniciar MySQL novamente

---

## Solução 3: Reinicia o XAMPP como Administrador

1. **Fecha completamente o XAMPP**
2. Clica com botão direito no atalho do XAMPP
3. Seleciona **"Executar como administrador"**
4. Clica **Iniciar** para MySQL
5. Espera 10-15 segundos antes de clicar novamente

---

## Solução 4: Verifica a Pasta de Dados do MySQL

Se o MySQL não consegue aceder à pasta de dados:

```bash
# No Command Prompt (como Admin)
# Dá permissões completas à pasta do MySQL
icacls "C:\xampp\mysql\data" /grant:r "%USERNAME%:F" /t
```

---

## Solução 5: Reinstala o Módulo MySQL do XAMPP

Se as soluções acima não funcionam:

1. Abre XAMPP Control Panel
2. Clica em **Config** (botão ao lado de MySQL)
3. Seleciona **Service and Port Settings**
4. Clica em **Install** (para MySQL)
5. Tenta iniciar novamente

---

## Solução 6: Porta Padrão Alterada

Se a porta 3306 está completamente bloqueada, muda para outra porta:

1. No XAMPP Control Panel, clica **Config** perto de MySQL
2. Seleciona **my.ini**
3. Procura pela linha: `port=3306`
4. Muda para: `port=3307` (ou outro número)
5. Guarda o ficheiro
6. Tenta iniciar MySQL

Se mudaste a porta, atualiza o `.env.local`:
```env
DATABASE_URL="mysql://voltosmart_dev:senha@localhost:3307/voltosmart_portal_dev"
```

---

## Solução 7: Reinicia o Computador

Às vezes, o Windows precisa de um reinício para libertar a porta:

```bash
# Reinicia o Windows
shutdown /r /t 0
```

Depois tenta novamente.

---

## Se Nada Funcionar: Reinstala MySQL

### Opção A: Usa MySQL Standalone (Recomendado)

1. Descarrega MySQL Community Server: https://dev.mysql.com/downloads/mysql/
2. Instala (custom setup)
3. Configura a porta 3306
4. Atualiza DATABASE_URL em `.env.local` com as credenciais novas

### Opção B: Desinstala e Reinstala XAMPP

1. Fecha XAMPP completamente
2. Painel de Controlo → Programas → Desinstala XAMPP
3. Elimina a pasta `C:\xampp\`
4. Descarrega XAMPP novamente de https://www.apachefriends.org/
5. Instala fresh
6. Começa do zero

---

## Verificação Final

Se conseguires iniciar MySQL:

```bash
# Testa a ligação
mysql -u root -p
# Pressiona Enter (sem palavra-passe)

# Se conseguir ligar, escreve:
SHOW DATABASES;
exit
```

Se veres uma lista de bases de dados, MySQL está a funcionar ✅

---

## Se Continuares com Problemas

Por favor, executa e partilha o conteúdo deste ficheiro:

```bash
# Abre o Bloco de Notas e copia o conteúdo do log do MySQL:
C:\xampp\mysql\data\mysql_error.log
```

Este ficheiro tem informações específicas sobre o que está a causar o erro.

---

## Alternativa: Usa Docker para MySQL

Se o XAMPP continua com problemas, podes usar Docker (mais fácil):

1. Instala Docker Desktop: https://www.docker.com/products/docker-desktop
2. Executa:
   ```bash
   docker run --name voltosmart-mysql \
     -e MYSQL_ROOT_PASSWORD=root \
     -e MYSQL_DATABASE=voltosmart_portal_dev \
     -p 3306:3306 \
     -d mysql:8.0
   ```

3. Atualiza `.env.local`:
   ```env
   DATABASE_URL="mysql://root:root@localhost:3306/voltosmart_portal_dev"
   ```

4. Continua com o resto da configuração

---

## Resumo das Soluções (Ordem Recomendada)

1. ✅ Verifica porta 3306 com `netstat -ano | findstr :3306`
2. ✅ Termina o processo se está em uso: `taskkill /PID ...`
3. ✅ Elimina ficheiros de lock em `C:\xampp\mysql\data\`
4. ✅ Reinicia XAMPP como administrador
5. ✅ Se continuar: usa Docker como alternativa
6. ✅ Se tudo falhar: contacta suporte

Qual destas soluções queres tentar primeiro?
