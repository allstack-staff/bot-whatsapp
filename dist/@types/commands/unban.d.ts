import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";
export declare const unban: (socket: BaileysSocket, members: MemberList, sem: Semaphore, arJid: string, grJid: string, num: string) => Promise<void>;
//# sourceMappingURL=unban.d.ts.map