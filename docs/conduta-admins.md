---
title: Conduta dos Admins
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>

# Código de Conduta dos Admins

Regras adicionais pra quem administra a comunidade — somam-se às [regras da comunidade](regras.html) (que também valem pra admins, como pra qualquer membro) e complementam a [Governança](governanca.html) (que explica cargos, recrutamento e o processo de decisão em mais detalhe).

## Recrutamento

1. Qualquer admin de comunidade pode indicar um membro pra virar admin, baseado em: tempo de comunidade, participação construtiva, e entendimento demonstrado das regras.
2. A indicação precisa de consenso ou maioria dos admins de comunidade ativos, discutido no grupo de admins — decisão humana, não automatizada.
3. Combinado, a promoção é feita com `$asb promover @pessoa` (veja [Comandos](comandos.html#asb-promover)).

## Responsabilidades

1. **Admin de comunidade**: moderar qualquer grupo, revisar decisões da moderação por IA (reagir ❌ quando errada), votar em mudanças de descrição e em propostas de regra (`$asb propor`), participar do recrutamento e remoção de outros admins.
2. **Admin responsável por um grupo**: ser o primeiro ponto de contato daquele grupo — avaliar pedidos de entrada roteados pelo bot, zelar pelas regras específicas do grupo (se houver), manter a descrição do grupo com o link das regras.
3. Todo admin, independente do papel: conhecer as regras da comunidade e, se responsável por um grupo, as regras específicas dele. Usar `$asb ajuda` ou esta documentação sempre que precisar confirmar algo antes de agir.

## Número de admins de comunidade

O número de admins de comunidade deve ser sempre **ímpar** — garante critério de desempate em qualquer votação entre eles. Isso não é bloqueado pelo bot (promover/remover continua funcionando mesmo se resultar em número par), mas o bot monitora sozinho e avisa uma vez no grupo de admins quando detecta que ficou par, sem repetir o aviso toda hora enquanto não for corrigido.

## Toda ação administrativa é revisável

Qualquer ação administrativa — `$asb ban`, `$asb advertir`, remover/promover/rebaixar alguém direto pelo WhatsApp, ou rejeitar um pedido de entrada — gera um aviso no grupo de admins. Um admin de comunidade pode reverter, mas **sempre com motivo em texto, nunca só reagindo**: é esse texto que a IA avalia como embasado ou não nas regras antes de aplicar a reversão de verdade.

- **Motivo embasado** (a IA concorda que se sustenta numa regra real): a reversão é aplicada na hora — é uma **decisão monocrática**, então também abre uma votação de ratificação entre os *outros* admins de comunidade (✅ ratifica, ❌ derruba). Enquanto não houver maioria nem pra um lado nem pro outro, a decisão de quem reverteu continua valendo. Maioria ❌ desfaz a reversão (a ação original volta a valer).
- **Motivo não embasado**: a reversão **não é aplicada**, o admin recebe no privado a explicação da IA sobre o que faltou, e a ação original permanece.
- **Fundador**: única exceção — pode embasar como qualquer outro admin, mas se preferir, a decisão dele vale mesmo que a IA não considere embasada (não entra em ratificação também). É a válvula de escape pra quando a IA erra o julgamento ou o caso é urgente demais pra esperar.

## Conduta proibida

1. **Usar o cargo pra benefício próprio ou de terceiros** — favorecer, proteger de punição, ou dar tratamento diferente a alguém por relação pessoal.
2. **Punir fora da classificação das regras** — banir ou advertir por critério próprio quando as [regras](regras.html) já definem a punição pra aquele caso. Dúvida sobre classificação se resolve discutindo no grupo de admins, não decidindo sozinho contra o que está escrito.
3. **Reverter uma punição ou ação administrativa sem motivo embasado nas regras** — o bot exige texto (não só reação) e a IA confere o embasamento antes de aplicar; só o fundador tem exceção (veja acima).
4. **Compartilhar conteúdo do grupo de admins fora dele** sem autorização dos demais.
5. **Tentar mudar a descrição de um grupo travado** (rejeitada antes, travada por 7 dias) pra burlar a votação — o bot reverte automaticamente, mas a tentativa em si já é uma violação deste código.
6. **Deixar pendências roteadas pelo bot sem resposta** por tempo excessivo (ex: pedido de entrada esperando avaliação) sem repassar pra outro admin.
7. **Decidir sozinho sobre um caso em que é parte envolvida** — se o admin é quem denunciou, quem foi denunciado, ou tem relação direta com a pessoa envolvida, deve se abster de votar/decidir sobre aquele caso específico.
8. **Tratar grupos de forma desigual** sem justificativa — um admin de comunidade modera todos os grupos com o mesmo critério, não só os que prefere.

## Quando um admin pode perder o privilégio

- Violar qualquer item deste código de conduta, ou as [regras da comunidade](regras.html) — mesmo critério aplicado a qualquer membro, com o mesmo rigor (ou maior, dado o cargo de confiança).
- Inatividade prolongada sem aviso, a critério dos demais admins de comunidade.
- Maioria dos admins de comunidade vota pela remoção, discutido no grupo de admins (mesmo mecanismo usado pra aprovar mudança de descrição: votação por reação ✅/❌).
- Perder o cargo de "admin responsável por um grupo" não afeta necessariamente o de "admin de comunidade", e vice-versa — são avaliados separadamente, já que são papéis distintos (veja [Governança](governanca.html#cargos-e-responsabilidades)).

## Teste de conhecimento

Antes de assumir como admin, vale fazer a [provinha de conhecimento das regras](prova-admin.html) — não é obrigatório, mas ajuda a confirmar que os conceitos principais (classificação de punição, papéis, quando algo pode ser revertido) estão claros.

---

Regras da comunidade: veja [Regras](regras.html). Regras específicas por grupo: veja [Regras por Grupo](regras-grupos.html). Cargos, recrutamento em detalhe, e criação de grupo: veja [Governança](governanca.html).
