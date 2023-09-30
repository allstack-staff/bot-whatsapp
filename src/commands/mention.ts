import { BaileysSocket } from '../types/BaileysSocket';

export const mention = async(socket: BaileysSocket, rJid: string, num: string) => {
  await socket.sendMessage(rJid, { text: `@${num}`, mentions: [num + "@s.whatsapp.net"]})
}

const re: RegExp = /\d+/g;
const texto: string = "123 456 789"
console.log(texto.match(re))
