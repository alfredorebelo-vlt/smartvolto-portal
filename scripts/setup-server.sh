#!/bin/bash
# =============================================================
# Smart Volto Portal — Setup inicial no servidor cPanel
# Corre UMA VEZ via SSH após configurar a Node.js App no cPanel
# =============================================================

set -e

APP_DIR="$HOME/smartvolto-portal"
REPO="https://github.com/alfredorebelo-vlt/smartvolto-portal.git"

echo "=== 1. Clonar repositório ==="
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "=== 2. Instalar dependências ==="
npm ci --omit=dev

echo "=== 3. Gerar cliente Prisma ==="
npx prisma generate

echo "=== 4. Aplicar migrações ==="
npx prisma migrate deploy

echo "=== 5. Build ==="
npm run build

echo ""
echo "✓ Setup concluído!"
echo ""
echo "Falta configurar:"
echo "  1. O ficheiro .env.local nesta pasta com as variáveis de ambiente"
echo "  2. No cPanel → Setup Node.js App:"
echo "     - Application root: smartvolto-portal"
echo "     - Application URL:  smartvolto.voltodrive.com"
echo "     - Application startup file: node_modules/.bin/next"
echo "     - Startup command: start"
echo "     - Node version: 18.x"
