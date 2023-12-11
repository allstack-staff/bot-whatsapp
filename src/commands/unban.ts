import { NoUserAdminError } from "../exceptions/NoUserAdminError";
import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";

export const unban = async (
  socket: BaileysSocket,
  members: MemberList,
  sem: Semaphore,
  arJid: string,
  grJid: string,
  num: string
) => {

  // console.log([members, sem, arJid, grJid, num]);

  sem.acquire();

  const metadata = await socket.groupMetadata(grJid);

  const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);

  const urJid = num + "@s.whatsapp.net";

  if (!admins.includes(arJid))
    throw new NoUserAdminError("\n\nUsuario não é admnin\n\n");
  
    members.rm(urJid);
    members.saveMembersList();
    members.replace(members.name);
    await socket.sendMessage(grJid, {
      text: `Usuário(a) @${urJid.split("@")[0]} removido da black list.`,
      mentions: [urJid],
    });
    await socket.groupParticipantsUpdate(grJid, [urJid], "add");


  sem.release();
};
