import { resolve } from "path";
import { readFile } from "fs/promises";
import { BaileysSocket } from "../types/BaileysSocket";
import { existsSync } from "fs";
import { NoLogFileFromUserID } from "../exceptions/NoLogFileFromUserID";

export const getImageById = async (socket: BaileysSocket, rjid: string, key: any, m: any, img: string) => {
  const id: string = key.participant?.split('@')[0] || key.remoteJid?.split('@')[0]
  const path = resolve(__dirname, '..', 'logs', 'dalle', `${id}.json`)
  if (!existsSync(path)) {
    await socket.sendMessage(
      rjid,
      { text: `Não existe log desse usuario no DALL-e` },
      { quoted: m },
    );
    throw new NoLogFileFromUserID("Não existe log desse usuario no DALL-e")
  }

  const database: Array<{
    role: string;
    content: string;
  }> = JSON.parse(await readFile(path, 'utf-8'))

  // const temp = database.filter(item => item.content === img || item.content.startsWith(img));
  const temp = database.filter(item => item.content.trim().toLowerCase() === img.trim().toLowerCase() || item.content.trim().toLowerCase().startsWith(img.trim().toLowerCase()));


  if (temp.length === 1) {
    const url = resolve(__dirname, '..', 'imagens', temp[0].content)
    await socket.sendMessage(
      rjid,
      { image: { url } },
      { quoted: m },
    );
  } else if (temp.length > 1) {
    const idList = temp.map(item => item.content);
    const idListText = idList.join('\n');

    await socket.sendMessage(
      rjid,
      { text: `Vários encontrados: \n *${idListText}*` },
      { quoted: m },
    );
  } else {
    await socket.sendMessage(
      rjid,
      { text: 'Nada encontrado, meu chapa.' },
      { quoted: m },
    );
  }

}