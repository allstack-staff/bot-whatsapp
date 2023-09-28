import { connect } from "./conn";
import { hello } from "./commands/hello";
import { rules } from "./commands/regras";
import { ban } from "./commands/ban";
import { black } from "./commands/black"; 
import { makeadmin } from "./commands/makeadmin";
import { defaultgpt } from "./commands/gpt";
import { demoteFrom } from './commands/internal/removeFrom';

export async function bot() {
  const socket = await connect();

  socket.ev.on("messages.upsert", async (m) => {
    //if (m.type === "notify") return;
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

    message = m.messages[0].message?.conversation
      ? m.messages[0].message?.conversation
      : m.messages[0].message?.extendedTextMessage?.text;
    if(message && message.startsWith("$asb")) {
      if (/^(\$asb)\s*$/.test(message)) {
        await hello(socket, m.messages[0].key.remoteJid!, m.messages[0], "Olá! este é o bot utilitário da All Stack Community.");
        return;
      }
    if (message.slice(5).startsWith("makeadmin")) {
      const groupJid = m.messages[0].key.remoteJid!.endsWith("@g.us")
      ? m.messages[0].key.remoteJid
      : undefined;

      if (groupJid) {
        await makeadmin(socket, groupJid, m.messages[0].key.participant!);
        } else {
        await socket.sendMessage(m.messages[0].key.remoteJid!, { text: "Estamos em uma conversa pessoal."});
      }
  
    } else if (message.slice(5).startsWith("gpt")){

      await defaultgpt(socket, m.messages[0].key.remoteJid!, m.messages[0],m.messages[0].key,  message.slice(9));
    } else if (message.slice(5).startsWith("bc")) {
      try {
       await black(socket, m.messages[0].key.remoteJid!, m.messages[0].key, m.messages[0], message.slice(15))
      } catch(e) {
        await socket.sendMessage(m.messages[0].key.remoteJid!, { text: `Erro interno: ${e}`})
      }
    } else if (message.slice(5).startsWith("regras")) {
      await rules(socket, m.messages[0].key.remoteJid!);
    } else if (
      message.slice(5).startsWith("ban") &&
      m.messages[0].message?.extendedTextMessage?.contextInfo?.mentionedJid
    ) {
      const jids =
        m.messages[0].message.extendedTextMessage.contextInfo.mentionedJid;

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
            m.messages[0].key.participant!.trim(),
            grouprJid,
            usuario,
            motivo,
          );


      } else {
        !(await socket.sendMessage(m.messages[0].key.remoteJid!, {
          text: "estamos numa conversa pessoal.",
        }));
      }
    }
  }
  });

  socket.ev.on('group-participants.update', async ({id, participants, action}) => {
    
    if (id === "120363138200204540@g.us") 
      return;
    if (action === 'add') {
        await rules(socket, id);
        return;
      }
     if (id === "120363084400589228@g.us") {
      if (action === "remove") {
        await demoteFrom(socket, ["120363029900825529@g.us", "120363042733129991@g.us", "120363100560580311@g.us", ], participants[0]);
        return;
      }
      return;
    }

    
  }) 
}
