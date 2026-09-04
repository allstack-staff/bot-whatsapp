---
title: Como o Banimento Funciona
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>


# Como o Banimento Funciona

## Os três tipos

| Tipo | Escopo | Expira? |
|---|---|---|
| `permanente` | Só o grupo onde foi aplicado o ban | Não |
| `temporario` (padrão) | Só o grupo onde foi aplicado o ban | Sim — 7 dias por padrão, ajustável com `$asb banedit ... tempo` |
| `comunidade` | **Todos** os grupos vinculados à Community "All Stack Community" no WhatsApp | Só se você definir um tempo com `$asb banedit ... tempo`; por padrão não expira |

Importante: **"comunidade" é a feature nativa "Community" do WhatsApp** (os grupos ligados à All Stack Community por `linkedParent`). O número do bot participa de dezenas de outros grupos/communities sem relação nenhuma com a All Stack (grupos de terceiros, pessoais, etc.) — nenhuma ação de `comunidade`, `$asb regras` ou qualquer coisa em massa afeta esses outros grupos, só os que realmente são da All Stack Community. Isso é configurado uma vez no servidor via `COMMUNITY_JID` (veja [Deploy](deploy.md)).

## O que acontece quando alguém é banido

1. O bot grava o banimento no banco (usuário, grupo, tipo, motivo, quem baniu, quando expira).
2. Remove o membro imediatamente:
   - Se for `comunidade`: de **todo** grupo da All Stack Community em que o membro está presente.
   - Se for `permanente`/`temporario`: só do grupo onde o comando foi rodado.
3. Manda um log no grupo de admins (registrado via `$asb home`).

## Reentrada

Se o membro banido for adicionado de novo (por qualquer pessoa) em um grupo onde o banimento se aplica, o bot detecta a entrada, remove automaticamente e avisa no grupo de admins — sem precisar de nenhum comando manual. Isso vale mesmo depois de reiniciar o bot: o estado do banimento está no banco, não em memória.

## Pedido de entrada (grupos com aprovação de admin)

Em grupos com "aprovação de admin" ativada pra novos membros, quem tem banimento ativo pra aquele grupo (comunidade, ou permanente/temporário daquele grupo específico) tem o pedido **rejeitado automaticamente**, assim que o bot processa o evento — a pessoa nunca chega a entrar. Isso é mais imediato que a reentrada normal (que remove depois de já ter entrado), já que intercepta o pedido antes de virar membro. O grupo de admins recebe o mesmo tipo de aviso nos dois casos.

## Sobre identidade (LID) — por que isso importa

Desde meados de 2026 o WhatsApp passou a identificar participantes de grupo por um ID opaco (`@lid`), que **não tem relação com o número de telefone**. Isso quer dizer que, dependendo do momento, o WhatsApp pode entregar o mesmo usuário ora como `@lid`, ora como `@s.whatsapp.net` (o formato baseado em telefone).

O bot resolve isso automaticamente ([`src/infra/bot/utils/jid.ts`](../src/infra/bot/utils/jid.ts)) antes de gravar ou consultar um banimento: sempre traduz pra um JID de telefone canônico, usando primeiro os metadados do grupo (que já trazem os dois formatos por participante) e, se precisar, a store oficial de mapeamento do próprio Baileys (`sock.signalRepository.lidMapping`). Na prática isso significa que não importa se o admin marcou/respondeu a pessoa numa mensagem endereçada por `@lid` ou por número — o banimento é o mesmo registro, reconhecido do mesmo jeito na hora de checar reentrada.

Esse era, inclusive, o bug raiz que fazia o sistema de banimento antigo não funcionar mais: a versão anterior tentava resolver telefone↔lid lendo arquivos que ela mesma inventava (`lid-mapping-<numero>.json` dentro da pasta `auth/`), que não é como o Baileys realmente guarda esse mapeamento.
