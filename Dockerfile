# Docker para rodar o projeto em ambiente de produção nodejs com PM2

FROM node:lts-alpine3.19 as builder

WORKDIR /app

COPY . .

RUN npm install -g pnpm

RUN apk add --no-cache git

COPY system.config.js /production

RUN pnpm install \
    && pnpm add typescript @types/node\
    && npx tsc --build

FROM node:lts-alpine3.19

# Multistage build

WORKDIR /production

ENV NODE_ENV=production

COPY --from=builder /app/dist .

COPY --from=builder /app/*.json .

COPY --from=builder /app/system.config.js .

RUN npm install -g pnpm

RUN apk add --no-cache git

RUN pnpm install

ENTRYPOINT ["pm2-runtime", "start", "system.config.js"]

