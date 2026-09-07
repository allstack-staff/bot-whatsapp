import { logger } from '../utils/logger';
import { CommunityRulesService } from './communityRulesService';

export interface RuleDraft {
    draftedText: string;
    punishment: 'ADVERTENCIA' | 'BANIMENTO';
    conflictNote?: string;
}

/**
 * Pega a ideia crua de um admin e devolve uma regra redigida no mesmo estilo
 * das já existentes, já classificada (advertência/banimento) e com um aviso
 * se conflitar com alguma regra atual — pra um humano aprovar antes de ir
 * pro ar (o bot nunca publica uma regra nova sem um ✅ de admin de comunidade).
 */
export class RuleDraftingService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    private readonly communityRulesService = new CommunityRulesService();

    isConfigured(): boolean {
        return Boolean(this.apiKey);
    }

    async draft(rawIdea: string): Promise<RuleDraft | null> {
        if (!this.apiKey) return null;

        const currentRules = await this.communityRulesService.getRules();

        const prompt = `Você ajuda a redigir regras novas pra comunidade "All Stack Community" (mentoria em programação no WhatsApp). Regras atuais, pro estilo e pra checar conflito:\n${currentRules}\n\nUm admin sugeriu, em texto livre e informal, a seguinte ideia de regra nova:\n"${rawIdea.replace(/"/g, "'")}"\n\nRedija essa ideia como UMA frase de regra, no mesmo estilo direto das regras acima (sem numeração, ela será numerada depois). Classifique a punição como exatamente "ADVERTENCIA" ou "BANIMENTO" (banimento imediato de comunidade), seguindo o mesmo critério de severidade das regras já existentes. Se a ideia contradiz, enfraquece, ou já está coberta por alguma regra existente, explique brevemente em "conflictNote"; se não há conflito, deixe "conflictNote" como null.\n\nResponda APENAS com um JSON válido, sem texto antes ou depois, no formato:\n{"draftedText": "<frase da regra>", "punishment": "ADVERTENCIA" ou "BANIMENTO", "conflictNote": "<aviso curto ou null>"}`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!res.ok) {
                logger.warn({ status: res.status }, '[RuleDraftingService] Gemini respondeu com erro HTTP');
                return null;
            }

            const data: any = await res.json();
            const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) return null;

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed?.draftedText !== 'string' || !parsed.draftedText.trim()) return null;
            if (parsed.punishment !== 'ADVERTENCIA' && parsed.punishment !== 'BANIMENTO') return null;

            return {
                draftedText: parsed.draftedText.trim(),
                punishment: parsed.punishment,
                conflictNote: typeof parsed.conflictNote === 'string' && parsed.conflictNote.trim() ? parsed.conflictNote.trim() : undefined,
            };
        } catch (err) {
            logger.warn({ err }, '[RuleDraftingService] falha ao redigir proposta de regra');
            return null;
        }
    }
}
