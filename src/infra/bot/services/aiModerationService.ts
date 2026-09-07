import { logger } from '../utils/logger';

export type ModerationAction = 'advertir' | 'banir_comunidade';

export interface ModerationViolation {
    groupJid: string;
    sender: string;
    reason: string;
    action: ModerationAction;
}

export interface ModerationGroupBatch {
    groupJid: string;
    messages: { sender: string; text: string; participationCount: number }[];
}

// Espelha docs/regras.md (seção "Classificação de punição") — se editar uma
// regra ali, atualize aqui também, senão a IA aplica um critério diferente
// do que está escrito publicamente pra comunidade.
const RULES_SUMMARY = `
BANIMENTO IMEDIATO DE COMUNIDADE (action: banir_comunidade):
- Conteúdo discriminatório, racista, ou explícito.
- Ato ilícito, incluindo pirataria/cracks, exploits/malware sem autorização, ou pedir ajuda pra cometer crime.
- Apostas ou jogos de azar.
- Bot não autorizado pela administração.
- Comprovadamente prejudicar outra pessoa (mesmo fora da comunidade).
- Doxxing ou vazar dado pessoal de terceiro sem autorização.
- Golpe financeiro, esquema de pirâmide, "investimento garantido", ou promoção de criptomoeda duvidosa.
- Se passar por admin, por outro membro, ou pela própria comunidade (perfil falso, nome/foto copiados).
- Desrespeito grave a um membro.

AGRAVANTE — divulgação vinda de quem quase não participa do grupo (participação muito baixa, ex: 1 a 3 mensagens no total, sendo a divulgação uma delas) conta como BANIMENTO IMEDIATO em vez de advertência: o comportamento sozinho já indica que a pessoa está ali só pra divulgar, não pra contribuir. Participação alta (a pessoa já conversa normalmente no grupo) mantém divulgação isolada como advertência comum.

ADVERTÊNCIA (action: advertir), a menos que seja repetido/grave (aí vira banimento):
- Divulgação sem ajudar diretamente no assunto do grupo — SALVO o agravante de baixa participação acima.
- Incomodar membro no privado sem autorização.
- Flood.
- Publicação fora de contexto do grupo (incluindo divulgação disfarçada).
- Cobrança por resposta, pressão por retorno imediato, ou desrespeito a quem está aprendendo (viola o propósito de mentoria).
- Proselitismo político, religioso ou correlato fora de grupo criado com esse propósito.
- Pedir ou oferecer pra fazer o trabalho de outra pessoa por completo (prova, entrevista técnica, trabalho de faculdade) — orientar/ensinar é sempre permitido, fazer no lugar da pessoa não.
- Desrespeito leve/pontual a um membro.
`.trim();

export class AiModerationService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    isConfigured(): boolean {
        return Boolean(this.apiKey);
    }

    /**
     * Colapsa mensagens idênticas (mesmo remetente e mesmo texto) numa só
     * entrada com a contagem anexada — economiza tokens num flood real (ex:
     * trinta cópias da mesma mensagem) sem perder a detecção: "flood" continua
     * uma das regras, e a contagem no texto ja entrega pra IA o sinal que ela
     * precisa, só que numa fração do tamanho.
     */
    private dedupeMessages(
        messages: { sender: string; text: string; participationCount: number }[],
    ): { sender: string; text: string; participationCount: number }[] {
        const counts = new Map<string, number>();
        for (const m of messages) {
            const key = m.sender + '|' + m.text;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }

        const seen = new Set<string>();
        const result: { sender: string; text: string; participationCount: number }[] = [];
        for (const m of messages) {
            const key = m.sender + '|' + m.text;
            if (seen.has(key)) continue;
            seen.add(key);
            const count = counts.get(key)!;
            result.push({
                sender: m.sender,
                participationCount: m.participationCount,
                text: count > 1 ? `${m.text} [repetida ${count}x]` : m.text,
            });
        }
        return result;
    }

    /**
     * Avalia o delta novo de VÁRIOS grupos numa única chamada à API (em vez de
     * uma chamada por grupo) — o free tier do Gemini limita por requisições/minuto,
     * não por volume de texto (o limite de tokens/minuto é bem folgado pra esse
     * uso), então agrupar tudo num ciclo só é o jeito de render o limite ao
     * máximo sem correr risco de estourar RPM com muitos grupos ativos na mesma hora.
     * Retorna só as violações encontradas, já marcadas com o grupo de origem —
     * lista vazia se nada errado ou se a API/parse falhar (falha "fechada":
     * nunca aplica punição por conta própria de uma resposta que não entendeu).
     */
    async evaluateBatch(groups: ModerationGroupBatch[]): Promise<ModerationViolation[]> {
        if (!this.apiKey || groups.length === 0) return [];

        const validGroupJids = new Set(groups.map((g) => g.groupJid));

        const sections = groups
            .map((g) => {
                const numbered = this.dedupeMessages(g.messages)
                    .map((m, i) => `${i + 1}. [${m.sender}] (participação: ${m.participationCount} msg(s) neste grupo): ${m.text.replace(/\n/g, ' ').slice(0, 500)}`)
                    .join('\n');
                return `=== Grupo ${g.groupJid} ===\n${numbered}`;
            })
            .join('\n\n');

        const prompt = `Você é um moderador de uma comunidade de mentoria em programação no WhatsApp, responsável por vários grupos ao mesmo tempo. Regras:\n${RULES_SUMMARY}\n\nMensagens novas de cada grupo desde a última checagem, separadas por "=== Grupo <jid> ===" (formato de mensagem "N. [remetente] (participação: X msg(s) neste grupo): texto" — participação é o total de mensagens que esse remetente já mandou nesse grupo, incluindo esta):\n\n${sections}\n\nResponda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:\n{"violations": [{"group": "<jid exatamente como no cabeçalho \\"=== Grupo ... ===\\">", "sender": "<remetente exatamente como veio entre colchetes>", "reason": "<motivo curto em português>", "action": "advertir" ou "banir_comunidade"}]}\nSe nenhuma mensagem de nenhum grupo violar as regras, responda {"violations": []}.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!res.ok) {
            // Deixa passar pra fora (não engole aqui) — o chamador (runAiModerationCycle)
            // já reporta qualquer erro no grupo de admins via describeError(); assim o
            // retorno de verdade da API do Gemini (motivo real, ex: billing/quota) chega
            // lá em vez de só um "deu erro" genérico.
            const bodyText = await res.text().catch(() => '');
            logger.warn({ status: res.status, body: bodyText }, '[AiModerationService] Gemini respondeu com erro HTTP');
            throw new Error(`Gemini HTTP ${res.status}: ${bodyText.slice(0, 500)}`);
        }

        try {
            const data: any = await res.json();
            const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) return [];

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return [];

            const parsed = JSON.parse(jsonMatch[0]);
            const violations = Array.isArray(parsed?.violations) ? parsed.violations : [];

            return violations
                .filter(
                    (v: any) =>
                        v &&
                        typeof v.group === 'string' &&
                        validGroupJids.has(v.group) && // defesa contra a IA "inventar" um grupo que não mandamos
                        typeof v.sender === 'string' &&
                        (v.action === 'advertir' || v.action === 'banir_comunidade'),
                )
                .map((v: any) => ({ groupJid: v.group, sender: v.sender, reason: v.reason, action: v.action }));
        } catch (err) {
            // Resposta 200 mas em formato inesperado (a IA não seguiu o JSON pedido) —
            // isso não é um erro de API pra reportar, é só a IA "errando o formato"; segue
            // fechado (sem punição) e sem alarme, igual antes.
            logger.warn({ err }, '[AiModerationService] falha ao interpretar resposta do Gemini — nenhuma punição aplicada por precaução');
            return [];
        }
    }
}
