import { BaileysSocket } from "../types/BaileysSocket";

export const ban = async (
  socket: BaileysSocket,
  arJid: string,
  grJid: string,
  rJid: string,
  motivo: string
) => {
  const metadata = await socket.groupMetadata(grJid);
  const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);
  if (admins.includes(arJid)) {
    try {
      if (arJid === rJid) {
        await socket.sendMessage(grJid, {
          text: "Você não pode banir a si mesmo!",
        });
        return;
      }
      await socket.groupParticipantsUpdate(grJid, [rJid], "remove");
      await socket.sendMessage(grJid, {
        text: `O usuário @${
          rJid.split("@")[0]
        } foi banido. \n Motivo:${motivo}`,
        mentions: [rJid],
      });
    } catch (e) {
      await socket.sendMessage(grJid, {
        text: `Erro interno do servidor: ${e}.`,
      });
    }
  } else {
    await socket.sendMessage(grJid, {
      text: "É necessário ser uma pessoa autorizada para usar este comando.",
    });
  }
};
