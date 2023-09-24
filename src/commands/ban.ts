import { BaileysSocket } from '../types/BaileysSocket';

const whitelist = [
<<<<<<< HEAD
  /* uma whitelist de remoteJids, coloque os rjids desejados aqui */
=======
  "557798780834@s.whatsapp.net",
  "556286268745@s.whatsapp.net",
  "557981640177@s.whatsapp.net",
  "557991348846@s.whatsapp.net",
  "555185965384@s.whatsapp.net"
>>>>>>> b3cd4ef (modified somethings)
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
