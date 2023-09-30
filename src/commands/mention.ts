import { BaileysSocket } from '../types/BaileysSocket';

export const mention = async(socket: BaileysSocket, rJid: string, num: string) => {
  await socket.sendMessage(rJid, { text: `@${num}`, mentions: [num + "@s.whatsapp.net"]})
}

