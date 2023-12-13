import { BaileysSocket } from "../types/BaileysSocket";
import { Dalle } from "../ia-core/dalle";
import { SendMessageError } from "../exceptions/SendMessageError";
import "dotenv/config";
import { resolve } from "path";
export const generateImage = async (
  socket: BaileysSocket,
  rJid: string,
  key: any,
  m: any,
  message: string
) => {
  const dalle = new Dalle(process.env.API_KEY);
  const ID: string =
    key.participant?.split("@")[0] ?? key.remoteJid?.split("@")[0];
  await socket.sendMessage(rJid, { react: { text: "✅", key: key } });
  const image = await dalle.send(message, ID);
  const path = resolve(__dirname, "..", "imagens", image);
  await socket.sendMessage(
    rJid,
    { image: { url: path }, caption: `ID: *${image}*` },
    { quoted: m }
  );
};
