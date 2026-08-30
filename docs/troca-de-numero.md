---
title: Troca de Número
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>


# Troca de Número (perda, ban, ou qualquer motivo)

Se o número atual do bot for perdido, banido, ou precisar ser trocado por qualquer motivo, **nenhum dado é perdido**. Nada no banco (grupos de admin, banimentos) é gravado com base no número do bot — só com base no JID de quem é banido e em qual grupo. O número do bot é só a "porta de entrada" da sessão do WhatsApp, totalmente desacoplado do estado que importa.

## Passo a passo

1. Pare o bot.
2. Apague (ou mova) a pasta de sessão (`SESSION_PATH`, padrão `./auth`) — ela pertence ao número antigo e não serve mais.
3. Suba o bot de novo (`npm run dev` ou `npm start`). Um novo QR code vai aparecer.
4. Escaneie o QR com o **número novo**.
5. **Passo manual, sem como automatizar**: adicione o número novo em cada grupo que o bot precisa administrar, e promova ele a admin do grupo. O WhatsApp não tem como "transferir" o cargo de admin de um número pro outro — precisa ser feito à mão, por qualquer admin humano do grupo.
6. Rode `$status` em qualquer grupo (ou no grupo de admins) pra confirmar: número conectado, quantos grupos de admin estão registrados e quantos banimentos ativos existem. Se os números baterem com o que era esperado, a troca foi 100% limpa.

## O que **não** precisa refazer

- `$home` — os grupos de admin já continuam registrados no banco, não são amarrados ao número antigo.
- Qualquer banimento já aplicado — todos continuam valendo, com o mesmo escopo (grupo/comunidade) de antes.

## O que fazer *antes* de perder o número, se possível

Se o número está sendo banido aos poucos (não é uma perda repentina), vale já deixar um número reserva pronto (chip/eSIM já ativo e "aquecido", ver [Instalação](instalacao.md)) pra minimizar o tempo que o bot fica fora do ar entre a queda do número antigo e a promoção do novo em todos os grupos.
