
import { writeFile, existsSync, mkdirSync } from "fs";
import Link from "../ia-core/link";
import { BaileysSocket } from "../types/BaileysSocket";

export const link = async (
  socket: BaileysSocket,
  jid: string | null | undefined,
  m: any,
  message: string,
  link: string | undefined) => {

  try {
    const valid = await Link.request(message)
    console.log(valid);
    if (valid === "true") {
      // const link = socket.groupInviteCode(jid)
      if (typeof jid === 'string') {
        await socket.sendMessage(jid, { react: { text: "✅", key: m.messages[0] } });
        
        console.log(link)
        await socket.sendMessage(jid, { text: `👀 Pediu o link? ${link}` }, { quoted: m.messages[0] })

      }


    }

  } catch (e) {
    if (!existsSync('../../log')) mkdirSync('../../log')
    writeFile('../../log/gpt.link.log', `\n\n ${new Date} \n ${e}`, () => { return })
  }

}