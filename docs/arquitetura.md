---
title: Arquitetura
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>


# Arquitetura

Visão técnica pra quem for mexer no código.

## Stack

- **TypeScript** (commonjs), compilado com `tsc`, rodado em dev com `ts-node`.
- **[@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)** — protocolo WhatsApp Web (não é a API oficial da Meta).
- **Prisma + better-sqlite3** — persistência em arquivo único, sem servidor de banco separado.
- **pino** — logging estruturado.

## Estrutura de pastas

```
src/
  index.ts                       # bootstrap: conecta no WhatsApp, QR, reconexão
  infra/bot/
    config/index.ts              # prefixo, lista de comandos, docsUrl
    handlers/messageHandler.ts   # dispatch de comandos, toda a lógica de negócio
    services/
      banService.ts              # CRUD de banimentos (Prisma)
      adminService.ts            # CRUD de grupos de admin (Prisma)
    utils/
      jid.ts                     # resolução de identidade (ver abaixo)
      delay.ts                   # pausas humanizadas anti-detecção de bot
      logger.ts
    types/index.ts
prisma/schema.prisma              # AdminGroup, BannedUser
```

## Resolução de identidade (`utils/jid.ts`)

Desde meados de 2026 o WhatsApp identifica participantes de grupo por um ID opaco (`@lid`), sem relação com o número de telefone — o mesmo usuário pode aparecer ora como `@lid`, ora como `@s.whatsapp.net` dependendo do momento. Todo o sistema de banimento depende de reconhecer a mesma pessoa nos dois formatos, então:

- `findParticipant(metadata, jid)` — acha um participante de grupo por qualquer uma das suas identidades conhecidas (`id`, `lid`, `phoneNumber`).
- `resolvePnJid(sock, jid, metadata?)` — resolve qualquer jid pra um JID de telefone canônico: primeiro tenta pelos metadados do grupo (grátis, sem round-trip de rede); se não achar, cai pra `sock.signalRepository.lidMapping` (a store oficial do próprio Baileys, persistida no keystore do Signal).

Todo banimento é gravado com o JID de telefone já resolvido — isso é o que faz o `$asb unban` funcionar independente de o WhatsApp endereçar a pessoa por `@lid` ou por número naquele momento.

**Não reintroduza comparação de string crua entre JIDs** (tipo `id.split('@')[0] === outro.split('@')[0]`) em código novo — é exatamente esse tipo de comparação que quebrou o sistema de banimento anterior quando o WhatsApp migrou pra LID.

## Persistência (`prisma/schema.prisma`)

- `AdminGroup` — grupos registrados via `$asb home`. Só guarda o JID do grupo.
- `BannedUser` — chave composta `[userJid, groupJid]`. `groupJid` é o grupo onde o ban foi aplicado (relevante pra bans `PERMANENTE`/`TEMPORARIO`, que só valem naquele grupo); bans `COMUNIDADE` são consultados ignorando o grupo (ver [Como o Banimento Funciona](banimentos.md)).

Nenhuma tabela referencia o número do próprio bot — só JIDs de membros e grupos. Isso é o que torna a [troca de número](troca-de-numero.md) uma operação sem perda de dado.

## O que NÃO está implementado

O README e o `comandos.md` originais do projeto (herdados de uma versão anterior) descrevem comandos de IA (`$gpt`, `$bc`, `$img` com DALL-E). **Esses comandos não existem no código atual** — só a parte de moderação/banimento foi (re)implementada até agora. Não assuma que esse código existe só porque está documentado em algum lugar antigo.
