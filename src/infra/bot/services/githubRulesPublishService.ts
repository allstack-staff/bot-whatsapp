const REPO = 'allstack-staff/bot-whatsapp';
const FILE_PATH = 'docs/regras.md';

/**
 * Publica uma regra nova aprovada, direto na lista numerada de docs/regras.md,
 * via API do GitHub (token só precisa de "Contents: read and write" nesse
 * repositório). O push na main já dispara o rebuild do GitHub Pages — mesmo
 * pipeline que já publica qualquer outro commit de documentação, nada novo
 * precisa ser criado. Não mexe na tabela-resumo (Classificação de punição);
 * isso fica como acerto manual periódico, pra não arriscar corromper uma
 * tabela markdown com substituição de texto automática.
 */
export class GithubRulesPublishService {
    private readonly token = process.env.GITHUB_RULES_TOKEN;

    isConfigured(): boolean {
        return Boolean(this.token);
    }

    async publishNewRule(draftedText: string, punishment: 'ADVERTENCIA' | 'BANIMENTO'): Promise<void> {
        if (!this.token) throw new Error('GITHUB_RULES_TOKEN não configurado');

        const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
        const headers = {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        };

        const getRes = await fetch(apiUrl, { headers });
        if (!getRes.ok) {
            throw new Error(`GitHub GET ${getRes.status}: ${(await getRes.text()).slice(0, 300)}`);
        }
        const fileData: any = await getRes.json();
        const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

        const numberMatches = [...currentContent.matchAll(/^(\d+)\.\s/gm)].map((m) => parseInt(m[1], 10));
        const nextNumber = numberMatches.length ? Math.max(...numberMatches) + 1 : 0;
        const punishmentLabel = punishment === 'BANIMENTO' ? '**Banimento da comunidade.**' : '**Advertência.**';
        const newLine = `${nextNumber}. ${draftedText} — ${punishmentLabel}`;

        const headingMarker = '\n\n## Classificação de punição';
        const idx = currentContent.indexOf(headingMarker);
        if (idx === -1) {
            throw new Error('Não encontrei a seção "## Classificação de punição" em regras.md — abortando pra não corromper o arquivo');
        }
        const updatedContent = currentContent.slice(0, idx) + `\n${newLine}` + currentContent.slice(idx);

        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: `docs: adiciona regra ${nextNumber} via $asb propor (aprovada pelos admins)`,
                content: Buffer.from(updatedContent, 'utf-8').toString('base64'),
                sha: fileData.sha,
            }),
        });
        if (!putRes.ok) {
            throw new Error(`GitHub PUT ${putRes.status}: ${(await putRes.text()).slice(0, 300)}`);
        }
    }
}
