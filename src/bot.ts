import { connect } from "./conn";
import { hello } from "./commands/hello";
import { rules } from "./commands/regras";
import { ban } from "./commands/ban";
import { black } from "./commands/black";
import { makeadmin } from "./commands/makeadmin";
import { generateImage } from "./commands/dalle";
import { defaultgpt } from "./commands/gpt";
import { demoteFrom } from "./commands/internal/removeFrom";
import { mentionAll } from "./commands/internal/mentionAll";
import { unban } from "./commands/unban";
import { mention } from "./commands/mention";
import Semaphore from 'semaphore-async-await';
import path from 'path';
import { MemberList } from "./commands/internal/MemberList";
import { doc } from "./commands/doc";
import { getImageById } from "./commands/get";

let blacklist: MemberList = new MemberList(
  path.resolve(__dirname, "commands", "internal", "blacklist.txt")
);
const lock: Semaphore = new Semaphore(1);

export async function bot() {
  const socket = await connect();

  const admin = async (userID: any, groupID: string) => {
    const metadata = await socket.groupMetadata(groupID)
    const user = metadata.participants.find((user) => user.id === userID)
    return user && user.admin == 'admin'
  }

  socket.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify" || m.messages[0].key.remoteJid === "status@broadcast") return;
    if (m.messages[0].key.fromMe) return

    // console.log(JSON.stringify(m, undefined, 2));
    let message: string | undefined | null;

    if (
      !(
        m.messages[0].message?.conversation ||
        m.messages[0].message?.extendedTextMessage?.text ||
        m.messages[0].message?.imageMessage ||
        m.messages[0].message?.videoMessage ||
        m.messages[0].message?.stickerMessage
      )
    )
      return;

    //pega o conteudo da mensagem
    message = m.messages[0].message?.conversation
      ? m.messages[0].message?.conversation
      : m.messages[0].message?.extendedTextMessage?.text;

    // console.log("Condições para generateImage:", message!, m.messages[0].key.remoteJid, !m.messages[0].key.participant, message!.startsWith('$img'), !message!.startsWith('$img --get'));

    // console.log("Condições para getImageById:", message, m.messages[0].key.remoteJid, !m.messages[0].key.participant, message!.startsWith('$img --get'));

    // Inicio do Privado
    if (message && m.messages[0].key.remoteJid && !m.messages[0].key.participant && message.startsWith('$img') && !message.startsWith('$img --get')) {
      await generateImage(
        socket,
        m.messages[0].key.remoteJid!,
        m.messages[0].key,
        m.messages[0],
        message.slice(4)
      ).catch(error => console.error(error))
      return;
    } else if (message && m.messages[0].key.remoteJid && !m.messages[0].key.participant && message.startsWith('$img --get')) {
      await getImageById(
        socket,
        m.messages[0].key.remoteJid!,
        m.messages[0].key,
        m.messages[0],
        message.split(' ')[2]
      ).catch(error => console.error(error))
      return;
    }
    else if (message && m.messages[0].key.remoteJid && !m.messages[0].key.participant) {
      await defaultgpt(
        socket,
        m.messages[0].key.remoteJid!,
        m.messages[0].key,
        m.messages[0],
        message,
      ).catch(error =>
        console.error(error)
      );
      return;
    }
    // Fim do privado

    if (message?.includes("@all")) {
      const groupJid = m.messages[0].key.remoteJid!.endsWith("g.us")
        ? m.messages[0].key.remoteJid!
        : undefined;

      const isAdmin = await admin(m.messages[0].key.participant!, groupJid!.toString())

      if (groupJid && isAdmin) {
        await mentionAll(socket, m.messages[0].key.participant!, groupJid);
      }
    }

    if (message && message.startsWith("$asb")) {
      if (/^(\$asb)\s*$/.test(message)) {
        await hello(
          socket,
          m.messages[0].key.remoteJid!,
          m.messages[0].key,
          "Olá! este é o bot utilitário da All Stack Community."
        );
        return;
      }
      if (message.split(' ')[1].startsWith("makeadmin") || message.split(' ')[1].startsWith("-ma")) {
        try {
          const groupJid = m.messages[0].key.remoteJid!.endsWith("@g.us")
            ? m.messages[0].key.remoteJid
            : undefined;
          if (groupJid) {
            await makeadmin(socket, groupJid, m.messages[0].key.participant!);
          } else {
            await socket.sendMessage(m.messages[0].key.remoteJid!, {
              text: "Estamos em uma conversa pessoal.",
            });
          }
        } catch (error) {
          console.error(error)
          return
        }
      } // MakeAdmin
      else if (message.split(' ')[1].startsWith("mention") || message.split(' ')[1].startsWith("-me")) {
        const num = (message.match(/\d+/));
        if (num) {
          try {
            await mention(socket, m.messages[0].key.remoteJid!, num[0]);
          } catch (e) {
            await socket.sendMessage(m.messages[0].key.remoteJid!, { react: { text: "‼️", key: m.messages[0].key } });
            console.error(e);
          }
        }
      }
      else if (message.split(' ')[1].startsWith("gpt")) {
        await defaultgpt(
          socket,
          m.messages[0].key.remoteJid!,
          m.messages[0].key,
          m.messages[0],
          message.slice(8),
        ).catch(error =>
          console.error(error)
        );
        return;
      }
      else if (message.split(' ')[1].startsWith("bc")) {
        try {
          await black(
            socket,
            m.messages[0].key.remoteJid!,
            m.messages[0].key,
            m.messages[0],
            message.slice(7)
          );
        } catch (e) {
          await socket.sendMessage(m.messages[0].key.remoteJid!, {
            react: {
              text: "‼️",
              key: m.messages[0]
            }
          });
        }
      }
      else if (message.split(' ')[1].startsWith("img") && !message.split(' ')[2].startsWith("--get")) {
        try {
          await generateImage(
            socket,
            m.messages[0].key.remoteJid!,
            m.messages[0].key,
            m.messages[0],
            message.slice(8)
          )
          return
        } catch (error) {
          console.error(error)
          return
        }
      }
      else if (message.split(' ')[1].startsWith("img") && message.split(' ')[2].startsWith("--get")) {
        await getImageById(
          socket,
          m.messages[0].key.remoteJid!,
          m.messages[0].key,
          m.messages[0],
          message.split(' ')[4]
        ).catch(error => console.error(error))
        return;
      }
      if (message.split(' ')[1].startsWith("regras")) {
        try {
          const metadata = await socket.groupMetadata(m.messages[0].key.remoteJid!)
          const description = metadata.desc
          if (description) {
            await rules(socket, m.messages[0].key.remoteJid!, description);

          }
        } catch { return }
      }
      else if (message.split(' ')[1].startsWith("ban")) { //$asb::ban
        if (
          !m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid
        ) {
          await socket.sendMessage(m.messages[0].key.remoteJid!, {
            react: {
              text: "‼️",
              key: m.messages[0]
            }
          })
          await socket.sendMessage(m.messages[0].key.remoteJid!, {
            text: "precisa-se de ter alguem pra banir!",
          });
          return;
        }

        const jids =
          m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid;

        const [usuario, motivo] = [
          jids[0],
          message.split(jids[0].split("@")[0])[1],
        ];

        const grouprJid = m.messages[0].key.remoteJid!.endsWith("@g.us")
          ? m.messages[0].key.remoteJid
          : undefined;

        try {
          if (grouprJid) {
            await ban(
              socket,
              blacklist,
              lock,
              m.messages[0].key.participant!.trim(),
              grouprJid,
              usuario,
              m.messages[0],
              motivo,
            );
          } else {
            (await socket.sendMessage(m.messages[0].key.remoteJid!, {
              text: "estamos numa conversa pessoal.",
            }));
          }

        } catch (_) {
          await socket.sendMessage(m.messages[0].key.remoteJid!, {
            text: "Error: Parametros incompletos",
          });
        }

      }
      else if (message.split(' ')[1].startsWith("unban")) { //$asb::unban
        const num = message.match(/\d+/);
        // console.log(`NUMERO:${num}`)
        if (num) {
          try {
            await unban(socket, blacklist, lock, m.messages[0].key.participant!, m.messages[0].key.remoteJid!, num[0]);
          } catch (e) {
            await socket.sendMessage(m.messages[0].key.remoteJid!, { react: { text: "‼️", key: m.messages[0].key } });
          }
        } else {
          await socket.sendMessage(m.messages[0].key.remoteJid!, { text: "Erro: nenhum numero fornecido" });
          return;
        }
      }
      else if (message.split(' ')[1].startsWith("doc")) {
        await doc(
          socket,
          m.messages[0].key.remoteJid!,
          m.messages[0].key,
          m.messages[0]
        ).catch(error => console.error(error))
      }
    }
    // Dando muito problema, desativado.
    // Se a mensagem não possui link...
    // if (message && ! /^(https?|ftp?|http):\/\/[^\s/$.?#].[^\s]*$/i.test(message) && !m.messages[0].key.fromMe) {
    //   const jid = m.messages[0].key.remoteJid as unknown as string
    //   const userID = m.messages[0].key.participant!
    //   const metadata = await socket.groupMetadata(jid)

    //   const admin = (userID: any) => {
    //     const user = metadata.participants.find((user) => user.id === userID)
    //     return user && user.admin == 'admin'
    //   }
    //   console.log(admin(userID))
    //   if (admin(userID)) return

    //   const gLink = await socket.groupInviteCode(jid)
    //   await link(socket, jid, m, message, `https://chat.whatsapp.com/${gLink}`)
    // }
  });

  socket.ev.on(
    "group-participants.update",
    async ({ id, participants, action, }) => {
      if (id === "120363138200204540@g.us") return;
      if (action === "add") {
        if (participants && blacklist.list.includes(participants[0])) {
          await ban(socket, blacklist, lock, socket.user!.id.replace(/\:\d+/, ""), id, participants[0], undefined, " já foi banido.").catch(error => console.error(error))
          return;
        }

        try {
          const metadata = await socket.groupMetadata(id)
          const description = metadata.desc
          if (description) {
            await rules(socket, participants[0], description)
          }
        } catch { return }
        return;
      }
      if (id === "120363084400589228@g.us") {
        try {
          if (action === "remove") {
            await demoteFrom(
              socket,
              [
                "120363029900825529@g.us",
                "120363042733129991@g.us",
                "120363100560580311@g.us",
              ],
              participants[0]
            );
            return;
          }
          return;
        } catch (error) {
          console.error(error)
        }
      }
    }
  );
}
