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
exports.mentionAll = void 0;
const mentionAll = (socket, arJid, grJid) => __awaiter(void 0, void 0, void 0, function* () {
    const metadata = yield socket.groupMetadata(grJid);
    const participants = metadata.participants.map(x => x.id);
    let numbers = new Array(participants.length);
    for (let i = 0; i < participants.length; i++) {
        numbers[i] = "@" + (participants[i].split("@")[0]);
    }
    let text = "";
    for (let i = 0; i < numbers.length; i++) {
        text += numbers[i] + '\n';
    }
    yield socket.sendMessage(grJid, {
        text: text,
        mentions: participants
    });
});
exports.mentionAll = mentionAll;
