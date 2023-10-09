import { blackclown } from "../bot_config";
import { BaileysSocket } from "../types/BaileysSocket";
import { GPTBotManager } from "../gpt-core/GPTBotManager";
type BlackClown = ReturnType<typeof blackclown>;
export declare function black(socket: BaileysSocket, sender: GPTBotManager<BlackClown>, rJid: string, key: any, m: any, text: string): Promise<void>;
export {};
//# sourceMappingURL=black.d.ts.map