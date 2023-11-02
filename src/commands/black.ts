import blackclown from "../gpt-core/blackclown";
import { BaileysSocket } from "../types/BaileysSocket";

export const black = async (
  socket: BaileysSocket,
  rJid: string,
  key: any,
  m: any,
  message: string,
) => {
  const id: string = key.participant.split('@')[0]
  await socket.sendMessage(rJid, { react: { text: "✅", key: key } });
  await socket.sendMessage(
    rJid,
    { text: (await blackclown.send(message, id))?.content! },
    { quoted: m },
  );
};
