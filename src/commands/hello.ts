import { BaileysSocket } from '../types/BaileysSocket';


export const hello = async (socket: BaileysSocket, rJid: string, content: string) => {
  await socket.sendMessage(rJid, { text: content} );
}
