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
var _MemberList_instances, _MemberList_list, _MemberList_name, _MemberList_mount;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberList = void 0;
const fs_1 = __importDefault(require("fs"));
class MemberList {
    constructor(file) {
        _MemberList_instances.add(this);
        _MemberList_list.set(this, void 0);
        _MemberList_name.set(this, void 0);
        __classPrivateFieldSet(this, _MemberList_name, file, "f");
        __classPrivateFieldGet(this, _MemberList_instances, "m", _MemberList_mount).call(this, file);
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
            if (!(__classPrivateFieldGet(this, _MemberList_list, "f").includes(rJid)))
                __classPrivateFieldGet(this, _MemberList_list, "f").push(rJid);
        }
    }
    pop() {
        return __classPrivateFieldGet(this, _MemberList_list, "f").pop();
    }
    rm(rJid) {
        if (/\d+\@s\.whatsapp\.net/.test(rJid)) {
            const index = __classPrivateFieldGet(this, _MemberList_list, "f").indexOf(rJid);
            if (index === -1) {
                throw new RangeError("indice invalido!");
            }
            __classPrivateFieldGet(this, _MemberList_list, "f").splice(index);
        }
    }
    saveMembersList() {
        fs_1.default.writeFileSync(__classPrivateFieldGet(this, _MemberList_name, "f"), __classPrivateFieldGet(this, _MemberList_list, "f").join("\n"));
    }
    replace(file) {
        __classPrivateFieldGet(this, _MemberList_instances, "m", _MemberList_mount).call(this, file);
        __classPrivateFieldSet(this, _MemberList_name, file, "f");
    }
    copy() {
        return new MemberList(__classPrivateFieldGet(this, _MemberList_name, "f"));
    }
}
exports.MemberList = MemberList;
_MemberList_list = new WeakMap(), _MemberList_name = new WeakMap(), _MemberList_instances = new WeakSet(), _MemberList_mount = function _MemberList_mount(file) {
    __classPrivateFieldSet(this, _MemberList_list, fs_1.default.readFileSync(file, 'utf8').split("\n").filter(x => /\d+\@s\.whatsapp\.net/.test(x)), "f");
    __classPrivateFieldSet(this, _MemberList_list, __classPrivateFieldGet(this, _MemberList_list, "f").filter((x, idx) => __classPrivateFieldGet(this, _MemberList_list, "f").indexOf(x) === idx), "f");
};
