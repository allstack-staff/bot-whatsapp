import { BaileysSocket } from "../types/BaileysSocket";
import { gpt } from "../bot_config";
import { GPTBotManager } from "../gpt-core/GPTBotManager";
type Gpt = ReturnType<typeof gpt>;
export declare const defaultgpt: (socket: BaileysSocket, sender: GPTBotManager<Gpt>, rJid: string, key: any, m: any, message: string) => Promise<void>;
export {};
//# sourceMappingURL=gpt.d.ts.map