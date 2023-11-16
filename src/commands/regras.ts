import { BaileysSocket } from "../types/BaileysSocket";

export const rules = async (socket: BaileysSocket, rJid: string, regras: string) => {
  if (rJid === "120363138200204540@g.us") {
    await socket.sendMessage(rJid, { text: "Aqui não tem regras não rapaz." });
    return;
  }
  await socket.sendMessage(rJid, { text: regras });
};
