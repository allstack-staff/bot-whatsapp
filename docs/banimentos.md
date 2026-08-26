# Como o Banimento Funciona

## Os três tipos

| Tipo | Escopo | Expira? |
|---|---|---|
| `permanente` | Só o grupo onde foi aplicado o ban | Não |
| `temporario` (padrão) | Só o grupo onde foi aplicado o ban | Sim — 7 dias por padrão, ajustável com `$banedit ... tempo` |
| `comunidade` | **Todos** os grupos que o bot administra | Só se você definir um tempo com `$banedit ... tempo`; por padrão não expira |

Importante: **"comunidade" aqui não é a feature nativa "Community" do WhatsApp** (aquele agrupamento de grupos ligados por `linkedParent`). É "todos os grupos que o bot está e administra", que é como a All Stack Community realmente opera — vários grupos distintos, não necessariamente ligados pela feature nativa do WhatsApp.

## O que acontece quando alguém é banido

1. O bot grava o banimento no banco (usuário, grupo, tipo, motivo, quem baniu, quando expira).
2. Remove o membro imediatamente:
   - Se for `comunidade`: de **todo** grupo em que o bot está e o membro está presente.
   - Se for `permanente`/`temporario`: só do grupo onde o comando foi rodado.
3. Manda um log no grupo de admins (registrado via `$home`).

## Reentrada

Se o membro banido for adicionado de novo (por qualquer pessoa) em um grupo onde o banimento se aplica, o bot detecta a entrada, remove automaticamente e avisa no grupo de admins — sem precisar de nenhum comando manual. Isso vale mesmo depois de reiniciar o bot: o estado do banimento está no banco, não em memória.

## Sobre identidade (LID) — por que isso importa

Desde meados de 2026 o WhatsApp passou a identificar participantes de grupo por um ID opaco (`@lid`), que **não tem relação com o número de telefone**. Isso quer dizer que, dependendo do momento, o WhatsApp pode entregar o mesmo usuário ora como `@lid`, ora como `@s.whatsapp.net` (o formato baseado em telefone).

O bot resolve isso automaticamente ([`src/infra/bot/utils/jid.ts`](../src/infra/bot/utils/jid.ts)) antes de gravar ou consultar um banimento: sempre traduz pra um JID de telefone canônico, usando primeiro os metadados do grupo (que já trazem os dois formatos por participante) e, se precisar, a store oficial de mapeamento do próprio Baileys (`sock.signalRepository.lidMapping`). Na prática isso significa que não importa se o admin marcou/respondeu a pessoa numa mensagem endereçada por `@lid` ou por número — o banimento é o mesmo registro, reconhecido do mesmo jeito na hora de checar reentrada.

Esse era, inclusive, o bug raiz que fazia o sistema de banimento antigo não funcionar mais: a versão anterior tentava resolver telefone↔lid lendo arquivos que ela mesma inventava (`lid-mapping-<numero>.json` dentro da pasta `auth/`), que não é como o Baileys realmente guarda esse mapeamento.
