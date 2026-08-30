---
title: Comandos
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>

# Comandos

Prefixo padrão: `$` (configurável via `BOT_PREFIX`).

**Reação automática:** ao ver uma mensagem começando com `$`, o bot reage imediatamente — ✅ se reconheceu o comando (mesmo que depois recuse por falta de permissão) ou ❌ se digitou algo que não existe (ex: `$banir` em vez de `$ban`). Alguns comandos substituem a ✅ por uma reação mais específica assim que terminam de processar (ex: ⚠️ no `$advertir`) — isso é esperado, é só a confirmação virando o resultado final.

## `$ajuda` (ou `$help`)

Mostra um resumo rápido dos comandos mais usados direto no WhatsApp, com o link pra essa documentação completa. Não exige nenhuma permissão — funciona pra qualquer pessoa, em qualquer grupo ou no privado, justamente pra quem ainda não sabe usar o bot conseguir se virar sozinho.

```
$ajuda
```

**Comportamento:** responde só no grupo/privado onde foi chamado. Não reage, não manda cópia pra lugar nenhum.

Exemplo:
```
$ajuda
```
→ o bot responde na hora com a lista de comandos principais e o link da doc.

## Quem pode usar

Todo comando de administração exige **os dois critérios ao mesmo tempo**:

1. Ser admin do grupo onde o comando foi digitado.
2. Estar (como membro, admin ou não) no grupo registrado como grupo de admins via `$home`.

Se faltar qualquer um dos dois, o bot recusa com uma mensagem explicando qual critério falhou — só no grupo onde o comando foi tentado, nada vai pro grupo de admins nesse caso.

## `$home`

Registra o grupo atual como grupo de administração/logs. Precisa ser rodado uma vez, dentro do grupo de admins, por um admin desse grupo. Se esse grupo for vinculado a uma Community do WhatsApp, o bot também detecta e grava qual é a Community "oficial" — toda ação em massa (`$regras`, foto automática, `$ban comunidade`, moderação por IA) fica restrita só aos grupos dela, nunca a outros grupos/communities onde o número do bot só por acaso participa.

```
$home
```

**Comportamento:** responde só no próprio grupo (é ele que está sendo registrado). Não reage, não manda cópia — ainda não existe grupo de log até esse comando rodar.

Exemplo (dentro do grupo "Admins All Stack"):
```
$home
```
→ `✅ Grupo registrado como admin/log.\nID: ...\n🏘️ Community detectada — ações em massa ficam restritas só aos grupos dela.`

Se o grupo de admins não estiver numa Community, o bot avisa e ações em massa só funcionam com `COMMUNITY_JID` configurado manualmente no servidor (veja [Deploy](deploy.md)). Se você mudar de Community ou o grupo de admins, rode `$home` de novo no grupo certo pra atualizar a detecção.

Todo `$ban`, auto-remoção por reentrada e `$banedit` manda uma cópia do log nesse grupo a partir daqui.

## `$ban`

Bane um membro de um grupo. Aceita o alvo por **menção** ou **respondendo à mensagem dele**.

```
$ban @user [permanente|temporario|comunidade] [duracao] [motivo]
```

- Tipo é opcional — padrão é `temporario`.
- Duração é opcional e só vale pra `temporario` — formato `7d` (dias), `12h` (horas), `30m` (minutos) ou `45s` (segundos). Sem ela, o padrão é 7 dias.
- Motivo é opcional (todas as palavras depois do tipo/duração) — padrão "Não informado". Não precisa de aspas pra motivo com várias palavras.
- Não é possível banir um admin do grupo.

**Comportamento:** reage ✅ na mensagem do comando, responde com o resumo do banimento (incluindo quando expira, se for `temporario`) **no grupo onde rodou**, e manda uma cópia da mesma mensagem pro **grupo de admins**. Se o tipo for `comunidade`, remove a pessoa de todos os grupos que o bot administra (com pausa entre cada remoção).

Exemplos:
```
$ban @5541999999999 permanente flood
$ban comunidade spam repetido em vários grupos
$ban @5541999999999 temporario 1m banimento de teste, expira em 1 minuto
```
Respondendo à mensagem de alguém, sem precisar mencionar:
```
$ban temporario 3d fazendo propaganda fora de contexto
```

Veja o significado de cada tipo em [Como o Banimento Funciona](banimentos.md).

## `$unban`

Remove **todos** os banimentos de um usuário, em qualquer grupo, e **readiciona ela automaticamente** aos grupos de onde foi removida (reverte o efeito do ban de verdade — não é só apagar o registro). Aceita **menção**, **reply** a uma mensagem antiga da pessoa (funciona mesmo se ela já tiver sido removida do grupo) ou o número de telefone completo como alternativa.

```
$unban @user [motivo]
```

- Motivo é **obrigatório** — salvo se quem roda o comando for admin do próprio grupo de administração ("admin de comunidade"), caso em que é opcional.

**Comportamento:** reage ✅, responde no grupo onde rodou, e manda cópia pro grupo de admins. Além disso, tenta readicionar a pessoa em cada grupo afetado (todos os da comunidade, se o ban era `comunidade`; só o grupo específico, se era `permanente`/`temporario`) — avisa ✅ no grupo de admins se conseguiu, ⚠️ com link de convite se não conseguiu (privacidade da pessoa pode impedir add direto).

Exemplos:
```
$unban @5541995850310 reavaliado, sem novas violações
$unban 5541995850310 reavaliado, sem novas violações   ← se não quiser/puder marcar a pessoa
```
(ou responda a uma mensagem antiga dela com `$unban motivo aqui`)

## `$bans`

Lista todos os usuários banidos atualmente (qualquer grupo), com número, tipo, motivo e data de expiração quando aplicável. Quando disponível, mostra também o nome público (`notify`) da pessoa ao lado do número, capturado no momento do `$ban` — bans feitos antes dessa mudança não têm esse nome retroativamente.

```
$bans
```

**Comportamento:** responde só no grupo onde rodou. Não manda cópia pro grupo de admins (é uma consulta, não uma ação).

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

**Comportamento:** reage ✅, responde no grupo onde rodou, e manda cópia pro grupo de admins.

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

**Comportamento:** não deixa resposta nenhuma de propósito (o próprio efeito — tudo sumindo — já é a confirmação). Não manda nada pro grupo de admins.

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

**Comportamento:** responde só no grupo onde rodou. Não manda cópia pro grupo de admins.

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

Além dos comandos acima (que já exigem admin + estar no grupo de admins), esses lidam com a comunidade como um todo — mais sensíveis, use com atenção.

### `$advertir`

Dá uma advertência a alguém nesse grupo. Aceita o alvo por **menção** ou **respondendo à mensagem dele**, igual ao `$ban`. **3 ou mais advertências no mesmo mês** (o contador reseta todo mês) aplicam automaticamente um banimento temporário de 7 dias — sem precisar de mais nenhum comando. A moderação automática por IA usa o mesmo contador.

```
$advertir @user [motivo]
```

**Comportamento:** reage ⚠️, responde no grupo onde rodou com a contagem atual (`X/3`), e manda cópia pro grupo de admins. Se bater 3, o banimento automático que segue reage/responde/loga como um `$ban` normal, na sequência.

Exemplo:
```
$advertir @5541999999999 flood no grupo pela segunda vez essa semana
```
→ `⚠️ @5541999999999 advertido (2/3 esse mês).` — e, se fosse a 3ª, seguiria com `🚫 ...banido automaticamente (temporário, 7 dias)`.

Respondendo à mensagem de alguém, sem precisar mencionar:
```
$advertir flood no grupo pela segunda vez essa semana
```

### `$regras`

Aplica o link das [regras da comunidade](regras.md) na descrição de **todos os grupos** que o bot administra, na próxima linha livre — pula quem já tem o link. É uma ação em massa: o bot espaça as atualizações entre os grupos de propósito, pra não parecer uma rajada de mudanças vindas do mesmo número.

```
$regras
```

**Comportamento:** reage ✅ e responde no grupo onde rodou com o total (quantos grupos atualizados/já tinham). Manda cópia pro grupo de admins. Não notifica os outros grupos individualmente — só a descrição deles muda, silenciosamente.

Exemplo:
```
$regras
```
→ `✅ Link das regras aplicado em 6 grupo(s) (2 já tinham o link).`

### `$grupos`

Lista os grupos da All Stack Community com um **ID curto e estável** (1, 2, 3...) — pra referenciar um grupo em `$responsavel` sem precisar colar o JID nem entrar nele. Atualiza a lista (nomes/novos grupos) toda vez que roda.

```
$grupos
```

**Comportamento:** reage ✅ e responde no grupo onde rodou com a lista numerada. Não manda cópia pro grupo de admins (é uma consulta).

Exemplo:
```
$grupos
```
→
```
📋 Grupos da comunidade (4)
1. SysAdmins
2. DevOps
3. Java Developers
4. AllStack - Web Development

Use o número pra referenciar o grupo, ex: $responsavel 1 @admin
```

### `$responsavel`

Marca um admin como responsável por um grupo — usado pra rotear avisos de pendência (ex: pedido de entrada) e pra saber quem anunciar quando alguém é promovido.

```
$responsavel [id] @admin
```

- Sem `id`: usa o grupo atual (precisa rodar dentro dele).
- Com `id` (veja `$grupos`): referencia outro grupo pelo número — dá pra rodar isso **direto do grupo de admins**, sem precisar entrar no grupo alvo.

**Comportamento:** reage ✅, responde no grupo onde rodou. Manda cópia pro grupo de admins só se o comando não tiver rodado lá mesmo (senão seria a mesma mensagem duas vezes). Não manda nada pro próprio admin marcado além disso.

Exemplo (dentro do grupo):
```
$responsavel @5541988887777
```
→ `✅ @5541988887777 agora é responsável pelo grupo *Nome do Grupo*.`

Exemplo (do grupo de admins, referenciando pelo ID visto em `$grupos`):
```
$responsavel 3 @5541988887777
```
→ marca a pessoa como responsável pelo grupo 3 (`Java Developers`, no exemplo acima), sem precisar sair do grupo de admins.

### `$promover`

Promove alguém a admin do grupo atual (via WhatsApp mesmo), marca essa pessoa como responsável pelo grupo (equivalente a rodar `$responsavel` nela), e anuncia a promoção.

```
$promover @user
```

**Comportamento:** promove no WhatsApp, reage ✅, responde no grupo onde rodou, **e também publica o mesmo anúncio no grupo "Avisos" da Community** (o grupo que o WhatsApp cria automaticamente pra toda Community — detectado sozinho, não precisa configurar) — além da cópia de sempre no grupo de admins.

Exemplo:
```
$promover @5541988887777
```
→ no grupo atual e no "Avisos": `🎉 @5541988887777 foi promovido(a) a admin — agora é responsável pelo grupo *Nome do Grupo*.`

### Aprovação automática de mudança de descrição

Isso não é um comando — é automático. Sempre que um admin edita a descrição de um grupo pelo próprio WhatsApp (fora do `$regras`), o bot detecta e posta a mudança (antes/depois) **no grupo de admins**, pedindo votação por reação: **✅ aprova, ❌ rejeita**.

**Comportamento:** nada aparece no grupo cuja descrição mudou — toda a interação (proposta + votos) acontece no grupo de admins. Se a maioria rejeitar, a versão anterior volta (o bot reverte direto no grupo original) e esse grupo fica **travado por 7 dias**: qualquer tentativa de mudar a descrição nesse período é detectada e revertida automaticamente (não tem como impedir um admin de editar pelo WhatsApp, só reverter depois).

### Moderação automática por IA

Também não é um comando. A cada hora, se houve mensagem nova em algum grupo desde a última checagem (senão nem chama a IA), o bot avalia o conteúdo contra as regras da comunidade usando o Gemini (grátis, configurado via `GEMINI_API_KEY` no `.env` — sem a chave, esse ciclo simplesmente não faz nada).

**Comportamento:** nunca responde no grupo onde a violação aconteceu. Violação grave (discriminação, conteúdo explícito, ato ilícito) → banimento de comunidade direto, avisado no grupo de admins. Qualquer outra violação → uma advertência comum (mesmo mecanismo do `$advertir`, mesmo limite de 3/mês), também só avisada no grupo de admins.

### Readição automática ao expirar um banimento temporário

Também não é um comando. A cada 5 minutos, o bot confere se algum banimento `temporario` já expirou — se sim, tenta readicionar a pessoa ao grupo automaticamente, sem esperar ela pedir pra voltar.

**Comportamento:** nunca responde no grupo (a pessoa nem está lá ainda). Sempre avisa no grupo de admins: ✅ se conseguiu readicionar, ⚠️ se não conseguiu (ex: configuração de privacidade da pessoa não permite ser adicionada direto) — nesse caso, o aviso já vem com o link de convite do grupo pra um admin encaminhar na mão.
