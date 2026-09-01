import { logger } from '../utils/logger';

export type ModerationAction = 'advertir' | 'banir_comunidade';

export interface ModerationViolation {
    sender: string;
    reason: string;
    action: ModerationAction;
}

export interface ModerationResult {
    violations: ModerationViolation[];
    summary: string;
}

const RULES_SUMMARY = `
1. Respeite os membros — desrespeito grave é banimento.
2. Proibido conteúdo discriminatório, racista, explícito ou ato ilícito — isso é SEMPRE banimento imediato de comunidade (action: banir_comunidade).
3. Proibido incomodar membros no privado sem autorização, divulgação fora de contexto, flood, apostas/jogos de azar, ou bots não autorizados — isso é advertência (action: advertir), a menos que seja repetido/grave.
`.trim();

// Limite defensivo pro resumo — a API é quem gera esse texto, e uma instrução
// no prompt não é garantia. Sem isso, um resumo que cresce a cada ciclo
// (a IA "recapitulando" tudo de novo) infla o prompt e o storage sem limite.
const MAX_SUMMARY_LENGTH = 1000;

export class AiModerationService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    isConfigured(): boolean {
        return Boolean(this.apiKey);
    }

    /**
     * Avalia o delta novo de mensagens de um grupo contra as regras da
     * comunidade, dando contexto pra IA via um resumo compacto do que já foi
     * observado antes (em vez de reenviar o histórico inteiro a cada ciclo).
     * Retorna as violações encontradas (lista vazia se nada errado) e o
     * resumo atualizado pra guardar e usar no próximo ciclo.
     * Falha "fechada": qualquer erro de rede/parse é tratado como "sem
     * violação" e mantém o resumo anterior intacto — nunca aplica punição
     * nem perde contexto por conta de uma resposta que não entendeu.
     */
    async evaluateMessages(
        messages: { sender: string; text: string }[],
        previousSummary?: string,
    ): Promise<ModerationResult> {
        const fallback = { violations: [], summary: previousSummary || '' };
        if (!this.apiKey || messages.length === 0) return fallback;

        const numbered = messages
            .map((m, i) => `${i + 1}. [${m.sender}]: ${m.text.replace(/\n/g, ' ').slice(0, 500)}`)
            .join('\n');

        const contextBlock = previousSummary
            ? `Contexto acumulado até agora neste grupo (resumo do que já foi observado antes):\n${previousSummary}\n\n`
            : '';

        const prompt = `Você é um moderador de uma comunidade de mentoria em programação no WhatsApp. Regras:\n${RULES_SUMMARY}\n\n${contextBlock}Mensagens novas desde a última checagem (formato "N. [remetente]: texto"):\n${numbered}\n\nResponda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:\n{"violations": [{"sender": "<remetente exatamente como veio entre colchetes>", "reason": "<motivo curto em português>", "action": "advertir" ou "banir_comunidade"}], "summary": "<resumo atualizado do contexto deste grupo, incorporando o contexto acumulado + o que aconteceu agora, no máximo 3 frases curtas>"}\nSe nenhuma mensagem violar as regras, "violations" fica [].`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!res.ok) {
                logger.warn({ status: res.status }, '[AiModerationService] Gemini respondeu com erro HTTP');
                return fallback;
            }

            const data: any = await res.json();
            const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) return fallback;

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return fallback;

            const parsed = JSON.parse(jsonMatch[0]);
            const violations = Array.isArray(parsed?.violations) ? parsed.violations : [];
            const summary = typeof parsed?.summary === 'string' && parsed.summary.trim()
                ? parsed.summary.trim().slice(0, MAX_SUMMARY_LENGTH)
                : fallback.summary;

            return {
                violations: violations.filter(
                    (v: any) => v && typeof v.sender === 'string' && (v.action === 'advertir' || v.action === 'banir_comunidade'),
                ),
                summary,
            };
        } catch (err) {
            logger.warn({ err }, '[AiModerationService] falha ao avaliar mensagens — nenhuma punição aplicada, resumo anterior mantido');
            return fallback;
        }
    }
}
