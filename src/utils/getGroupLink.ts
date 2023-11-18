import { BaileysSocket } from '../types/BaileysSocket';

export const getGroupLink = async(socket: BaileysSocket, grJid: string) => {
  try {
  const inviteCode = await socket.groupInviteCode(grJid);
  
  if (inviteCode !== null && inviteCode !== undefined) {
    await socket.sendMessage(grJid, { text: `Aqui o link: https://chat.whatsapp.com/${inviteCode}`})
  }
  } catch (e) {

    if ((e as any).data === 401) {
      await socket.sendMessage(grJid, { text: "Ih rapaz, não tenho autorização aqui nao."});
    }
  }
}
