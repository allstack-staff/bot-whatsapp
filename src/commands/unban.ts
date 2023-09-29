
import path from "path";
import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";

let members: MemberList;

export const unban = async (
  socket: BaileysSocket,
  sem: Semaphore,
  arJid: string,
  grJid: string,
  urJid: string,
) => {
  sem.acquire();
  if (!members) {
    members = new MemberList(path.resolve(__dirname, "commands", "internal", "blacklist.txt"));
  }
  let admins: string[];
  socket.groupMetadata("120363084400589228@g.us")
  .then(res => setTimeout(() => {
      admins = res.participants.map(x => x.id);
    }, 500))
  .catch(err => {
      console.error(err);
      return;
    });

  if (admins!.includes(arJid)) {
  try {
    members.rm(urJid);
    members.saveMembersList();
    members.replace(members.name);
    await socket.sendMessage(grJid, {
      text: `O usuário @${urJid.split("@")[0]} foi desbanido.`,
      mentions: [urJid],
    });
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
    await socket.sendMessage(grJid, {text: "É necessário ser uma pessoa autorizada para utilizar esse comando."})
  }

  sem.release();
};
