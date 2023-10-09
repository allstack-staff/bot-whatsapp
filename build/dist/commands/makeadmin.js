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
exports.makeadmin = void 0;
const makeadmin = (socket, grJid, urJid) => __awaiter(void 0, void 0, void 0, function* () {
    if (grJid === "120363084400589228@g.us") {
        yield socket.sendMessage(grJid, {
            text: "O uso de $asb:makeadmin no grupo dos administradores não é permitido.",
        });
        return;
    }
    const metadata = yield socket.groupMetadata("120363084400589228@g.us");
    const participants = metadata.participants.map((x) => x.id);
    if (participants.includes(urJid)) {
        yield socket.groupParticipantsUpdate(grJid, [urJid], "promote");
        yield socket.sendMessage("120363084400589228@g.us", {
            text: `O usuário @${urJid.split("@")[0]} agora é um adminstrador.`,
            mentions: [urJid],
        });
    }
    else {
        yield socket.sendMessage(grJid, {
            text: "É necessário ser uma pessoa autorizada para usar este comando.",
        });
    }
});
exports.makeadmin = makeadmin;
