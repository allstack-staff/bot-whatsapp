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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const conn_1 = require("./conn");
const hello_1 = require("./commands/hello");
const regras_1 = require("./commands/regras");
const ban_1 = require("./commands/ban");
const black_1 = require("./commands/black");
const makeadmin_1 = require("./commands/makeadmin");
const gpt_1 = require("./commands/gpt");
const removeFrom_1 = require("./commands/internal/removeFrom");
const mentionAll_1 = require("./commands/internal/mentionAll");
const unban_1 = require("./commands/unban");
const mention_1 = require("./commands/mention");
const semaphore_async_await_1 = __importDefault(require("semaphore-async-await"));
const path_1 = __importDefault(require("path"));
const MemberList_1 = require("./commands/internal/MemberList");
const GPTBotManager_1 = require("./gpt-core/GPTBotManager");
const bot_config_1 = require("./bot_config");
const link_1 = require("./commands/link");
const bc = new GPTBotManager_1.GPTBotManager((0, bot_config_1.blackclown)());
const gpt_ = new GPTBotManager_1.GPTBotManager((0, bot_config_1.gpt)());
let blacklist = new MemberList_1.MemberList(path_1.default.resolve(__dirname, "commands", "internal", "blacklist.txt"));
const lock = new semaphore_async_await_1.default(1);
function bot() {
    return __awaiter(this, void 0, void 0, function* () {
        const socket = yield (0, conn_1.connect)();
        socket.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            if (m.type !== "notify" || m.messages[0].key.remoteJid === "status@broadcast")
                return;
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
            if (message === null || message === void 0 ? void 0 : message.includes("@all")) {
                const groupJid = m.messages[0].key.remoteJid.endsWith("g.us")
                    ? m.messages[0].key.remoteJid
                    : undefined;
                if (groupJid) {
                    yield (0, mentionAll_1.mentionAll)(socket, m.messages[0].key.participant, groupJid);
                }
            }
            if (message && message.startsWith("$asb")) {
                console.log(message);
                if (/^(\$asb)\s*$/.test(message)) {
                    yield (0, hello_1.hello)(socket, m.messages[0].key.remoteJid, m.messages[0].key, "Olá! este é o bot utilitário da All Stack Community.");
                    return;
                }
                else if (/^(\$asb)\:(?!\:)/.test(message)) {
                    if (message.slice(5).startsWith("makeadmin")) {
                        const groupJid = m.messages[0].key.remoteJid.endsWith("@g.us")
                            ? m.messages[0].key.remoteJid
                            : undefined;
                        if (groupJid) {
                            yield (0, makeadmin_1.makeadmin)(socket, groupJid, m.messages[0].key.participant);
                        }
                        else {
                            yield socket.sendMessage(m.messages[0].key.remoteJid, {
                                text: "Estamos em uma conversa pessoal.",
                            });
                        }
                    }
                    else if (message.slice(5).startsWith("mention")) {
                        const num = (message.match(/\d+/));
                        if (num) {
                            try {
                                yield (0, mention_1.mention)(socket, m.messages[0].key.remoteJid, num[0]);
                            }
                            catch (e) {
                                yield socket.sendMessage(m.messages[0].key.remoteJid, { react: { text: "‼️", key: m.messages[0].key } });
                                console.error(e);
                            }
                        }
                    }
                    else if (message.slice(5).startsWith("gpt")) {
                        yield (0, gpt_1.defaultgpt)(socket, gpt_, m.messages[0].key.remoteJid, m.messages[0].key, m.messages[0], message.slice(9));
                    }
                    else if (message.slice(5).startsWith("bc")) {
                        try {
                            yield (0, black_1.black)(socket, bc, m.messages[0].key.remoteJid, m.messages[0].key, m.messages[0], message.slice(9));
                        }
                        catch (e) {
                            yield socket.sendMessage(m.messages[0].key.remoteJid, {
                                react: {
                                    text: "‼️",
                                    key: m.messages[0]
                                }
                            });
                        }
                    }
                }
                else if (/^(\$asb)\:\:/.test(message)) {
                    if (message.slice(6).startsWith("regras")) {
                        yield (0, regras_1.rules)(socket, m.messages[0].key.remoteJid);
                    }
                    else if (message.slice(6).startsWith("ban")) {
                        if (!((_o = (_m = (_l = m.messages[0].message) === null || _l === void 0 ? void 0 : _l.extendedTextMessage) === null || _m === void 0 ? void 0 : _m.contextInfo) === null || _o === void 0 ? void 0 : _o.mentionedJid)) {
                            yield socket.sendMessage(m.messages[0].key.remoteJid, {
                                react: {
                                    text: "‼️",
                                    key: m.messages[0]
                                }
                            });
                            yield socket.sendMessage(m.messages[0].key.remoteJid, {
                                text: "precisa-se de ter alguem pra banir!",
                            });
                            return;
                        }
                        const jids = m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid;
                        const [usuario, motivo] = [
                            jids[0],
                            message.split(jids[0].split("@")[0])[1],
                        ];
                        const grouprJid = m.messages[0].key.remoteJid.endsWith("@g.us")
                            ? m.messages[0].key.remoteJid
                            : undefined;
                        try {
                            if (grouprJid) {
                                yield (0, ban_1.ban)(socket, blacklist, lock, m.messages[0].key.participant.trim(), grouprJid, usuario, m.messages[0], motivo);
                            }
                            else {
                                (yield socket.sendMessage(m.messages[0].key.remoteJid, {
                                    text: "estamos numa conversa pessoal.",
                                }));
                            }
                        }
                        catch (_) {
                            yield socket.sendMessage(m.messages[0].key.remoteJid, {
                                text: "Error: Parametros incompletos",
                            });
                        }
                    }
                    else if (message.slice(6).startsWith("unban")) {
                        const num = message.match(/\d+/);
                        console.log(`

NUMERO:
  ${num}



`);
                        if (num) {
                            try {
                                yield (0, unban_1.unban)(socket, blacklist, lock, m.messages[0].key.participant, m.messages[0].key.remoteJid, num[0]);
                            }
                            catch (e) {
                                yield socket.sendMessage(m.messages[0].key.remoteJid, { react: { text: "‼️", key: m.messages[0].key } });
                            }
                        }
                        else {
                            yield socket.sendMessage(m.messages[0].key.remoteJid, { text: "Erro: nenhum numero fornecido" });
                            return;
                        }
                    }
                }
            }
            if (message && !/^(https?|ftp?|http):\/\/[^\s/$.?#].[^\s]*$/i.test(message) && !m.messages[0].key.fromMe) {
                const jid = m.messages[0].key.remoteJid;
                const userID = m.messages[0].key.participant;
                const metadata = yield socket.groupMetadata(jid);
                const admin = (userID) => {
                    const user = metadata.participants.find((user) => user.id === userID);
                    return user && user.admin == 'admin';
                };
                console.log(admin(userID));
                if (admin(userID))
                    return;
                const gLink = yield socket.groupInviteCode(jid);
                yield (0, link_1.link)(socket, jid, m, message, `https://chat.whatsapp.com/${gLink}`);
            }
        }));
        socket.ev.on("group-participants.update", ({ id, participants, action }) => __awaiter(this, void 0, void 0, function* () {
            if (id === "120363138200204540@g.us")
                return;
            if (action === "add") {
                if (participants && blacklist.list.includes(participants[0])) {
                    yield (0, ban_1.ban)(socket, blacklist, lock, socket.user.id.replace(/\:\d+/, ""), id, participants[0], undefined, " já foi banido.");
                    return;
                }
                yield (0, regras_1.rules)(socket, id);
                return;
            }
            if (id === "120363084400589228@g.us") {
                if (action === "remove") {
                    yield (0, removeFrom_1.demoteFrom)(socket, [
                        "120363029900825529@g.us",
                        "120363042733129991@g.us",
                        "120363100560580311@g.us",
                    ], participants[0]);
                    return;
                }
                return;
            }
        }));
    });
}
exports.bot = bot;
