import { BaileysSocket } from '../types/BaileysSocket';

const whitelist = [
  "557798780834@s.whatsapp.net",
  "556286268745@s.whatsapp.net"
]
export const ban = async(socket: BaileysSocket, arJid: string, grJid: string, rJid: string, motivo: string) => {

  if (whitelist.includes(arJid)) {
  try {
      if (whitelist.includes(rJid)) {
        await socket.sendMessage(grJid, {text: "Um administrador não pode ser banido."});
        return;
      }
    await socket.groupParticipantsUpdate(grJid, [rJid], 'remove');
    await socket.sendMessage(grJid, {text: `
O usúario @${rJid.split('@')[0]} foi banido.
Motivo: ${motivo}
`, mentions: [rJid]})
  } catch (e) {
    await socket.sendMessage(grJid, {text: `Erro interno do servidor: ${e}.`})
  }
  } else {
    await socket.sendMessage(grJid, {text: "É necessário ser uma pessoa autorizada para usar este comando."});
  }
}
