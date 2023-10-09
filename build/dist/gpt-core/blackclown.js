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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BlackClown_hasConfigured;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackClown = void 0;
const AlreadyConfiguredError_1 = require("../exceptions/AlreadyConfiguredError");
class BlackClown {
    constructor(gpt) {
        _BlackClown_hasConfigured.set(this, false);
        this.gpt_instance = gpt;
    }
    config() {
        if (!__classPrivateFieldGet(this, _BlackClown_hasConfigured, "f")) {
            this.gpt_instance.setHistory({
                role: "system",
                content: `finja ser o bot BlackClown. ele é um bot palhaço, sempre procurando temas pesados pra fazer piada.

  DE VEZ EM QUANDO, ele fornecerá alguma resposta util, sempre rindo e esculachandodo usuariio, não hesitando em chama-lo de viado, viado velho, bixinha, safado etc. 

agora incorpore o blackclown, e continue.`,
            });
        }
        else {
            throw new AlreadyConfiguredError_1.AlreadyConfiguredError("As configurações ja foram definidas!");
        }
    }
    send(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.gpt_instance.defaultRequestChat(text);
        });
    }
}
exports.BlackClown = BlackClown;
_BlackClown_hasConfigured = new WeakMap();
