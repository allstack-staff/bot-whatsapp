import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import {Boom} from '@hapi/boom';
import path from 'path';


export async function  connect() {
  const {state, saveCreds} = await useMultiFileAuthState(
    path.join(__dirname, "authdata")
  ) 

  const socket = makeWASocket({
    printQRInTerminal: true,
    auth: state
  })

  socket.ev.on('connection.update', async (update) => {
      const {connection, lastDisconnect} = update;

      if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect)
        await connect();
    }
  })

  socket.ev.on("creds.update", saveCreds);


  return socket;

}
