---
title: Comandos
---

# Comandos

Prefixo padrão: `$` (configurável via `BOT_PREFIX`).

## `$ajuda` (ou `$help`)

Mostra um resumo rápido dos comandos mais usados direto no WhatsApp, com o link pra essa documentação completa. Não exige nenhuma permissão — funciona pra qualquer pessoa, em qualquer grupo ou no privado, justamente pra quem ainda não sabe usar o bot conseguir se virar sozinho.

```
$ajuda
```

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

Todo `$ban`, auto-remoção por reentrada e `$banedit` manda uma cópia do log nesse grupo.

## `$ban`

Bane um membro de um grupo. Aceita o alvo por **menção** ou **respondendo à mensagem dele**.

```
$ban @user [permanente|temporario|comunidade] [motivo]
$ban [permanente|temporario|comunidade] [motivo]   ← respondendo a uma mensagem do membro
```

- Tipo é opcional — padrão é `temporario` (7 dias).
- Motivo é opcional — padrão "Não informado".
- Não é possível banir um admin do grupo.

Exemplos:
```
$ban @5541999999999 permanente flood
$ban comunidade spam repetido em vários grupos
```
(respondendo à mensagem de alguém) 
```
$banedit @5541999999999 tipo comunidade
```

Veja o significado de cada tipo em [Como o Banimento Funciona](banimentos.md).

## `$unban`

Remove **todos** os banimentos de um usuário, em qualquer grupo. Aceita **menção**, **reply** a uma mensagem antiga da pessoa (funciona mesmo se ela já tiver sido removida do grupo) ou o número de telefone completo como alternativa.

```
$unban @user
$unban 5541995850310   ← se não quiser/puder marcar a pessoa
```
(ou responda a uma mensagem antiga dela com `$unban`, sem argumento nenhum)

## `$bans`

Lista todos os usuários banidos atualmente (qualquer grupo), com número, tipo, motivo e data de expiração quando aplicável. Quando disponível, mostra também o nome público (`notify`) da pessoa ao lado do número, capturado no momento do `$ban` — bans feitos antes dessa mudança não têm esse nome retroativamente.

```
$bans
```

## `$banedit`

Altera um banimento já existente. Aceita o alvo por menção ou reply, igual ao `$ban`.

```
$banedit @user tipo <permanente|temporario|comunidade>
$banedit @user tempo <7d|12h|30m|45s>
```

- `tipo` muda o tipo do banimento (ex: de temporário pra permanente ou comunidade).
- `tempo` redefine quando um banimento expira, contando a partir de agora.

Não existe um comando dedicado para "remover só a restrição" — use `$unban` mesmo, ele já cobre isso independente do tipo do banimento.

## `$clear`

Apaga (delete-for-everyone) os comandos digitados pro bot e as respostas dele **nesse mesmo grupo** — incluindo o próprio `$clear`. Não afeta outros grupos nem o log no grupo de admins (a menos que `$clear` seja rodado ali dentro).

```
$clear
```

- Só apaga mensagens rastreadas desde que o bot está de pé — mensagens de antes de um restart não entram na limpeza.
- Depende do bot ser admin do grupo (mesmo requisito de apagar mensagem de terceiros no WhatsApp) — sem isso, só consegue apagar as próprias mensagens dele.
- O WhatsApp tem um limite de tempo pra "apagar para todos"; mensagens muito antigas podem falhar silenciosamente (fica registrado no log do bot, não no grupo).

## `$status`

Diagnóstico rápido: número conectado, quantos grupos de admin estão registrados e quantos banimentos estão ativos (mais o histórico total). Principal uso: confirmar que uma [troca de número](troca-de-numero.md) foi bem-sucedida.

```
$status
```
