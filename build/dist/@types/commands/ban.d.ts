import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";
export declare const ban: (socket: BaileysSocket, members: MemberList, sem: Semaphore, arJid: string, grJid: string, rJid: string, key: any, motivo: string) => Promise<void>;
//# sourceMappingURL=ban.d.ts.map