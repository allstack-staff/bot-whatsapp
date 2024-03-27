# Docker para rodar o projeto em ambiente de produção nodejs com PM2

FROM node:lts-alpine3.19 as builder

WORKDIR /app

COPY package*.json .

RUN npm install -g pnpm

RUN pnpm install

RUN pnpm prod

COPY ./dist .

FROM node:lts-alpine3.19

# Multistage build

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist .

COPY --from=builder /app/package*.json .

COPY --from=builder /app/ecosystem.config.js .

RUN pnpm install

RUN pnpm list

ENTRYPOINT ["pm2-runtime", "start", "ecosystem.config.js"]

