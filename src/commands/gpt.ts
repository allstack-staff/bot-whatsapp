import { BaileysSocket } from "../types/BaileysSocket";
import { gpt } from "../bot_config";
import { GPTBotManager } from "../gpt-core/GPTBotManager";

type Gpt = ReturnType<typeof gpt>;

export const defaultgpt = async (
  socket: BaileysSocket,
  sender: GPTBotManager<Gpt>,
  rJid: string,
  key: any,
  m: any,
  message: string,
) => {
  await socket.sendMessage(rJid, { react: { text: "✅", key: key } });
  await socket.sendMessage(
    rJid,
    { text: (await sender.bot?.send(message))?.content! },
    { quoted: m },
  );
};
