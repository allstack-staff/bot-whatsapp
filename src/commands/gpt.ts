import { BaileysSocket } from '../types/BaileysSocket';
import { gpt, send} from '../bot_config';

export const defaultgpt = async (socket: BaileysSocket, rJid: string, m: any,key: any,  message: string) => {
  await socket.sendMessage(rJid, {react: { text: "👍", key: key}});
  await socket.sendMessage(rJid, {text: await send(gpt(), message)}, {quoted: m});
} 
