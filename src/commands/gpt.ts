import { BaileysSocket } from "../types/BaileysSocket";
import gpt from "../ia-core/gpt";

export const defaultgpt = async (
  socket: BaileysSocket,
  rJid: string,
  key: any,
  m: any,
  message: string
) => {
  const id: string =
    key.participant?.split("@")[0] ?? key.remoteJid?.split("@")[0];
  const react = await socket.sendMessage(rJid, {
    react: { text: "✅", key: key },
  });
  const msg = await socket.sendMessage(
    rJid,
    { text: (await gpt.send(message, id))?.content! },
    { quoted: m }
  );
  Promise.all([react, msg]);
};
