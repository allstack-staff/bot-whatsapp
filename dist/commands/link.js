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
exports.link = void 0;
const fs_1 = require("fs");
const link_1 = __importDefault(require("../gpt-core/link"));
const link = (socket, jid, m, message, link) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const valid = yield link_1.default.request(message);
        console.log(valid);
        if (valid === "true") {
            if (typeof jid === 'string') {
                yield socket.sendMessage(jid, { react: { text: "✅", key: m.messages[0] } });
                console.log(link);
                yield socket.sendMessage(jid, { text: `👀 Pediu o link? ${link}` }, { quoted: m.messages[0] });
            }
        }
    }
    catch (e) {
        if (!(0, fs_1.existsSync)('../../log'))
            (0, fs_1.mkdirSync)('../../log');
        (0, fs_1.writeFile)('../../log/gpt.link.log', `\n\n ${new Date} \n ${e}`, () => { return; });
    }
});
exports.link = link;
