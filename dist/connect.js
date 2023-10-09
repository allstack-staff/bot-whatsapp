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
exports.connect = void 0;
const Baileys_1 = require("@WhiskeySockets/Baileys");
const Socket_1 = __importDefault(require("@WhiskeySockets/Baileys/lib/Socket"));
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    const { state, saveCreds } = yield (0, Baileys_1.useMultiFileAuthState)(path_1.default.resolve(__dirname, "..", "..", "auth"));
    const socket = (0, Socket_1.default)({
        printQRInTerminal: true,
        auth: state,
        logger: (0, pino_1.default)({ level: 'silent' })
    });
    socket.ev.on("connection.update", (update) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(`\nLogged on ${socket.user.name} ${socket.user.id}`);
        }
        if (connection === 'close') {
            const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !== Baileys_1.DisconnectReason.loggedOut;
            if (shouldReconnect) {
                yield (0, exports.connect)();
            }
        }
    }));
    socket.ev.on("creds.update", saveCreds);
    return socket;
});
exports.connect = connect;
(0, exports.connect)();
