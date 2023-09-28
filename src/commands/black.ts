import { blackclown, send } from '../bot_config';
import { BaileysSocket } from '../types/BaileysSocket';

export async function black(socket: BaileysSocket, rJid: string, key: any, m: any, text: string) {
  await socket.sendMessage(rJid, { react: {text: "✅", key: key}})
  await socket.sendMessage(rJid, {text: await send(blackclown(), text)}, {quoted: m});
}
