# Checklist de testes — bot-whatsapp

Build do GitHub Pages confirmado (`built`, sem erro). Todo o trabalho concluído está no ar. Teste na prática e confira se o comportamento bate com o esperado.

## 1. Reação a comandos

- [ ] Mandar um comando que não existe (ex: `$xyz`) → reage ❌.
- [ ] Mandar um comando válido (ex: `$ajuda`) → reage ✅ na hora. Alguns comandos trocam a ✅ por uma reação própria ao terminar (ex: `$advertir` vira ⚠️).

## 2. Banimento

- [ ] `$ban @pessoa temporario 1m teste` no grupo → reage ✅, responde no grupo (mostrando "Expira: ..." em horário de Brasília), e chega cópia no grupo de admins. Depois de 1 min, peça pra ela reentrar → deve ser barrada/removida automaticamente.
- [ ] Depois que o mesmo ban de 1 min expirar, **sem ela pedir pra voltar** → dentro de até 5 min o bot deve readicionar sozinho e avisar ✅ no grupo de admins (ou ⚠️ com link de convite, se a readição direta falhar por privacidade).
- [ ] `$ban @pessoa temporario 7d motivo qualquer` → duração customizada funciona sem precisar de `$banedit` depois.
- [ ] `$ban @pessoa comunidade teste` → remove a pessoa de **todos os grupos da All Stack Community** (com pausa entre cada um — não é instantâneo). Não deve afetar nenhum outro grupo/community onde o bot também participa.
- [ ] `$unban @pessoa` (ou reply, ou `$unban 5541...`) → remove todos os bans dela **e** readiciona ela automaticamente no(s) grupo(s) de onde foi removida (avisa ✅ ou ⚠️+link no grupo de admins).
- [ ] `$bans` → lista com número, tipo, motivo, expiração (horário de Brasília) e nome (se capturado).
- [ ] `$banedit @pessoa tipo permanente` / `$banedit @pessoa tempo 7d` → altera o ban existente.
- [ ] Tentar rodar qualquer um desses fora do grupo de admins, ou sem ser admin do grupo → deve recusar explicando qual critério faltou.

## 3. Utilidade

- [ ] `$clear` → apaga os comandos/respostas trocados com o bot naquele grupo.
- [ ] `$status` → mostra número conectado, grupos de admin, banimentos ativos/histórico.
- [ ] `$ajuda` (qualquer pessoa, qualquer grupo/privado) → lista rápida + link da doc.

## 4. Advertências

- [ ] `$advertir @pessoa motivo` 3 vezes no mesmo mês → na 3ª, deve banir automaticamente (temporário 7 dias) sem precisar de `$ban`.
- [ ] `$advertir` respondendo a uma mensagem da pessoa (sem mencionar) → funciona igual, e o motivo não deve vir com "@numero" grudado no início.
- [ ] Repita o ciclo de 3 advertências uma **segunda vez** com a mesma pessoa, no mesmo grupo → o banimento automático deve ser de 30 dias (não 7).
- [ ] Uma **terceira vez** → banimento permanente, com aviso extra no grupo de admins pra avaliarem se vira banimento de comunidade.
- [ ] No aviso de qualquer banimento automático (por advertência ou por IA) no grupo de admins: **reaja ❌** → deve desbanir, readicionar a pessoa, e postar confirmação dizendo que foi revisão humana que reverteu.
- [ ] Mesma coisa, mas **respondendo com um texto** em vez de reagir → a confirmação deve incluir esse texto como motivo.

## 5. Regras e descrição

- [ ] `$regras` → aplica o link das regras na descrição de todos os grupos **da All Stack Community** que ainda não têm (reage ✅, resume quantos atualizou, cópia no grupo de admins). Não deve tocar em nenhum outro grupo/community.
- [ ] Editar manualmente a descrição de um grupo da All Stack pelo WhatsApp → deve aparecer uma proposta de votação (antes/depois) no grupo de admins, pedindo ✅/❌.
  - [ ] Maioria ✅ → fica a mudança nova.
  - [ ] Maioria ❌ → reverte pra versão antiga e trava o grupo por 7 dias — tente editar de novo durante esse período pra confirmar que o bot reverte sozinho.
- [ ] Editar a descrição de um grupo que **não** é da All Stack Community → o bot não deve reagir a isso de jeito nenhum.

## 6. Fotos de grupo

- [ ] Grupo da All Stack sem foto onde o bot é admin → dentro de 1h (ou reinício do bot) ganha a logo da All Stack automaticamente.
- [ ] Grupo onde o bot não é admin → não gera mais warning de erro toda hora nos logs.
- [ ] Grupos de fora da All Stack Community → o bot nunca mexe na foto deles.

## 7. Responsáveis e promoção

- [ ] `$grupos` no grupo de admins → lista os grupos da All Stack com número curto (1, 2, 3...).
- [ ] `$responsavel @admin` no grupo → marca ele como responsável (comportamento original, sem número).
- [ ] `$responsavel <id> @admin` **do grupo de admins** (usando um número visto em `$grupos`) → marca a pessoa como responsável pelo grupo referenciado, sem precisar entrar nele. Confirme que só manda **uma** mensagem no grupo de admins (não duplicada).
- [ ] `$promover @pessoa` → promove a admin no WhatsApp, marca como responsável, e publica o anúncio tanto no grupo atual quanto no "Avisos" da Community.
- [ ] Pedido de entrada num grupo (participante não-banido, aprovação manual) → deve mencionar o(s) admin(s) responsável(is) daquele grupo no grupo de admins.
- [ ] Pedido de entrada de alguém já banido (comunidade) → deve rejeitar automaticamente, sem precisar de nenhum admin agir.

## 8. Moderação por IA (silenciosa)

- [ ] Precisa de `GEMINI_API_KEY` configurada no `.env` do servidor — confirme que está lá.
- [ ] Manda uma mensagem clara e óbvia violando as regras em algum grupo da All Stack → na próxima hora cheia, deve gerar advertência ou ban de comunidade, avisado só no grupo de admins (nunca no grupo original).
- [ ] Grupo sem nenhuma mensagem nova desde a última checagem → não deve gerar nenhuma chamada à IA nem log.
- [ ] Mensagens em grupos de fora da All Stack Community nunca entram na moderação.

## 9. Escopo de comunidade

- [ ] Rodar `$home` de novo no grupo de admins → deve responder confirmando a Community detectada automaticamente (🏘️), sem precisar mais do `COMMUNITY_JID` manual no `.env`.
- [ ] Nenhuma ação em massa (regras, foto, `$ban comunidade`, moderação por IA, votação de descrição) deve afetar qualquer grupo fora da All Stack Community, mesmo que o número do bot participe de dezenas de outros grupos/communities.

## 10. Documentação

- [ ] <https://allstack-staff.github.io/bot-whatsapp/> → conferir o toggle técnico/amigável e o toggle claro/escuro (bolinha deslizante), o logo, e os links de cada seção.

## 11. Infra (não dá pra testar pelo WhatsApp, mas vale conferir)

- [ ] Faturamento do GCP ativo e dentro do limite (kill-switch em R$5/R$10 configurado).
- [ ] PM2.io mostrando o bot online no seu próprio dashboard.
- [ ] Logs do servidor mostrando horário de Brasília (`-0300`), não mais UTC.
