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
exports.unban = void 0;
const unban = (socket, members, sem, arJid, grJid, num) => __awaiter(void 0, void 0, void 0, function* () {
    console.log([members, sem, arJid, grJid, num]);
    sem.acquire();
    const metadata = yield socket.groupMetadata(grJid);
    const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);
    const urJid = num + "@s.whatsapp.net";
    if (admins.includes(arJid)) {
        try {
            members.rm(urJid);
            members.saveMembersList();
            members.replace(members.name);
            yield socket.sendMessage(grJid, {
                text: `O usuário(a) @${urJid.split("@")[0]} foi desbanido(a).`,
                mentions: [urJid],
            });
            yield socket.groupParticipantsUpdate(grJid, [urJid], 'add');
        }
        catch (e) {
            if (e instanceof RangeError) {
                yield socket.sendMessage(grJid, {
                    text: `O usuário(a) @${urJid.split("@")[0]} não foi banido(a).`,
                    mentions: [urJid],
                });
                return;
            }
        }
    }
    else {
        yield socket.sendMessage(grJid, {
            text: "É necessário ser uma pessoa autorizada para utilizar esse comando.",
        });
    }
    sem.release();
});
exports.unban = unban;
