import { readFile } from "fs/promises";
import { resolve } from "path";
import { BaileysSocket } from "../types/BaileysSocket";

export const doc = async (
  socket: BaileysSocket,
  rJid: string,
  key: any,
  m: any
) => {
  const rules = await readFile(resolve(__dirname, '..', '..', 'comandos.md'), 'utf-8')
  await socket.sendMessage(rJid, { react: { text: "✅", key: key } });
  await socket.sendMessage(
    rJid,
    { text: rules },
    { quoted: m },
  );
}