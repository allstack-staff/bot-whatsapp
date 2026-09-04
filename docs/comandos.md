---
title: Comandos
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>

# Comandos

Todo comando é invocado como `$asb <comando> [argumentos]` — o `$asb` (All Stack Bot) é fixo e obrigatório antes de qualquer comando; nunca `$ban` sozinho, sempre `$asb ban`. Prefixo (`$`) e comando pai (`asb`) são configuráveis via `BOT_PREFIX` e `BOT_PARENT_COMMAND`.

**Reação automática:** ao ver uma mensagem começando com `$asb `, o bot reage imediatamente — ✅ se reconheceu o comando que vem depois (mesmo que depois recuse por falta de permissão) ou ❌ se o que vem depois não existe (ex: `$asb banir` em vez de `$asb ban`). Mensagens começando só com `$ban` (sem o `$asb` na frente) não acionam nada — não são reconhecidas como comando. Alguns comandos substituem a ✅ por uma reação mais específica assim que terminam de processar (ex: ⚠️ no `$asb advertir`) — isso é esperado, é só a confirmação virando o resultado final.

**Retentativa por reação:** quando uma ação automática do bot falha (ex: não conseguiu remover alguém, reverter uma descrição, aplicar a logo, promover via `$asb assumir`), o aviso no grupo de admins vem com a instrução "Reaja com 🔁 nesta mensagem pra tentar de novo" — qualquer pessoa do grupo de admins pode reagir com 🔁 nessa mensagem específica pra fazer o bot tentar a mesma ação de novo, sem precisar rodar um comando. Se falhar de novo, um novo aviso retentável é postado.

## `$asb ajuda` (ou `$asb help`)

Mostra um resumo rápido dos comandos mais usados direto no WhatsApp, com o link pra essa documentação completa. Não exige nenhuma permissão — funciona pra qualquer pessoa, em qualquer grupo ou no privado, justamente pra quem ainda não sabe usar o bot conseguir se virar sozinho.

```
$asb ajuda
```

**Comportamento:** responde só no grupo/privado onde foi chamado. Não reage, não manda cópia pra lugar nenhum.

Exemplo:
```
$asb ajuda
```
→ o bot responde na hora com a lista de comandos principais e o link da doc.

## Quem pode usar

Todo comando de administração exige **os dois critérios ao mesmo tempo**:

1. Ser admin do grupo onde o comando foi digitado.
2. Estar (como membro, admin ou não) no grupo registrado como grupo de admins via `$asb home`.

Se faltar qualquer um dos dois, o bot recusa com uma mensagem explicando qual critério falhou — só no grupo onde o comando foi tentado, nada vai pro grupo de admins nesse caso.

## `$asb home`

Registra o grupo atual como grupo de administração/logs. Precisa ser rodado uma vez, dentro do grupo de admins, por um admin desse grupo. Se esse grupo for vinculado a uma Community do WhatsApp, o bot também detecta e grava qual é a Community "oficial" — toda ação em massa (`$asb regras`, foto automática, `$asb ban comunidade`, moderação por IA) fica restrita só aos grupos dela, nunca a outros grupos/communities onde o número do bot só por acaso participa.

```
$asb home
```

**Comportamento:** responde só no próprio grupo (é ele que está sendo registrado). Não reage, não manda cópia — ainda não existe grupo de log até esse comando rodar.

Exemplo (dentro do grupo "Admins All Stack"):
```
$asb home
```
→ `✅ Grupo registrado como admin/log.\nID: ...\n🏘️ Community detectada — ações em massa ficam restritas só aos grupos dela.`

Se o grupo de admins não estiver numa Community, o bot avisa e ações em massa só funcionam com `COMMUNITY_JID` configurado manualmente no servidor (veja [Deploy](deploy.md)). Se você mudar de Community ou o grupo de admins, rode `$asb home` de novo no grupo certo pra atualizar a detecção.

Todo `$asb ban`, auto-remoção por reentrada e `$asb banedit` manda uma cópia do log nesse grupo a partir daqui.

## `$asb ban`

Bane um membro de um grupo. Aceita o alvo por **menção** ou **respondendo à mensagem dele**.

```
$asb ban @user [permanente|temporario|comunidade] [duracao] [motivo]
```

- Tipo é opcional — padrão é `temporario`.
- Duração é opcional e só vale pra `temporario` — formato `7d` (dias), `12h` (horas), `30m` (minutos) ou `45s` (segundos). Sem ela, o padrão é 7 dias.
- Motivo é opcional (todas as palavras depois do tipo/duração) — padrão "Não informado". Não precisa de aspas pra motivo com várias palavras.
- Não é possível banir um admin do grupo.

**Comportamento:** reage ✅ na mensagem do comando, responde com o resumo do banimento (incluindo quando expira, se for `temporario`) **no grupo onde rodou**, e manda uma cópia da mesma mensagem pro **grupo de admins**. Se o tipo for `comunidade`, remove a pessoa de todos os grupos que o bot administra (com pausa entre cada remoção).

Exemplos:
```
$asb ban @5541999999999 permanente flood
$asb ban comunidade spam repetido em vários grupos
$asb ban @5541999999999 temporario 1m banimento de teste, expira em 1 minuto
```
Respondendo à mensagem de alguém, sem precisar mencionar:
```
$asb ban temporario 3d fazendo propaganda fora de contexto
```

Veja o significado de cada tipo em [Como o Banimento Funciona](banimentos.md).

## `$asb unban`

Remove **todos** os banimentos de um usuário, em qualquer grupo, e **readiciona ela automaticamente** aos grupos de onde foi removida (reverte o efeito do ban de verdade — não é só apagar o registro). Aceita **menção**, **reply** a uma mensagem antiga da pessoa (funciona mesmo se ela já tiver sido removida do grupo) ou o número de telefone completo como alternativa.

```
$asb unban @user [motivo]
```

- Motivo é **obrigatório** — salvo se quem roda o comando for admin do próprio grupo de administração ("admin de comunidade"), caso em que é opcional.

**Comportamento:** reage ✅, responde no grupo onde rodou, e manda cópia pro grupo de admins. Além disso, tenta readicionar a pessoa em cada grupo afetado (todos os da comunidade, se o ban era `comunidade`; só o grupo específico, se era `permanente`/`temporario`) — avisa ✅ no grupo de admins se conseguiu, ⚠️ com link de convite se não conseguiu (privacidade da pessoa pode impedir add direto).

Exemplos:
```
$asb unban @5541995850310 reavaliado, sem novas violações
$asb unban 5541995850310 reavaliado, sem novas violações   ← se não quiser/puder marcar a pessoa
```
(ou responda a uma mensagem antiga dela com `$asb unban motivo aqui`)

## `$asb bans`

Lista todos os usuários banidos atualmente (qualquer grupo), com número, tipo, motivo e data de expiração quando aplicável. Quando disponível, mostra também o nome público (`notify`) da pessoa ao lado do número, capturado no momento do `$asb ban` — bans feitos antes dessa mudança não têm esse nome retroativamente.

```
$asb bans
```

**Comportamento:** responde só no grupo onde rodou. Não manda cópia pro grupo de admins (é uma consulta, não uma ação).

Exemplo:
```
$asb bans
```
→
```
📋 Usuários Banidos (2)

1. 554195850310 (Baiano) — PERMANENTE
   Motivo: flood
2. 554199990099 — TEMPORARIO (expira: 02/09/2026 14:00)
   Motivo: propaganda fora de contexto
```

## `$asb banedit`

Altera um banimento já existente. Aceita o alvo por menção ou reply, igual ao `$asb ban`.

```
$asb banedit @user tipo <permanente|temporario|comunidade>
$asb banedit @user tempo <7d|12h|30m|45s>
```

- `tipo` muda o tipo do banimento (ex: de temporário pra permanente ou comunidade).
- `tempo` redefine quando um banimento expira, contando a partir de agora.

**Comportamento:** reage ✅, responde no grupo onde rodou, e manda cópia pro grupo de admins.

Exemplos:
```
$asb banedit @5541999999999 tipo comunidade
$asb banedit @5541999999999 tempo 7d
```

Não existe um comando dedicado para "remover só a restrição" — use `$asb unban` mesmo, ele já cobre isso independente do tipo do banimento.

## `$asb clear`

Apaga (delete-for-everyone) os comandos digitados pro bot e as respostas dele **nesse mesmo grupo** — incluindo o próprio `$asb clear`. Não afeta outros grupos nem o log no grupo de admins (a menos que `$asb clear` seja rodado ali dentro).

```
$asb clear
```

**Comportamento:** não deixa resposta nenhuma de propósito (o próprio efeito — tudo sumindo — já é a confirmação). Não manda nada pro grupo de admins.

Exemplo:
```
$asb clear
```
→ some com todo comando/resposta trocado com o bot naquele grupo, incluindo essa mensagem.

- Só apaga mensagens rastreadas desde que o bot está de pé — mensagens de antes de um restart não entram na limpeza.
- Depende do bot ser admin do grupo (mesmo requisito de apagar mensagem de terceiros no WhatsApp) — sem isso, só consegue apagar as próprias mensagens dele.
- O WhatsApp tem um limite de tempo pra "apagar para todos"; mensagens muito antigas podem falhar silenciosamente (fica registrado no log do bot, não no grupo).

## `$asb status`

Diagnóstico rápido: número conectado, quantos grupos de admin estão registrados e quantos banimentos estão ativos (mais o histórico total). Principal uso: confirmar que uma [troca de número](troca-de-numero.md) foi bem-sucedida.

```
$asb status
```

**Comportamento:** responde só no grupo onde rodou. Não manda cópia pro grupo de admins.

Exemplo:
```
$asb status
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

### `$asb advertir`

Dá uma advertência a alguém nesse grupo. Aceita o alvo por **menção** ou **respondendo à mensagem dele**, igual ao `$asb ban`. **3 ou mais advertências no mesmo mês** (o contador reseta todo mês) aplicam automaticamente um banimento — sem precisar de mais nenhum comando. A moderação automática por IA usa o mesmo contador.

O banimento automático escalona por reincidência **nesse grupo**: 1ª vez = temporário 7 dias, 2ª vez = temporário 30 dias, 3ª vez em diante = permanente (com um aviso pros admins avaliarem se deve virar banimento de comunidade — isso não é automático, fica a critério de vocês, usando `$asb banedit ... tipo comunidade`).

```
$asb advertir @user [motivo]
```

**Comportamento:** reage ⚠️, responde no grupo onde rodou com a contagem atual (`X/3`), e manda cópia pro grupo de admins. Se bater 3, o banimento automático que segue reage/responde/loga como um `$asb ban` normal, na sequência — **e pode ser desfeito** direto no grupo de admins (veja abaixo).

Exemplo:
```
$asb advertir @5541999999999 flood no grupo pela segunda vez essa semana
```
→ `⚠️ @5541999999999 advertido (2/3 esse mês).` — e, se fosse a 3ª, seguiria com `🚫 ...banido automaticamente (temporário, 7 dias)`.

Respondendo à mensagem de alguém, sem precisar mencionar:
```
$asb advertir flood no grupo pela segunda vez essa semana
```

### `$asb regras`

Aplica o link das [regras da comunidade](regras.md) na descrição de **todos os grupos** que o bot administra, na próxima linha livre — pula quem já tem o link. É uma ação em massa: o bot espaça as atualizações entre os grupos de propósito, pra não parecer uma rajada de mudanças vindas do mesmo número.

```
$asb regras
```

**Comportamento:** reage ✅ e responde no grupo onde rodou com o total (quantos grupos atualizados/já tinham). Manda cópia pro grupo de admins. Não notifica os outros grupos individualmente — só a descrição deles muda, silenciosamente.

Exemplo:
```
$asb regras
```
→ `✅ Link das regras aplicado em 6 grupo(s) (2 já tinham o link).`

### `$asb grupos`

Lista os grupos da All Stack Community com um **ID curto e estável** (1, 2, 3...) — pra referenciar um grupo em `$asb responsavel` sem precisar colar o JID nem entrar nele. Atualiza a lista (nomes/novos grupos) toda vez que roda.

```
$asb grupos
```

**Comportamento:** reage ✅ e responde no grupo onde rodou com a lista numerada. Não manda cópia pro grupo de admins (é uma consulta).

Exemplo:
```
$asb grupos
```
→
```
📋 Grupos da comunidade (4)
1. SysAdmins
2. DevOps
3. Java Developers
4. AllStack - Web Development

Use o número pra referenciar o grupo, ex: $asb responsavel 1 @admin
```

### `$asb assumir`

Quem já está no grupo de administração pode virar admin de **qualquer** grupo da comunidade na hora, sem precisar que outro admin faça isso manualmente pelo WhatsApp — o bot promove direto.

```
$asb assumir [id]
```

- Sem `id`: promove você no grupo atual (precisa rodar dentro dele, e já ser membro).
- Com `id` (veja `$asb grupos`): promove você no grupo referenciado, de qualquer lugar — inclusive do grupo de admins.

**Comportamento:** reage ✅, responde no grupo onde rodou, e manda cópia pro grupo de admins (só se o comando não tiver rodado lá mesmo). Recusa se você já for admin do grupo, ou não for membro dele.

Exemplo (dentro do grupo):
```
$asb assumir
```
→ `✅ Você agora é admin do grupo *Nome do Grupo*.`

Exemplo (do grupo de admins, por ID):
```
$asb assumir 3
```
→ te promove no grupo 3 (visto em `$asb grupos`), sem precisar sair do grupo de admins.

### `$asb responsavel`

Marca um admin como responsável por um grupo — usado pra rotear avisos de pendência (ex: pedido de entrada) e pra saber quem anunciar quando alguém é promovido.

```
$asb responsavel [id] @admin
```

- Sem `id`: usa o grupo atual (precisa rodar dentro dele).
- Com `id` (veja `$asb grupos`): referencia outro grupo pelo número — dá pra rodar isso **direto do grupo de admins**, sem precisar entrar no grupo alvo.

**Comportamento:** reage ✅, responde no grupo onde rodou. Manda cópia pro grupo de admins só se o comando não tiver rodado lá mesmo (senão seria a mesma mensagem duas vezes). Não manda nada pro próprio admin marcado além disso.

Exemplo (dentro do grupo):
```
$asb responsavel @5541988887777
```
→ `✅ @5541988887777 agora é responsável pelo grupo *Nome do Grupo*.`

Exemplo (do grupo de admins, referenciando pelo ID visto em `$asb grupos`):
```
$asb responsavel 3 @5541988887777
```
→ marca a pessoa como responsável pelo grupo 3 (`Java Developers`, no exemplo acima), sem precisar sair do grupo de admins.

### `$asb promover`

Promove alguém a admin do grupo atual (via WhatsApp mesmo), marca essa pessoa como responsável pelo grupo (equivalente a rodar `$asb responsavel` nela), e anuncia a promoção.

```
$asb promover @user
```

**Comportamento:** promove no WhatsApp, reage ✅, responde no grupo onde rodou, **e também publica o mesmo anúncio no grupo "Avisos" da Community** (o grupo que o WhatsApp cria automaticamente pra toda Community — detectado sozinho, não precisa configurar) — além da cópia de sempre no grupo de admins.

Exemplo:
```
$asb promover @5541988887777
```
→ no grupo atual e no "Avisos": `🎉 @5541988887777 foi promovido(a) a admin — agora é responsável pelo grupo *Nome do Grupo*.`

### Aprovação automática de mudança de descrição

Isso não é um comando — é automático. Sempre que um admin edita a descrição de um grupo pelo próprio WhatsApp (fora do `$asb regras`), o bot detecta e posta a mudança (antes/depois) **no grupo de admins**, pedindo votação por reação: **✅ aprova, ❌ rejeita**.

**Comportamento:** nada aparece no grupo cuja descrição mudou — toda a interação (proposta + votos) acontece no grupo de admins. Se a maioria rejeitar, a versão anterior volta (o bot reverte direto no grupo original) e esse grupo fica **travado por 7 dias**: qualquer tentativa de mudar a descrição nesse período é detectada e revertida automaticamente (não tem como impedir um admin de editar pelo WhatsApp, só reverter depois).

### `$asb moderar`

Roda o ciclo de moderação por IA na hora, sem esperar a próxima checagem automática (que acontece de hora em hora — veja abaixo). Útil pra testar a moderação, ou pra não esperar depois de uma denúncia. O relógio do ciclo automático reinicia a partir desse momento — o próximo automático só vem 1h depois desse `$asb moderar`, não da última vez que rodou sozinho. Sem argumento, avalia toda a comunidade (mesmo escopo do ciclo automático); com um ID (veja `$asb grupos`), avalia só aquele grupo específico.

```
$asb moderar [id]
```

**Comportamento:** reage ✅, responde no grupo onde rodou confirmando que concluiu (com o escopo — "toda a comunidade" ou o nome do grupo — e que o próximo automático foi reagendado pra 1h a partir daí), e manda cópia pro grupo de admins. Se não houver `GEMINI_API_KEY` configurada, recusa com uma mensagem explicando. Se a chamada à IA falhar (ex: erro da API), **não** reporta sucesso nem reagenda — manda o motivo real no grupo de admins e para por aí. Sem mensagem nova no escopo desde a última checagem, roda mas não encontra nada pra avaliar (mesmo comportamento do ciclo automático).

Exemplos:
```
$asb moderar
```
→ `✅ Ciclo de moderação por IA concluído agora (toda a comunidade). Próximo automático em 1h a partir deste.`
```
$asb moderar 3
```
→ `✅ Ciclo de moderação por IA concluído agora (Nome do Grupo). Próximo automático em 1h a partir deste.`

### `$asb anunciar`

Publica um anúncio num grupo da comunidade — o bot "leva" a mensagem até lá, marcando **todo mundo do grupo de destino de forma invisível** (a notificação chega, mas o texto não fica cheio de @números) e preservando negrito/itálico/quebra de linha exatamente como digitado. Só funciona rodado **no grupo de administração** — o anúncio nunca é publicado no mesmo grupo onde o comando foi digitado.

```
$asb anunciar <id> <mensagem>
```

- `id`: número curto do grupo de destino (veja `$asb grupos`).
- `mensagem`: tudo que vier depois do ID, ao pé da letra — pode ter várias linhas e formatação do WhatsApp (`*negrito*`, `_itálico_`, etc).

**Comportamento:** reage ✅, responde no grupo de admins confirmando em qual grupo o anúncio foi publicado, e manda cópia pro grupo de admins (a mesma resposta). A mensagem em si só aparece no grupo de destino — ninguém vê o comando `$asb anunciar` nem quem mandou, além do grupo de admins.

Exemplo (rodado no grupo de admins):
```
$asb anunciar 3 *Manutenção programada*
O bot ficará fora do ar hoje às 20h por cerca de 10 minutos.
```
→ publica essa mensagem (com negrito e quebra de linha preservados) no grupo de ID 3, marcando todo mundo dele sem poluir o texto, e responde `✅ Anúncio publicado no grupo *Nome do Grupo*.` no grupo de admins.

### Moderação automática por IA

Não é um comando (é o ciclo de hora em hora, ou o disparo manual via `$asb moderar` acima). Se houve mensagem nova em algum grupo desde a última checagem (senão nem chama a IA), o bot avalia o conteúdo contra as regras da comunidade usando o Gemini (grátis, configurado via `GEMINI_API_KEY` no `.env` — sem a chave, esse ciclo simplesmente não faz nada).

**Comportamento:** nunca responde no grupo onde a violação aconteceu. Violação grave (discriminação, conteúdo explícito, ato ilícito) → banimento de comunidade direto, avisado no grupo de admins **e revertível** (veja abaixo). Qualquer outra violação → uma advertência comum (mesmo mecanismo do `$asb advertir`, mesmo limite de 3/mês, mesmo escalonamento por reincidência), também só avisada no grupo de admins.

### Desfazer uma punição automática

Também não é um comando (é uma reação a uma mensagem existente). Toda vez que a moderação por IA bane alguém, ou que o acúmulo de advertências dispara um banimento automático, o aviso no grupo de admins vem com a opção de desfazer:

- **Reaja ❌** na mensagem do aviso — desfaz sem motivo registrado.
- **Responda** a mensagem do aviso com um texto — desfaz **com** esse texto registrado como motivo.

**Comportamento:** qualquer uma das duas ações remove o banimento, tenta readicionar a pessoa ao grupo (mesmo mecanismo do `$asb unban`) e posta uma confirmação no grupo de admins deixando claro que foi revisão humana que reverteu — algo como *"A moderação automática identificou um comportamento e baniu @pessoa, mas o admin @fulano revisou e reverteu a medida"* (+ motivo, se veio um). Só funciona enquanto a punição ainda estiver ativa (não desfeita antes) — quem pode reagir/responder é qualquer pessoa do grupo de administração.

### Readição automática ao expirar um banimento temporário

Também não é um comando. A cada 5 minutos, o bot confere se algum banimento `temporario` já expirou — se sim, tenta readicionar a pessoa ao grupo automaticamente, sem esperar ela pedir pra voltar.

**Comportamento:** nunca responde no grupo (a pessoa nem está lá ainda). Sempre avisa no grupo de admins: ✅ se conseguiu readicionar, ⚠️ se não conseguiu (ex: configuração de privacidade da pessoa não permite ser adicionada direto) — nesse caso, o aviso já vem com o link de convite do grupo pra um admin encaminhar na mão.
