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
const ban = (socket, members, sem, arJid, grJid, rJid, key, motivo) => __awaiter(void 0, void 0, void 0, function* () {
    yield sem.acquire();
    const metadata = yield socket.groupMetadata(grJid);
    const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);
    if (admins.includes(arJid)) {
        try {
            if (arJid === rJid) {
                yield socket.sendMessage(grJid, {
                    text: "Você não pode banir a si mesm(a)!",
                });
                return;
            }
            if (key)
                yield socket.sendMessage(grJid, { react: { text: "✅", key: key } });
            yield socket.groupParticipantsUpdate(grJid, [rJid], "remove");
            yield socket.sendMessage(grJid, {
                text: `
O usuário(a) @${rJid === null || rJid === void 0 ? void 0 : rJid.split("@")[0]} foi banido(a).
Motivo:${motivo}
`,
                mentions: [rJid],
            });
            members.add(rJid);
            members.saveMembersList();
            members.replace(members.name);
        }
        catch (e) {
            yield socket.sendMessage(grJid, {
                react: {
                    text: "‼️",
                    key: key,
                },
            });
        }
    }
    else {
        yield socket.sendMessage(grJid, {
            text: "É necessário ser uma pessoa autorizada para usar este comando.",
        });
    }
    sem.release();
});
exports.ban = ban;
