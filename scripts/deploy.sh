#!/bin/bash
# Redeploy manual/emergencial na VM — usa a mesma ordem seura do startup-script
# (para o processo antes de mexer no código, só sobe depois que o build termina).
# Sem isso, um `git reset`/build enquanto o processo antigo ainda roda pode
# deixar o PM2 tentar reiniciar sozinho no meio da janela em que dist/ está
# sendo reescrito, e crashar com "Cannot find module dist/index.js".
set -e
export HOME=/root

cd /opt/bot-whatsapp

echo "--- Parando o bot ---"
pm2 stop bot-whatsapp 2>/dev/null || true

echo "--- Atualizando código ---"
git fetch --quiet
git reset --hard origin/main --quiet

echo "--- Instalando dependências ---"
npm install
npx prisma generate
npx prisma db push

echo "--- Build ---"
rm -rf dist
npm run build

echo "--- Subindo o bot ---"
pm2 restart bot-whatsapp --update-env 2>/dev/null || pm2 start npm --name "bot-whatsapp" -- run start
pm2 save

echo "--- Deploy concluído ---"
pm2 jlist | python3 -c "import json,sys; d=json.load(sys.stdin); [print(p['name'], p['pm2_env']['status'], 'restarts:', p['pm2_env']['restart_time']) for p in d]"
