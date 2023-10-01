import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";

export const unban = async (
  socket: BaileysSocket,
  members: MemberList,
  sem: Semaphore,
  arJid: string,
  grJid: string,
  num: string,
) => {
  console.log([members, sem, arJid, grJid, num]);
  sem.acquire();
  const metadata = await socket.groupMetadata(grJid);
  const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);

  const urJid = num + "@s.whatsapp.net";
  if (admins.includes(arJid)) {
    try {
      members.rm(urJid);
      members.saveMembersList();
      members.replace(members.name);
      await socket.sendMessage(grJid, {
        text: `O usuário @${urJid.split("@")[0]} foi desbanido.`,
        mentions: [urJid],
      });
      await socket.groupParticipantsUpdate(grJid, [urJid], 'add');
    } catch (e) {
      if (e instanceof RangeError) {
        await socket.sendMessage(grJid, {
          text: `O usuário @${urJid.split("@")[0]} não foi banido.`,
          mentions: [urJid],
        });
        return;
      }
    }
  } else {
    await socket.sendMessage(grJid, {
      text: "É necessário ser uma pessoa autorizada para utilizar esse comando.",
    });
  }

  sem.release();
};
