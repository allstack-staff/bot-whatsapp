import { BaileysSocket } from "../types/BaileysSocket";

export const hello = async (
  socket: BaileysSocket,
  rJid: string,
  key: any,
  content: string,
) => {
  await socket.sendMessage(rJid, { react: { text: "✅", key: key } });
  await socket.sendMessage(rJid, { text: content });
};
