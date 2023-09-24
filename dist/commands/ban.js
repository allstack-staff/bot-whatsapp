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
exports.ban = void 0;
const whitelist = [
    "557798780834@s.whatsapp.net",
    "556286268745@s.whatsapp.net"
];
const ban = (socket, arJid, grJid, rJid, motivo) => __awaiter(void 0, void 0, void 0, function* () {
    if (whitelist.includes(arJid)) {
        try {
            if (whitelist.includes(rJid)) {
                yield socket.sendMessage(grJid, { text: "Um administrador não pode ser banido." });
                return;
            }
            yield socket.groupParticipantsUpdate(grJid, [rJid], 'remove');
            yield socket.sendMessage(grJid, { text: `
O usúario @${rJid.split('@')[0]} foi banido.
Motivo: ${motivo}
`, mentions: [rJid] });
        }
        catch (e) {
            yield socket.sendMessage(grJid, { text: `Erro interno do server: ${e}` });
        }
    }
    else {
        yield socket.sendMessage(grJid, { text: "É necessário ser uma pessoa autorizada para usar este comando." });
    }
});
exports.ban = ban;
