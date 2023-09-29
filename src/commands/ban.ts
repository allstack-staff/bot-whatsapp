import path from "path";
import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from 'semaphore-async-await';

let instance: MemberList;

export const ban = async (
  socket: BaileysSocket,
  sem: Semaphore,
  arJid: string,
  grJid: string,
  rJid: string,
  key: any,
  motivo: string,
) => {
  await sem.acquire();

  if (!instance) {
    instance = new MemberList(
      path.resolve(__dirname, "internal", "blacklist.txt"),
    );
  }

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
      if (key)
        await socket.sendMessage(grJid, { react: { text: "✅", key: key } });
      await socket.groupParticipantsUpdate(grJid, [rJid], "remove");
      await socket.sendMessage(grJid, {
        text: `
O usuário @${rJid?.split("@")[0]} foi banido.
Motivo:${motivo}
`,
        mentions: [rJid],
      });
      instance.add(rJid);
      instance.saveMembersList();
      instance.replace(instance.name);
    } catch (e) {
      await socket.sendMessage(grJid, {
        react: {
          text: "‼️",
          key: key,
        },
      });
    }
  } else {
    await socket.sendMessage(grJid, {
      text: "É necessário ser uma pessoa autorizada para usar este comando.",
    });
  }

  sem.release();
};
