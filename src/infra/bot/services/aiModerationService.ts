import { logger } from '../utils/logger';

export type ModerationAction = 'advertir' | 'banir_comunidade';

export interface ModerationViolation {
    sender: string;
    reason: string;
    action: ModerationAction;
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
     * Avalia um lote de mensagens de um grupo contra as regras da comunidade.
     * Retorna só as violações que a IA encontrar — lista vazia se nada errado.
     * Falha "fechada": qualquer erro de rede/parse é tratado como "sem violação",
     * nunca aplica punição por conta própria de uma resposta que não entendeu.
     */
    async evaluateMessages(messages: { sender: string; text: string }[]): Promise<ModerationViolation[]> {
        if (!this.apiKey || messages.length === 0) return [];

        const numbered = messages
            .map((m, i) => `${i + 1}. [${m.sender}]: ${m.text.replace(/\n/g, ' ').slice(0, 500)}`)
            .join('\n');

        const prompt = `Você é um moderador de uma comunidade de mentoria em programação no WhatsApp. Regras:\n${RULES_SUMMARY}\n\nMensagens recentes do grupo (formato "N. [remetente]: texto"):\n${numbered}\n\nResponda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:\n{"violations": [{"sender": "<remetente exatamente como veio entre colchetes>", "reason": "<motivo curto em português>", "action": "advertir" ou "banir_comunidade"}]}\nSe nenhuma mensagem violar as regras, responda {"violations": []}.`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!res.ok) {
                logger.warn({ status: res.status }, '[AiModerationService] Gemini respondeu com erro HTTP');
                return [];
            }

            const data: any = await res.json();
            const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) return [];

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return [];

            const parsed = JSON.parse(jsonMatch[0]);
            const violations = Array.isArray(parsed?.violations) ? parsed.violations : [];

            return violations.filter(
                (v: any) => v && typeof v.sender === 'string' && (v.action === 'advertir' || v.action === 'banir_comunidade'),
            );
        } catch (err) {
            logger.warn({ err }, '[AiModerationService] falha ao avaliar mensagens — nenhuma punição aplicada por precaução');
            return [];
        }
    }
}
