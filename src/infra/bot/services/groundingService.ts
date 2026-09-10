import { logger } from '../utils/logger';
import { CommunityRulesService } from './communityRulesService';

export interface GroundingResult {
    grounded: boolean;
    feedback: string;
}

/**
 * Toda decisão de um admin de comunidade (reverter uma ação administrativa,
 * ou uma decisão monocrática) precisa vir com um motivo em texto embasado
 * nas regras — essa classe é quem avalia se o motivo dado realmente se
 * sustenta nas regras da comunidade, ou se é só uma opinião pessoal / não
 * tem relação com nenhuma regra documentada. Fail-closed: sem
 * GEMINI_API_KEY, ou se a IA falhar, considera NÃO embasado (não deixa uma
 * decisão de peso passar sem avaliação só porque a IA está fora do ar).
 */
export class GroundingService {
    private readonly apiKey = process.env.GEMINI_API_KEY;
    private readonly model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    private readonly communityRulesService = new CommunityRulesService();

    isConfigured(): boolean {
        return Boolean(this.apiKey);
    }

    async evaluate(params: { actionDescription: string; reasoning: string; extraRules?: string[] }): Promise<GroundingResult> {
        const fallback: GroundingResult = {
            grounded: false,
            feedback: 'Não foi possível avaliar o embasamento agora (moderação por IA indisponível) — decisão não aplicada.',
        };
        if (!this.apiKey) return fallback;

        const rules = await this.communityRulesService.getRules();
        const extraBlock = params.extraRules?.length ? `\n\nRegras específicas desse grupo:\n${params.extraRules.join('\n')}` : '';

        const prompt = `Você avalia se a decisão de um admin de comunidade da "All Stack Community" está embasada nas regras documentadas — não se você concorda pessoalmente, só se o motivo dado se sustenta em alguma regra real, ou é razoável interpretação de uma delas.\n\nRegras da comunidade:\n${rules}${extraBlock}\n\nAção administrativa sendo questionada: "${params.actionDescription.replace(/"/g, "'")}"\n\nMotivo dado pelo admin de comunidade pra reverter/decidir: "${params.reasoning.replace(/"/g, "'")}"\n\nO motivo cita ou se apoia em alguma regra real (mesmo sem citar o número), ou é só uma opinião pessoal sem relação com as regras documentadas? Responda APENAS com um JSON válido, sem texto antes ou depois:\n{"grounded": true ou false, "feedback": "<explicação curta e direta, 1-2 frases, sem rodeios>"}`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });

            if (!res.ok) {
                logger.warn({ status: res.status }, '[GroundingService] Gemini respondeu com erro HTTP');
                return fallback;
            }

            const data: any = await res.json();
            const raw: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!raw) return fallback;

            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return fallback;

            const parsed = JSON.parse(jsonMatch[0]);
            if (typeof parsed?.grounded !== 'boolean' || typeof parsed?.feedback !== 'string' || !parsed.feedback.trim()) {
                return fallback;
            }

            return { grounded: parsed.grounded, feedback: parsed.feedback.trim() };
        } catch (err) {
            logger.warn({ err }, '[GroundingService] falha ao avaliar embasamento');
            return fallback;
        }
    }
}
