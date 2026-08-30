---
title: All Stack Bot
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>


# All Stack Bot

Bot de WhatsApp da All Stack Community, construído sobre [Baileys](https://github.com/WhiskeySockets/Baileys) (protocolo WhatsApp Web, sem API oficial).

Hoje o bot cobre **gestão de banimentos** entre os grupos administrados pela comunidade: um admin bane alguém em qualquer grupo informando motivo e tipo de banimento, o bot memoriza isso de forma persistente e passa a remover automaticamente esse membro de qualquer grupo em que ele não deveria estar — inclusive se ele for readicionado depois.

Funcionalidades de IA (ChatGPT, DALL-E) fazem parte do histórico do projeto mas não estão implementadas na versão atual do código — veja [Arquitetura](arquitetura.md).

## Prefixo de comando

Todos os comandos usam o prefixo `$` (configurável via `BOT_PREFIX`).

## Para quem é essa documentação

- **Admins da comunidade** (não precisa saber programar): manda `$ajuda` direto no WhatsApp que o bot já responde com o resumo dos comandos mais usados. Pra mais detalhes, veja [Comandos](comandos.md) e [Como o Banimento Funciona](banimentos.md).
- **Devs/contribuidores**: veja [Instalação](instalacao.md), [Arquitetura](arquitetura.md) e [Deploy](deploy.md).
- Se o número do bot for perdido ou banido, veja [Troca de Número](troca-de-numero.md) antes de entrar em pânico — nenhum dado é perdido.
