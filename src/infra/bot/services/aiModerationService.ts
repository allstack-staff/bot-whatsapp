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
    messages: { sender: string; text: string }[];
}

const RULES_SUMMARY = `
1. Respeite os membros — desrespeito grave é banimento.
2. Proibido conteúdo discriminatório, racista, explícito ou ato ilícito — isso é SEMPRE banimento imediato de comunidade (action: banir_comunidade).
3. Proibido incomodar membros no privado sem autorização, divulgação fora de contexto, flood, apostas/jogos de azar, ou bots não autorizados — isso é advertência (action: advertir), a menos que seja repetido/grave.
`.trim();

export class AiModerationService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    isConfigured(): boolean {
        return Boolean(this.apiKey);
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
                const numbered = g.messages
                    .map((m, i) => `${i + 1}. [${m.sender}]: ${m.text.replace(/\n/g, ' ').slice(0, 500)}`)
                    .join('\n');
                return `=== Grupo ${g.groupJid} ===\n${numbered}`;
            })
            .join('\n\n');

        const prompt = `Você é um moderador de uma comunidade de mentoria em programação no WhatsApp, responsável por vários grupos ao mesmo tempo. Regras:\n${RULES_SUMMARY}\n\nMensagens novas de cada grupo desde a última checagem, separadas por "=== Grupo <jid> ===" (formato de mensagem "N. [remetente]: texto"):\n\n${sections}\n\nResponda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:\n{"violations": [{"group": "<jid exatamente como no cabeçalho \\"=== Grupo ... ===\\">", "sender": "<remetente exatamente como veio entre colchetes>", "reason": "<motivo curto em português>", "action": "advertir" ou "banir_comunidade"}]}\nSe nenhuma mensagem de nenhum grupo violar as regras, responda {"violations": []}.`;

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
