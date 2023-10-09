
import { BaileysSocket } from '../../types/BaileysSocket';



export const mentionAll = async(socket: BaileysSocket, arJid: string, grJid: string) => {
  const metadata = await socket.groupMetadata(grJid);
  const participants = metadata.participants.map(x => x.id);
  const admins = metadata.participants.filter(x => x.admin).map(x => x.id)
  if (!(admins.includes(arJid))) {
    return;
  }
  let numbers: string[]= new Array(participants.length);

  for (let i = 0; i < participants.length; i++) {
    numbers[i] = "@" + (participants[i].split("@")[0])
  }

  let text = "";

  for (let i = 0; i < numbers.length; i++) {
    text += numbers[i] + '\n';
  }
  
  await socket.sendMessage(grJid, {
    text: text,
    mentions: participants
  })
}
