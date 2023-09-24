import { BaileysSocket } from '../types/BaileysSocket';

const regras = `
Comunidade que aproxima devs experientes (chamados mentores) de menos experientes, para dicas e aprendizados.

*Muito obrigado por estar aqui! Sua contribuição é muito importante!*

REGRAS:

0. PROIBIDA DIVULGAÇÕES, salvo se para colaborar com o assunto do grupo ;
1. Sempre respeite os membros;
2. Conteúdos multimidias (videos, imagens, noticias, links, figurinhas) são todos permitidos, salvo em casos de:
2.1. Flood;
2.2. Conteúdo discriminatório, racista, e relacionados;
2.3. Explícitos.
2.4. Atos Ilícitos
3. SOMOS ISENTOS DE QUAISQUER AÇÕES DOS MEMBROS DESTA COMUNIDADE. TODA E QUALQUER AÇÃO, É DE RESPONSABILIDADE DO PRÓPRIO MEMBRO.
`;

export const rules = async(socket: BaileysSocket, rJid: string) => {
  await socket.sendMessage(rJid, {text: regras});
}
