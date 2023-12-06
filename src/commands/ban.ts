import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";
import { readFileSync } from "fs";
import { resolve } from "path";
const regras = JSON.parse(
  readFileSync(
    resolve(".", "dist", "commands", "internal", "regras.json"),
    "utf-8"
  )
);

function getrule(key: number) {
  return regras[key];
}
export const ban = async (
  socket: BaileysSocket,
  members: MemberList,
  sem: Semaphore,
  arJid: string,
  grJid: string,
  rJid: string,
  key: any,
  motivo: string | number
) => {
  await sem.acquire();

  if (typeof motivo == "number") {
    motivo = getrule(motivo) ?? " regra indefinida";
  }

  const metadata = await socket.groupMetadata(grJid);
  const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);
  if (admins.includes(arJid)) {
    try {
      if (arJid === rJid) {
        await socket.sendMessage(grJid, {
          text: "Você não pode banir a si mesmo(a)!",
        });
        return;
      }
      if (key)
        await socket.sendMessage(grJid, { react: { text: "✅", key: key } });
      await socket.groupParticipantsUpdate(grJid, [rJid], "remove");
      await socket.sendMessage(grJid, {
        text: `O usuário(a) @${rJid?.split(
          "@"
        )[0]} foi banido(a). Motivo:${motivo}`,
        mentions: [rJid],
      });
      members.add(rJid);
      members.saveMembersList();
      members.replace(members.name);
    } catch (e) {
      await socket.sendMessage(grJid, {
        react: {
          text: "❌",
          key: key,
        },
      });
    }
  } else {
    await socket.sendMessage(grJid, {
      react: {
        text: "❌",
        key: key,
      },
    });
  }

  sem.release();
};
