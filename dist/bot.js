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
exports.bot = void 0;
const conn_1 = require("./conn");
const hello_1 = require("./commands/hello");
const regras_1 = require("./commands/regras");
const ban_1 = require("./commands/ban");
function bot() {
    return __awaiter(this, void 0, void 0, function* () {
        const socket = yield (0, conn_1.connect)();
        socket.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            //if (m.type === "notify") return;
            console.log(JSON.stringify(m, undefined, 2));
            let message;
            if (!(((_a = m.messages[0].message) === null || _a === void 0 ? void 0 : _a.conversation) ||
                ((_c = (_b = m.messages[0].message) === null || _b === void 0 ? void 0 : _b.extendedTextMessage) === null || _c === void 0 ? void 0 : _c.text) ||
                ((_d = m.messages[0].message) === null || _d === void 0 ? void 0 : _d.imageMessage) ||
                ((_e = m.messages[0].message) === null || _e === void 0 ? void 0 : _e.videoMessage) ||
                ((_f = m.messages[0].message) === null || _f === void 0 ? void 0 : _f.stickerMessage)))
                return;
            message = ((_g = m.messages[0].message) === null || _g === void 0 ? void 0 : _g.conversation)
                ? (_h = m.messages[0].message) === null || _h === void 0 ? void 0 : _h.conversation
                : (_k = (_j = m.messages[0].message) === null || _j === void 0 ? void 0 : _j.extendedTextMessage) === null || _k === void 0 ? void 0 : _k.text;
            if (message && message.startsWith("$asb:regras")) {
                yield (0, regras_1.rules)(socket, m.messages[0].key.remoteJid);
            }
            else if (message &&
                message.startsWith("$asb:ban") &&
                ((_o = (_m = (_l = m.messages[0].message) === null || _l === void 0 ? void 0 : _l.extendedTextMessage) === null || _m === void 0 ? void 0 : _m.contextInfo) === null || _o === void 0 ? void 0 : _o.mentionedJid)) {
                const jids = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid;
                const [usuario, motivo] = [
                    jids[0],
                    message.split(jids[0].split("@")[0])[1],
                ];
                const grouprJid = m.messages[0].key.remoteJid.endsWith("@g.us")
                    ? m.messages[0].key.remoteJid
                    : undefined;
                if (grouprJid) {
                    if (grouprJid === "120363084400589228@g.us" ||
                        grouprJid === "120363029900825529@g.us" ||
                        grouprJid === "120363042733129991@g.us")
                        yield (0, ban_1.ban)(socket, m.messages[0].key.participant.trim(), grouprJid, usuario, motivo);
                    else
                        yield socket.sendMessage(grouprJid, { text: "Ops, grupo errado." });
                }
                else {
                    !(yield socket.sendMessage(m.messages[0].key.remoteJid, {
                        text: "estamos numa conversa pessoal.",
                    }));
                }
            }
            else if (message && message.startsWith("$asb")) {
                yield (0, hello_1.hello)(socket, (_p = m.messages[0]) === null || _p === void 0 ? void 0 : _p.key.remoteJid, `Olá! Este é o bot utilitario da All Stack Community.`);
            }
        }));
    });
}
exports.bot = bot;
