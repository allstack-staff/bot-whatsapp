import { BaileysSocket } from "../types/BaileysSocket";

export const makeadmin = async (
  socket: BaileysSocket,
  grJid: string,
  urJid: string,
) => {
  const metadata = await socket.groupMetadata("120363084400589228@g.us");
  const participants = metadata.participants.map((x) => x.id);
  
  if (participants.includes(urJid)) {
    await socket.groupParticipantsUpdate(
      "120363029900825529@g.us",
      [urJid],
      "promote",
    );
    await socket.sendMessage(grJid, {
      text: `O usuário @${urJid.split("@")[0]} agora é um adminstrador.`,
      mentions: [urJid],
    });
  } else {
    await socket.sendMessage(grJid, {
      text: "É necessário ser uma pessoa autorizada para usar este comando.",
    });
  }
};
