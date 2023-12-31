import { BaileysSocket } from "../types/BaileysSocket";

export const makeadmin = async (
  socket: BaileysSocket,
  grJid: string,
  urJid: string
) => {
  if (grJid === "120363084400589228@g.us") {
    await socket.sendMessage(grJid, {
      text: "O uso de $asb makeadmin no grupo dos administradores não é permitido.",
    });
    return;
  }
  const metadata = await socket.groupMetadata("120363084400589228@g.us");
  const participants = metadata.participants.map((x) => x.id);

  if (participants.includes(urJid)) {
    const { subject } = await socket.groupMetadata(grJid);
    await socket.groupParticipantsUpdate(grJid, [urJid], "promote");
    await socket.sendMessage("120363084400589228@g.us", {
      text: `O usuário @${
        urJid.split("@")[0]
      } agora é um adminstrador do grupo ${subject}.`,
      mentions: [urJid],
    });
  } else {
    throw new Error();
  }
};
