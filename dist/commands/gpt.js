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
exports.defaultgpt = void 0;
const defaultgpt = (socket, sender, rJid, key, m, message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield socket.sendMessage(rJid, { react: { text: "✅", key: key } });
    yield socket.sendMessage(rJid, { text: (_b = (yield ((_a = sender.bot) === null || _a === void 0 ? void 0 : _a.send(message)))) === null || _b === void 0 ? void 0 : _b.content }, { quoted: m });
});
exports.defaultgpt = defaultgpt;
