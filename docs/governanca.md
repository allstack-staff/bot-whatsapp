---
title: Governança
---

<a href="./"><img src="assets/logo.jpg" alt="All Stack" width="48" style="border-radius:8px"></a>

# Governança da All Stack Community

Como a comunidade se organiza — quem vira admin, quando um grupo pode existir, e quem responde pelo quê. Isso é um ponto de partida; ajuste conforme a comunidade crescer. Regras de conduta específicas de admin (o que é permitido/proibido no dia a dia do cargo) estão no [Código de Conduta dos Admins](conduta-admins.html).

## Cargos e responsabilidades

| Cargo | Responsabilidade | Permissões |
|---|---|---|
| **Fundador(a)** | Direção geral da comunidade, decide em última instância quando não há consenso entre admins. | Todas. |
| **Admin de comunidade** | Modera qualquer grupo, aprova/rejeita mudanças de descrição, recruta e remove outros admins junto com os demais. | Admin em todos os grupos + membro do grupo de admins. |
| **Admin responsável por um grupo** | Primeiro ponto de contato daquele grupo específico — avalia pedidos de entrada, zela pela regra específica do grupo, é avisado de pendências pelo bot. | Admin daquele grupo. Pode não ser admin de outros grupos. |

Um admin pode acumular "admin de comunidade" com ser "responsável" por um ou mais grupos específicos.

## Como um admin é recrutado

1. **Indicação** — qualquer admin de comunidade pode indicar um membro pra virar admin, baseado em: tempo de comunidade, participação construtiva, e ter demonstrado entendimento das regras (na prática, moderando de forma informal ou ajudando outros membros).
2. **Aprovação** — a indicação precisa de consenso/maioria dos admins de comunidade ativos, discutido no grupo de admins. Isso ainda é uma decisão humana — o bot não vota por vocês nessa etapa (diferente da aprovação de mudança de descrição, essa sim automatizada por reação).
3. **Promoção** — combinado, um admin roda `$asb promover @pessoa` no grupo que ela vai ficar responsável. O bot promove no WhatsApp, marca a responsabilidade, e publica o anúncio automaticamente no grupo "Avisos" da comunidade e nesse grupo. Veja [Comandos](comandos.md#asb-promover).

## Quando um admin pode ser removido

Violação das regras da comunidade, violação do código de conduta, inatividade prolongada, ou maioria dos admins de comunidade votando pela remoção — veja o [Código de Conduta dos Admins](conduta-admins.html) pra referência completa.

## Quando um grupo pode ser criado

Um grupo novo da comunidade deve:

1. Ter um **propósito claro e específico**, que não seja já coberto por um grupo existente (evita fragmentação).
2. Ter pelo menos **um admin responsável** definido antes ou no momento da criação.
3. Ser vinculado à Community do WhatsApp da All Stack (pra aparecer nas ferramentas de gestão do bot).
4. Ter a descrição configurada com o link das [regras da comunidade](regras.html) (`$asb regras`, uma vez que o bot for adicionado como admin). Se o grupo tiver regras próprias, elas precisam ser aprovadas internamente antes de entrar em [Regras por Grupo](regras-grupos.html) — é de lá que o bot lê pra aplicar na moderação por IA.

Grupos que ficarem sem admin responsável por muito tempo, ou sem atividade, podem ser arquivados/desvinculados a critério dos admins de comunidade.

## Pendências e responsabilidade por grupo

O bot associa cada admin a um ou mais grupos via `$asb responsavel @admin` (pra um admin que já existe) ou `$asb promover @pessoa` (que já inclui isso). Usa essa associação pra rotear avisos — por exemplo, quando alguém pede pra entrar num grupo com aprovação manual, o bot marca o(s) admin(s) responsável(is) por aquele grupo no grupo de admins, em vez de avisar todo mundo genericamente. Veja [Comandos](comandos.md).
