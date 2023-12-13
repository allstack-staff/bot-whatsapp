import { BaileysSocket } from "../types/BaileysSocket";

export const rules = async (socket: BaileysSocket, rJid: string, regras: string) => {
  await socket.sendMessage(rJid, { text: regras });
};
