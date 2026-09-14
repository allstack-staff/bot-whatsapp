import { logger } from '../utils/logger';
import { CommunityRulesService } from './communityRulesService';

export interface MentionResponse {
    pertinent: boolean;
    answer?: string;
}

/**
 * Decide se uma menção/reply direta ao bot merece resposta — só quando é uma
 * pergunta pertinente com caráter informativo (não "zueira", brincadeira, ou
 * comentário sem pedido de informação real). Quando pertinente, responde já
 * embasado nas regras da comunidade, em tom humanizado (não robótico, mas
 * sem inventar nada fora do que as regras cobrem). Fail-closed: sem chave,
 * erro de API, ou resposta em formato inesperado — não responde nada, em vez
 * de arriscar um "silêncio" incorreto virar barulho.
 */
export class BotMentionAiService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    private readonly communityRulesService = new CommunityRulesService();

    isConfigured(): boolean {
        return Boolean(this.apiKey);
    }

    async respond(params: { text: string; extraRules?: string[] }): Promise<MentionResponse> {
        const fallback: MentionResponse = { pertinent: false };
        if (!this.apiKey) return fallback;

        const rules = await this.communityRulesService.getRules();
        const extraBlock = params.extraRules?.length ? `\n\nRegras específicas desse grupo:\n${params.extraRules.join('\n')}` : '';

        const prompt = `Você é o bot da "All Stack Community" (mentoria em programação no WhatsApp). Alguém mencionou ou respondeu você direto com esta mensagem:\n"${params.text.replace(/"/g, "'")}"\n\nRegras da comunidade, pra embasar sua resposta se houver uma:\n${rules}${extraBlock}\n\nPrimeiro decida: essa mensagem é uma pergunta ou pedido de informação de verdade (pertinente), ou é brincadeira, "zueira", provocação, ou qualquer coisa sem caráter informativo real? Só considere pertinente se a pessoa realmente parece querer uma resposta útil.\n\nSe pertinente: responda de forma direta e humanizada (natural, sem soar robótico, mas sem rodeio nem explicação excessiva), baseado SÓ no que as regras acima realmente dizem — nunca invente regra, prazo, ou procedimento que não está escrito. Se a pergunta for sobre algo que as regras não cobrem, diga isso e oriente a falar com um admin, em vez de chutar uma resposta.\n\nResponda APENAS com um JSON válido, sem texto antes ou depois:\n{"pertinent": true ou false, "answer": "<resposta, só se pertinent=true, senão null>"}`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!res.ok) {
                logger.warn({ status: res.status }, '[BotMentionAiService] Gemini respondeu com erro HTTP');
                return fallback;
            }

            const data: any = await res.json();
            const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) return fallback;

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return fallback;

            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed?.pertinent !== 'boolean') return fallback;
            if (!parsed.pertinent) return { pertinent: false };
            if (typeof parsed.answer !== 'string' || !parsed.answer.trim()) return fallback;

            return { pertinent: true, answer: parsed.answer.trim() };
        } catch (err) {
            logger.warn({ err }, '[BotMentionAiService] falha ao gerar resposta');
            return fallback;
        }
    }
}
