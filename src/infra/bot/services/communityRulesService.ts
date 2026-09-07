import { logger } from '../utils/logger';

const RAW_URL = 'https://raw.githubusercontent.com/allstack-staff/bot-whatsapp/main/docs/regras.md';
const CACHE_TTL_MS = 5 * 60 * 1000;

// Só usado se o GitHub estiver inacessível no primeiro boot (sem cache
// nenhum ainda) — mantém a moderação funcionando com uma cópia razoável em
// vez de ficar sem regra nenhuma. Pode ficar desatualizado com o tempo; o
// texto de verdade é sempre o publicado em docs/regras.md.
const FALLBACK_RULES = `
## Regras gerais

0. Divulgação é proibida, exceto quando ajuda diretamente no assunto do grupo. Advertência. Agravante: quem quase não participa do grupo e ainda assim divulga vira banimento direto.
1. Respeite os membros. Banimento da comunidade (desrespeito leve/pontual pode ser só advertência).
2. Conteúdo discriminatório, racista, explícito, ou ato ilícito (inclui pirataria, exploits/malware, pedir ajuda pra cometer crime) é banimento imediato da comunidade.
3. Proibido incomodar membros no privado sem autorização. Advertência (podendo virar banimento se repetido/grave).
5. Apostas e jogos de azar: banimento da comunidade.
6. Bots não autorizados: banimento da comunidade.
7. Quem comprovadamente prejudicou outras pessoas: banimento da comunidade.
8. Publicação fora de contexto do grupo: remoção da publicação + advertência.
12. Doxxing ou vazar dado pessoal de terceiro: banimento da comunidade.
13. Proselitismo político/religioso fora de grupo com esse propósito: advertência.
14. Golpe financeiro, pirâmide, cripto duvidosa: banimento imediato.
15. Se passar por admin/outro membro/a comunidade: banimento imediato.
16. Pedir ou oferecer pra fazer o trabalho de outra pessoa por completo: advertência.
`.trim();

/**
 * Busca as regras gerais direto do arquivo publicado (regras.md) — mesmo
 * princípio do GroupRulesService: editar a página já vale pro próximo ciclo
 * de moderação, sem precisar de deploy do bot. Falha "fechada": qualquer erro
 * de rede/parse cai no último cache bom, ou num fallback embutido se ainda
 * não tiver nenhum.
 */
export class CommunityRulesService {
    private cache: { text: string; at: number } | undefined;

    async getRules(): Promise<string> {
        if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) {
            return this.cache.text;
        }

        try {
            const res = await fetch(RAW_URL);
            if (!res.ok) {
                logger.warn({ status: res.status }, '[CommunityRulesService] falha ao buscar regras.md');
                return this.cache?.text ?? FALLBACK_RULES;
            }
            const markdown = await res.text();
            const match = markdown.match(/## Regras gerais[\s\S]*?(?=\n## Sobre moderação automatizada)/);
            const extracted = match?.[0]?.trim();
            if (!extracted) {
                logger.warn('[CommunityRulesService] não encontrou a seção de regras no markdown — usando cache/fallback');
                return this.cache?.text ?? FALLBACK_RULES;
            }

            this.cache = { text: extracted, at: Date.now() };
            return extracted;
        } catch (err) {
            logger.warn({ err }, '[CommunityRulesService] erro buscando/interpretando regras.md');
            return this.cache?.text ?? FALLBACK_RULES;
        }
    }
}
