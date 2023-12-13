import { BaileysSocket } from "../types/BaileysSocket";
import { MemberList } from "./internal/MemberList";
import Semaphore from "semaphore-async-await";
import { readFileSync } from "fs";
import { resolve } from "path";
const regras = JSON.parse(
  readFileSync(
    resolve(__dirname, "internal", "regras.json"),
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
  participant: string,
  groupJid: string,
  userJid: string,
  key: any,
  motivo: string | number
) => {
  await sem.acquire();

  if (typeof motivo == "number") {
    motivo = getrule(motivo) ?? "Regra de Exceção";
  }

  const metadata = await socket.groupMetadata(groupJid);
  const admins = metadata.participants.filter((x) => x.admin).map((x) => x.id);
  if (admins.includes(participant)) {
    if (participant === userJid) {
      await socket.sendMessage(groupJid, {
        react: {
          text: "❌",
          key: key,
        },
>>>>>>> mudancas
      });
      return;
    }
    await socket.sendMessage(groupJid, { react: { text: "✅", key: key } });
    await socket.groupParticipantsUpdate(groupJid, [userJid], "remove");
    await socket.sendMessage(groupJid, {
      text: `O usuário(a) @${userJid?.split(
        "@"
      )[0]} foi banido(a). Motivo: ${motivo}`,
      mentions: [userJid],
    });
    members.add(userJid);
    members.saveMembersList();
    members.replace(members.name);
  } else {
    await socket.sendMessage(groupJid, {
      react: {
        text: "❌",
        key: key,
      },
    });
  }
<<<<<<< HEAD
=======

  sem.release();
>>>>>>> mudancas
};
