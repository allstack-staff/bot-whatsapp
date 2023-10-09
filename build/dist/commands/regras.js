"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rules = void 0;
const regras = `Comunidade que aproxima devs experientes (chamados mentores) de menos experientes, para dicas e aprendizados.

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
const rules = (socket, rJid) => __awaiter(void 0, void 0, void 0, function* () {
    if (rJid === "120363138200204540@g.us") {
        yield socket.sendMessage(rJid, { text: "Aqui não tem regras não rapaz." });
        return;
    }
    yield socket.sendMessage(rJid, { text: regras });
});
exports.rules = rules;
