import { connect } from "./conn";
import { hello } from "./commands/hello";
import { rules } from "./commands/regras";
import { ban } from "./commands/ban";
import { black } from "./commands/black";
import { makeadmin } from "./commands/makeadmin";
import { defaultgpt } from "./commands/gpt";
import { demoteFrom } from "./commands/internal/removeFrom";
import { unban } from "./commands/unban";
import { readFile } from "fs";
import Semaphore from "semaphore-async-await";
import path from "path";

let blacklist: string[] = [];

readFile(
  path.resolve(__dirname, "commands", "internal", "blacklist.txt"),
  "utf8",
  (err, data) => {
    if (err) throw err;

    blacklist = data.split("\n");
  }
);

const lock = new Semaphore(1);

export async function bot() {
  const socket = await connect();
  socket.ev.on("messages.upsert", async (m) => {
    
    if (
      // m.type === "notify" ||
      m.messages[0].key.remoteJid === "status@broadcast"
    )
      return;
    console.log(JSON.stringify(m, undefined, 2));
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

    if (message && message.startsWith("$asb")) {
      console.log(message);
      if (/^(\$asb)\s*$/.test(message)) {
        await hello(
          socket,
          m.messages[0].key.remoteJid!,
          m.messages[0].key,
          "Olá! este é o bot utilitário da All Stack Community."
        );
        return;
      } else if (/^(\$asb)\:(?!\:)/.test(message)) {
        if (message.slice(5).startsWith("makeadmin")) {
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
        } else if (message.slice(5).startsWith("gpt")) {
          await defaultgpt(
            socket,
            m.messages[0].key.remoteJid!,
            m.messages[0].key,
            m.messages[0],
            message.slice(9)
          );
        } else if (message.slice(5).startsWith("bc")) {
          try {
            await black(
              socket,
              m.messages[0].key.remoteJid!,
              m.messages[0].key,
              m.messages[0],
              message.slice(15)
            );
          } catch (e) {
            await socket.sendMessage(m.messages[0].key.remoteJid!, {
              react: {
                text: "‼️",
                key: m.messages[0],
              },
            });
          }
        }
      } else if (/^(\$asb)\:\:/.test(message)) {
        if (message.slice(6).startsWith("regras")) {
          await rules(socket, m.messages[0].key.remoteJid!);
        } else if (message.slice(6).startsWith("ban")) {
          try {
            if (
              !m.messages[0].message?.extendedTextMessage?.contextInfo
                ?.mentionedJid
            ) {
              await socket.sendMessage(m.messages[0].key.remoteJid!, {
                react: {
                  text: "‼️",
                  key: m.messages[0],
                },
              });
              await socket.sendMessage(m.messages[0].key.remoteJid!, {
                text: "precisa-se de ter alguem pra banir!",
              });
              return;
            }

            const jids =
              m.messages[0].message.extendedTextMessage.contextInfo
                .mentionedJid;

            const [usuario, motivo] = [
              jids[0],
              message.split(jids[0].split("@")[0])[1],
            ];

            const grouprJid = m.messages[0].key.remoteJid!.endsWith("@g.us")
              ? m.messages[0].key.remoteJid
              : undefined;

            if (grouprJid) {
              await ban(
                socket,
                lock,
                m.messages[0].key.participant!.trim(),
                grouprJid,
                usuario,
                m.messages[0],
                motivo
              );
            } else {
              !(await socket.sendMessage(m.messages[0].key.remoteJid!, {
                text: "estamos numa conversa pessoal.",
              }));
            }
          } catch {
            await socket.sendMessage(m.messages[0].key.remoteJid!, {
              react: {
                text: "‼️",
                key: m.messages[0],
              },
            });

            await socket.sendMessage(m.messages[0].key.remoteJid!, {
              text: "Error: Parametros incompletos",
            });
          }
        } else if (message.slice(6).startsWith("unban")) {
          if (
            m.messages[0].message?.extendedTextMessage?.contextInfo
              ?.mentionedJid
          ) {
            await unban(
              socket,
              lock,
              m.messages[0].key.participant!,
              m.messages[0].key.remoteJid!,
              m.messages[0].message.extendedTextMessage.contextInfo
                .mentionedJid[0]
            );
          }
        }
      }
    }
  });

  socket.ev.on(
    "group-participants.update",
    async ({ id, participants, action }) => {
      if (id === "120363138200204540@g.us") return;
      if (action === "add") {
        if (participants && blacklist.includes(participants[0])) {
          await ban(
            socket,
            lock,
            socket.user!.id,
            id,
            participants[0],
            undefined,
            "já foi banido."
          );
          return;
        }

        await rules(socket, id);
        return;
      }
      if (id === "120363084400589228@g.us") {
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
      }
    }
  );
}
