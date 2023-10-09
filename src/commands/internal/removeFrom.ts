import { BaileysSocket } from "../../types/BaileysSocket";

export const demoteFrom = async (
  socket: BaileysSocket,
  grJids: string[],
  urJid: string,
) => {
  for (let grJid of grJids) {
    await socket.groupParticipantsUpdate(grJid, [urJid], "demote");
  }
};
