---
title: Comandos
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>

# Comandos

Prefixo padrão: `$` (configurável via `BOT_PREFIX`).

## `$ajuda` (ou `$help`)

Mostra um resumo rápido dos comandos mais usados direto no WhatsApp, com o link pra essa documentação completa. Não exige nenhuma permissão — funciona pra qualquer pessoa, em qualquer grupo ou no privado, justamente pra quem ainda não sabe usar o bot conseguir se virar sozinho.

```
$ajuda
```

Exemplo:
```
$ajuda
```
→ o bot responde na hora com a lista de comandos principais e o link da doc.

## Quem pode usar

Todo comando de administração exige **os dois critérios ao mesmo tempo**:

1. Ser admin do grupo onde o comando foi digitado.
2. Estar (como membro, admin ou não) no grupo registrado como grupo de admins via `$home`.

Se faltar qualquer um dos dois, o bot recusa com uma mensagem explicando qual critério falhou.

## `$home`

Registra o grupo atual como grupo de administração/logs. Precisa ser rodado uma vez, dentro do grupo de admins, por um admin desse grupo.

```
$home
```

Exemplo (dentro do grupo "Admins All Stack"):
```
$home
```
→ `✅ Grupo registrado como admin/log.`

Todo `$ban`, auto-remoção por reentrada e `$banedit` manda uma cópia do log nesse grupo.

## `$ban`

Bane um membro de um grupo. Aceita o alvo por **menção** ou **respondendo à mensagem dele**.

```
$ban @user [permanente|temporario|comunidade] [motivo]
```

- Tipo é opcional — padrão é `temporario` (7 dias).
- Motivo é opcional — padrão "Não informado".
- Não é possível banir um admin do grupo.

Exemplos:
```
$ban @5541999999999 permanente flood
$ban comunidade spam repetido em vários grupos
```
Respondendo à mensagem de alguém, sem precisar mencionar:
```
$ban temporario 3 dias fazendo propaganda fora de contexto
```

Veja o significado de cada tipo em [Como o Banimento Funciona](banimentos.md).

## `$unban`

Remove **todos** os banimentos de um usuário, em qualquer grupo. Aceita **menção**, **reply** a uma mensagem antiga da pessoa (funciona mesmo se ela já tiver sido removida do grupo) ou o número de telefone completo como alternativa.

```
$unban @user
```

Exemplos:
```
$unban @5541995850310
$unban 5541995850310   ← se não quiser/puder marcar a pessoa
```
(ou responda a uma mensagem antiga dela com `$unban`, sem argumento nenhum)

## `$bans`

Lista todos os usuários banidos atualmente (qualquer grupo), com número, tipo, motivo e data de expiração quando aplicável. Quando disponível, mostra também o nome público (`notify`) da pessoa ao lado do número, capturado no momento do `$ban` — bans feitos antes dessa mudança não têm esse nome retroativamente.

```
$bans
```

Exemplo:
```
$bans
```
→
```
📋 Usuários Banidos (2)

1. 554195850310 (Baiano) — PERMANENTE
   Motivo: flood
2. 554199990099 — TEMPORARIO (expira: 02/09/2026 14:00)
   Motivo: propaganda fora de contexto
```

## `$banedit`

Altera um banimento já existente. Aceita o alvo por menção ou reply, igual ao `$ban`.

```
$banedit @user tipo <permanente|temporario|comunidade>
$banedit @user tempo <7d|12h|30m|45s>
```

- `tipo` muda o tipo do banimento (ex: de temporário pra permanente ou comunidade).
- `tempo` redefine quando um banimento expira, contando a partir de agora.

Exemplos:
```
$banedit @5541999999999 tipo comunidade
$banedit @5541999999999 tempo 7d
```

Não existe um comando dedicado para "remover só a restrição" — use `$unban` mesmo, ele já cobre isso independente do tipo do banimento.

## `$clear`

Apaga (delete-for-everyone) os comandos digitados pro bot e as respostas dele **nesse mesmo grupo** — incluindo o próprio `$clear`. Não afeta outros grupos nem o log no grupo de admins (a menos que `$clear` seja rodado ali dentro).

```
$clear
```

Exemplo:
```
$clear
```
→ some com todo comando/resposta trocado com o bot naquele grupo, incluindo essa mensagem.

- Só apaga mensagens rastreadas desde que o bot está de pé — mensagens de antes de um restart não entram na limpeza.
- Depende do bot ser admin do grupo (mesmo requisito de apagar mensagem de terceiros no WhatsApp) — sem isso, só consegue apagar as próprias mensagens dele.
- O WhatsApp tem um limite de tempo pra "apagar para todos"; mensagens muito antigas podem falhar silenciosamente (fica registrado no log do bot, não no grupo).

## `$status`

Diagnóstico rápido: número conectado, quantos grupos de admin estão registrados e quantos banimentos estão ativos (mais o histórico total). Principal uso: confirmar que uma [troca de número](troca-de-numero.md) foi bem-sucedida.

```
$status
```

Exemplo:
```
$status
```
→
```
🤖 Status do bot
Número conectado: 555181061198
Grupos de admin registrados: 1
Banimentos ativos: 2 (histórico total: 5)
```

## Comandos de administração da comunidade

Além dos comandos acima (que já exigem admin + estar no grupo de admins), esses dois lidam com a comunidade como um todo — mais sensíveis, use com atenção.

### `$advertir`

Dá uma advertência a alguém nesse grupo. **3 ou mais advertências no mesmo mês** (o contador reseta todo mês) aplicam automaticamente um banimento temporário de 7 dias — sem precisar de mais nenhum comando. A moderação automática por IA usa o mesmo contador.

```
$advertir @user [motivo]
```

Exemplo:
```
$advertir @5541999999999 flood no grupo pela segunda vez essa semana
```
→ `⚠️ @5541999999999 advertido (2/3 esse mês).` — e, se fosse a 3ª, seguiria com `🚫 ...banido automaticamente (temporário, 7 dias)`.

### `$regras`

Aplica o link das [regras da comunidade](regras.md) na descrição de **todos os grupos** que o bot administra, na próxima linha livre — pula quem já tem o link. É uma ação em massa: o bot espaça as atualizações entre os grupos de propósito, pra não parecer uma rajada de mudanças vindas do mesmo número.

```
$regras
```

Exemplo:
```
$regras
```
→ `✅ Link das regras aplicado em 6 grupo(s) (2 já tinham o link).`
