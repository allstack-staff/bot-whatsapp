import { ConnectionState, DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys"; 
 import makeWASocket from "@whiskeysockets/baileys/lib/Socket"; 
 import { Boom } from "@hapi/boom"; 
 //import pino from "pino"; 
 import path from 'path'; 
 import { BaileysSocket } from "./types/BaileysSocket";
 export const connect: () => Promise<BaileysSocket> = async () => { 
  
   const { state, saveCreds } = await useMultiFileAuthState( 
     path.resolve(__dirname, "authdata") 
   ); 
  
   const socket = makeWASocket({ 
     printQRInTerminal: true, 
     auth: state,  
   }); 
  
   socket.ev.on("connection.update", async (update: Partial<ConnectionState>) => { 
     const { connection, lastDisconnect } = update; 

  
     if (connection === 'open') { 
       console.log(`\nLogged on ${socket.user!.name} ${socket.user!.id}`) 
     } 
  
     if (connection === 'close') { 
       const shouldReconnect = (lastDisconnect?.error as Boom)?.output 
         ?.statusCode !== DisconnectReason.loggedOut; 
  
       if (shouldReconnect) { 
         await connect(); 
       } 
     } 
   }); 
  
   socket.ev.on("creds.update", saveCreds); 
  
   return socket; 
 };
