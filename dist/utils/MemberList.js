"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _MemberList_list, _MemberList_name;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberList = void 0;
const fs_1 = __importDefault(require("fs"));
class MemberList {
    constructor(file) {
        _MemberList_list.set(this, void 0);
        _MemberList_name.set(this, void 0);
        fs_1.default.readFile(file, 'utf-8', (err, buf) => {
            setTimeout(() => {
                if (err)
                    throw err;
                __classPrivateFieldSet(this, _MemberList_list, buf.split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x)), "f");
            }, 500);
        });
        __classPrivateFieldSet(this, _MemberList_name, file, "f");
    }
    get list() {
        return Array.from(__classPrivateFieldGet(this, _MemberList_list, "f"));
    }
    get name() {
        return __classPrivateFieldGet(this, _MemberList_name, "f");
    }
    add(rJid) {
        if (!__classPrivateFieldGet(this, _MemberList_list, "f"))
            return;
        if (/\d+\@s\.whatsapp\.net/.test(rJid)) {
            __classPrivateFieldGet(this, _MemberList_list, "f").push(rJid);
        }
        else {
            throw new TypeError(`${rJid} is not a valid jid!`);
        }
    }
    pop() {
        return __classPrivateFieldGet(this, _MemberList_list, "f").pop();
    }
    saveList() {
        fs_1.default.writeFile(__classPrivateFieldGet(this, _MemberList_name, "f"), __classPrivateFieldGet(this, _MemberList_list, "f").join("\n"), err => {
            if (err)
                throw err;
        });
    }
    replace(file) {
        fs_1.default.readFile(file, 'utf-8', (err, buf) => {
            setTimeout(() => {
                if (err)
                    throw err;
                __classPrivateFieldSet(this, _MemberList_list, buf.split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x)), "f");
            }, 500);
        });
        __classPrivateFieldSet(this, _MemberList_name, file, "f");
    }
}
exports.MemberList = MemberList;
_MemberList_list = new WeakMap(), _MemberList_name = new WeakMap();
