---
title: Instalação e Configuração
---

# Instalação e Configuração

## Pré-requisitos

- Node.js (versão usada em desenvolvimento: 26.x)
- Um número de WhatsApp dedicado ao bot (recomendado — não use seu número principal)

## Passos

1. Clone o repositório e instale as dependências:
   ```
   npm install
   ```
   > Alguns pacotes (`better-sqlite3`, `prisma`, `@whiskeysockets/baileys`) têm scripts de instalação nativos. Se o npm bloquear ("install scripts blocked"), rode:
   > ```
   > npm rebuild better-sqlite3
   > npx prisma generate
   > ```

2. Copie `.env.example` para `.env` e ajuste:

   | Variável | Descrição | Obrigatória |
   |---|---|---|
   | `BOT_PREFIX` | Prefixo dos comandos (padrão `$`) | Não |
   | `SESSION_PATH` | Pasta onde a sessão do WhatsApp (auth) é salva | Não |
   | `LOG_LEVEL` | Nível de log do pino (`info`, `debug`, etc.) | Não |
   | `DATABASE_URL` | Caminho do arquivo SQLite (ex: `file:./prisma/dev.db`) | Sim |

   `ADMIN_GROUP_JID` no `.env.example` é só um comentário informativo — o grupo de admins real é registrado em runtime com o comando `$home` (fica salvo no banco, não no `.env`).

3. Aplique o schema no banco (cria o arquivo SQLite na primeira vez):
   ```
   npx prisma db push
   ```

4. Rode em modo desenvolvimento:
   ```
   npm run dev
   ```
   Um QR code aparece no terminal. No WhatsApp do número que vai virar o bot: **Aparelhos conectados → Conectar um aparelho** e escaneie.

5. Para produção, compile e rode o build:
   ```
   npm run build
   npm start
   ```

## Persistência e migração de hospedagem

Duas coisas precisam sobreviver a um restart ou a uma migração de servidor:

- **Sessão do WhatsApp** (`SESSION_PATH`, padrão `./auth`) — se for apagada, o bot desloga e pede QR code de novo.
- **Banco de dados** (`DATABASE_URL`, SQLite) — guarda os grupos de admin e os banimentos. É um arquivo único; basta copiar esse arquivo (ou a pasta inteira do projeto) para o novo host que o estado é recuperado automaticamente, sem nenhum passo manual — o bot lê o banco direto na inicialização.

Nenhum dos dois é versionado no git (ambos estão no `.gitignore`).
