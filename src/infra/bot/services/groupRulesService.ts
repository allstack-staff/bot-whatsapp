import { logger } from '../utils/logger';

const RAW_URL = 'https://raw.githubusercontent.com/allstack-staff/bot-whatsapp/main/docs/regras-grupos.md';
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Lê as regras específicas de cada grupo direto do arquivo publicado no
 * repositório (o mesmo que vira a página de regras por grupo no site) — não
 * de um arquivo local nem do banco. Editar a página já vale pro próximo ciclo
 * de moderação, sem precisar de deploy do bot. Falha "fechada": qualquer erro
 * de rede/parse retorna nenhuma regra extra (só as gerais da comunidade
 * continuam valendo), nunca derruba o ciclo de moderação por causa disso.
 */
export class GroupRulesService {
    private cache: { rulesByShortId: Map<number, string[]>; at: number } | undefined;

    private async getRulesByShortId(): Promise<Map<number, string[]>> {
        if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
            return this.cache.rulesByShortId;
        }

        const rulesByShortId = new Map<number, string[]>();
        try {
            const res = await fetch(RAW_URL);
            if (!res.ok) {
                logger.warn({ status: res.status }, '[GroupRulesService] falha ao buscar regras-grupos.md');
                return this.cache?.rulesByShortId ?? rulesByShortId;
            }
            const markdown = await res.text();

            // Cada seção começa com um cabeçalho contendo <a id="grupo-N"></a> e vai
            // até o próximo "## " (ou o fim do arquivo). Só as linhas "- ..." dentro
            // da seção viram regras.
            const sectionRegex = /<a id="grupo-(\d+)">[\s\S]*?<\/a>[\s\S]*?(?=\n## |$)/g;
            let match: RegExpExecArray | null;
            while ((match = sectionRegex.exec(markdown)) !== null) {
                const shortId = parseInt(match[1], 10);
                const body = match[0];
                const rules = body
                    .split('\n')
                    .filter((line) => line.trim().startsWith('- '))
                    .map((line) => line.trim().slice(2).trim())
                    .filter(Boolean);
                if (rules.length) rulesByShortId.set(shortId, rules);
            }
        } catch (err) {
            logger.warn({ err }, '[GroupRulesService] erro buscando/interpretando regras-grupos.md');
            return this.cache?.rulesByShortId ?? rulesByShortId;
        }

        this.cache = { rulesByShortId, at: Date.now() };
        return rulesByShortId;
    }

    async getRulesFor(shortId: number | null): Promise<string[]> {
        if (shortId === null) return [];
        const rulesByShortId = await this.getRulesByShortId();
        return rulesByShortId.get(shortId) ?? [];
    }
}
