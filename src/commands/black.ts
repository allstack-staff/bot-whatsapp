import { blackclown } from "../bot_config";
import { BaileysSocket } from "../types/BaileysSocket";
import { GPTBotManager } from "../gpt-core/GPTBotManager";

type BlackClown = ReturnType<typeof blackclown>;

export async function black(
  socket: BaileysSocket,
  sender: GPTBotManager<BlackClown>,
  rJid: string,
  key: any,
  m: any,
  text: string,
) {
  await socket.sendMessage(rJid, { react: { text: "✅", key: key } });
  await socket.sendMessage(
    rJid,
    { text: (await sender.bot?.send(text))?.content! },
    { quoted: m },
  );
}
