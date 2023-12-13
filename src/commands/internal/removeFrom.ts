import { GroupMetadata } from "@whiskeysockets/baileys";
import { BaileysSocket } from "../../types/BaileysSocket";

export const demoteFrom = async (
  socket: BaileysSocket,
  // grJids: string[],
  urJid: string
) => {
  // for (let grJid of grJids) {
  //   await socket.groupParticipantsUpdate(grJid, [urJid], "demote");
  // }

  const grupos: { [_: string]: GroupMetadata } =
    await socket.groupFetchAllParticipating();

  await new Promise((res) => {
    const idsArray: string[] = Object.keys(grupos);

    idsArray.forEach((id, index) => {
      setTimeout(
        async () => {
          await socket
            .groupParticipantsUpdate(id, [urJid], "demote")
            .catch((error) => {
              console.error(error);
              return
            });

          if (index === idsArray.length - 1) res("true");
        },
        5000 * (index + 1)
      );
    });
  });
};
