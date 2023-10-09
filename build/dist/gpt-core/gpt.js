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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Gpt_hasConfigured;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gpt = void 0;
const AlreadyConfiguredError_1 = require("../exceptions/AlreadyConfiguredError");
class Gpt {
    constructor(gpt) {
        _Gpt_hasConfigured.set(this, false);
        this.gpt_instance = gpt;
    }
    config() {
        if (!__classPrivateFieldGet(this, _Gpt_hasConfigured, "f")) {
            this.gpt_instance.setHistory({
                role: "system",
                content: "Você é um assistente prestativo que fala tudo de forma didatica e um pouco verbosa.",
            });
            __classPrivateFieldSet(this, _Gpt_hasConfigured, true, "f");
        }
        else {
            throw new AlreadyConfiguredError_1.AlreadyConfiguredError("As configurações já foram definidas!");
        }
    }
    send(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.gpt_instance.defaultRequestChat(text);
        });
    }
    resetconfig() {
        __classPrivateFieldSet(this, _Gpt_hasConfigured, false, "f");
    }
}
exports.Gpt = Gpt;
_Gpt_hasConfigured = new WeakMap();
