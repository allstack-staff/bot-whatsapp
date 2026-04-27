import { WASocket, GroupMetadata, BaileysEventMap } from '@whiskeysockets/baileys';
import path from 'path';
import Semaphore from 'semaphore-async-await';
import { MessageUpsert } from '../types';
import { botConfig } from './commandsList';
import { hello } from './hello';
import { rules } from './regras';
import { ban } from './ban';
import { unban } from './unban';
import { black } from './black';
import { makeadmin } from './makeadmin';
// import { generateImage } from './dalle';
// import { defaultgpt } from './gpt';
import { demoteFrom } from './internal/removeFrom';
import { mentionAll } from './internal/mentionAll';
import { mention } from './mention';
import { MemberList } from './internal/MemberList';
import { GroupList } from './internal/GroupList';
import { doc } from './doc';
import { getImageById } from './get';

function coerce(str: string): string | number {
    if (/\d+(\.\d+)?/.test(str)) {
        return Number.parseFloat(str);
    } else if (/\".*?\"|'.*?'/.test(str)) {
        const r = /\".*?\"|'.*?'/.exec(str);
        return ' ' + r![0].slice(1, r![0].length - 1);
    } else {
        return str;
    }
}

export class MessageHandler {
    private blacklist: MemberList;
    private whitelist: GroupList;
    private lock: Semaphore;

    constructor(private sock: WASocket) {
        this.blacklist = new MemberList(
            path.resolve(__dirname, 'internal/blacklist.txt')
        );
        this.whitelist = new GroupList(
            path.resolve(__dirname, 'internal/groupwhitelist.txt')
        );
        this.lock = new Semaphore(1);
    }

    private async isAdmin(userID: string, groupID: string): Promise<boolean> {
        const metadata = await this.sock.groupMetadata(groupID);
        // Normaliza para comparar JIDs regulares e LIDs (formato Baileys v7)
        const normalize = (id: string) => id.split('@')[0].split(':')[0];
        const user = metadata.participants.find((u) => normalize(u.id) === normalize(userID));
        return !!(user && (user.admin === 'admin' || user.admin === 'superadmin'));
    }

    private async reactError(remoteJid: string, key: any): Promise<void> {
        await this.sock.sendMessage(remoteJid, { react: { text: '❌', key } });
    }

    async handleMessage({ messages, type }: MessageUpsert): Promise<void> {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                if (msg.key.remoteJid === 'status@broadcast') continue;
                if (!msg.message) continue;

                const hasContent = !!(
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage ||
                    msg.message.videoMessage ||
                    msg.message.stickerMessage
                );
                if (!hasContent) continue;

                const text: string =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    '';

                if (msg.key.fromMe && !text.startsWith(botConfig.commands.prefix)) continue;

                const isPrivate = !msg.key.participant;

                if (isPrivate) {
                    if (text.startsWith(botConfig.commands.prefix)) {
                        await this.handleAsbCommand(msg, text);
                    } else {
                        await this.handlePrivateMessage(msg, text);
                    }
                    continue;
                }

                // Grupos: só processa se estiver na whitelist.
                // Exceção: addgroup/removegroup sempre funcionam independente da whitelist.
                const subCmd = text.split(' ')[1];
                const isWhitelistCmd = subCmd?.startsWith('addgroup') || subCmd?.startsWith('removegroup');
                if (!this.whitelist.isEmpty && !this.whitelist.has(msg.key.remoteJid!) && !isWhitelistCmd) {
                    continue;
                }

                if (text && text.startsWith(botConfig.commands.prefix)) {
                    await this.handleAsbCommand(msg, text);
                }
            } catch (err) {
                console.error('[handleMessage] erro ao processar mensagem:', err);
            }
        }
    }

    private async handlePrivateMessage(msg: any, text: string): Promise<void> {
        const jid = msg.key.remoteJid!;
        const key = msg.key;

        // try {
        //     if (text.startsWith('$img --get')) {
        //         await getImageById(this.sock, jid, key, msg, text.split(' ')[2]);
        //     } else if (text.startsWith('$img')) {
        //         await generateImage(this.sock, jid, key, msg, text.slice(4));
        //     } else {
        //         await defaultgpt(this.sock, jid, key, msg, text);
        //     }
        // } catch (error) {
        //     console.error(error);
        //     await this.reactError(jid, key);
        // }
    }

    private async handleAsbCommand(msg: any, text: string): Promise<void> {
        const jid = msg.key.remoteJid!;
        const key = msg.key;
        const parts = text.split(' ');
        const sub = parts[1];

        if (/^(\$asb)\s*$/.test(text)) {
            await hello(this.sock, jid, key, 'Olá! este é o bot utilitário da All Stack Community.').catch((e: unknown) => {
                console.error('[hello] erro ao enviar resposta:', e);
            });
            return;
        }

        if (!sub) return;

        if (sub.startsWith('makeadmin') || sub.startsWith('-ma')) {
            const groupJid = jid.endsWith('@g.us') ? jid : undefined;
            if (!groupJid) { await this.reactError(jid, key); return; }
            await makeadmin(this.sock, groupJid, msg.key.participant!).catch(async (e: unknown) => {
                await this.reactError(jid, key);
                console.error(e);
            });

        } else if (sub.startsWith('mention') || sub.startsWith('-me')) {
            const num = text.match(/\d+/);
            if (num) {
                await mention(this.sock, jid, num[0]).catch(async (e: unknown) => {
                    await this.reactError(jid, key);
                    console.error(e);
                });
            }

        // } else if (sub.startsWith('gpt')) {
        //     await defaultgpt(this.sock, jid, key, msg, text.slice(8)).catch(async (e: unknown) => {
        //         await this.reactError(jid, key);
        //         console.error(e);
        //     });

        } else if (sub.startsWith('bc')) {
            await black(this.sock, jid, key, msg, text.slice(7)).catch(async (e: unknown) => {
                await this.reactError(jid, key);
                console.error(e);
            });

        } else if (sub.startsWith('img') && parts[2]?.startsWith('--get')) {
            await getImageById(this.sock, jid, key, msg, parts[3]).catch(async (e: unknown) => {
                await this.reactError(jid, key);
                console.error(e);
            });

        // } else if (sub.startsWith('img')) {
        //     await generateImage(this.sock, jid, key, msg, text.slice(8)).catch(async (e: unknown) => {
        //         await this.reactError(jid, key);
        //         console.error(e);
        //     });

        } else if (sub.startsWith('regras')) {
            try {
                const metadata = await this.sock.groupMetadata(jid);
                const description = metadata.desc;
                if (description) {
                    await rules(this.sock, jid, description);
                }
            } catch (e) {
                await this.reactError(jid, key);
                console.error(e);
            }

        } else if (sub.startsWith('ban')) {
            await this.handleBan(msg, text, parts);

        } else if (sub.startsWith('unban')) {
            const num = text.match(/\d+/);
            if (!num) { await this.reactError(jid, key); return; }
            await unban(this.sock, this.blacklist, this.lock, msg.key.participant!, jid, num[0]).catch(async (e: unknown) => {
                await this.reactError(jid, key);
                console.error(e);
            });

        } else if (sub.startsWith('doc')) {
            await doc(this.sock, jid, key, msg).catch((e: unknown) => console.error(e));

        } else if (sub.startsWith('addgroup')) {
            await this.handleAddGroup(msg);

        } else if (sub.startsWith('removegroup')) {
            await this.handleRemoveGroup(msg);
        }
    }

    private async handleAddGroup(msg: any): Promise<void> {
        const jid = msg.key.remoteJid!;
        const key = msg.key;

        if (!jid.endsWith('@g.us')) {
            await this.sock.sendMessage(jid, { text: '❌ Este comando só funciona em grupos.' });
            return;
        }

        if (!await this.isAdmin(msg.key.participant!, jid).catch(() => false)) {
            await this.reactError(jid, key);
            return;
        }

        this.whitelist.add(jid);
        this.whitelist.save();

        await this.sock.sendMessage(jid, { react: { text: '✅', key } });
        await this.sock.sendMessage(jid, {
            text: `✅ Grupo adicionado à whitelist do bot.\n*ID:* \`${jid}\``
        });
    }

    private async handleRemoveGroup(msg: any): Promise<void> {
        const jid = msg.key.remoteJid!;
        const key = msg.key;

        if (!jid.endsWith('@g.us')) {
            await this.sock.sendMessage(jid, { text: '❌ Este comando só funciona em grupos.' });
            return;
        }

        if (!await this.isAdmin(msg.key.participant!, jid).catch(() => false)) {
            await this.reactError(jid, key);
            return;
        }

        if (!this.whitelist.has(jid)) {
            await this.sock.sendMessage(jid, { react: { text: '❌', key } });
            await this.sock.sendMessage(jid, { text: '❌ Este grupo não está na whitelist.' });
            return;
        }

        this.whitelist.remove(jid);
        this.whitelist.save();

        await this.sock.sendMessage(jid, { react: { text: '✅', key } });
        await this.sock.sendMessage(jid, { text: '✅ Grupo removido da whitelist do bot.' });
    }

    private async handleBan(msg: any, text: string, parts: string[]): Promise<void> {
        const jid = msg.key.remoteJid!;
        const key = msg.key;

        if (!msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            await this.reactError(jid, key);
            return;
        }

        const groupJid = jid.endsWith('@g.us') ? jid : undefined;
        if (!groupJid) { await this.reactError(jid, key); return; }

        const jids: string[] = msg.message.extendedTextMessage.contextInfo.mentionedJid;
        const usuario = jids[0];
        let motivo: string | number = text.split(jids[0].split('@')[0])[1];
        motivo = coerce(motivo);

        if (parts[2]?.startsWith('--all')) {
            const grupos: { [_: string]: GroupMetadata } = await this.sock.groupFetchAllParticipating();
            await new Promise<void>((res) => {
                const idsArray = Object.keys(grupos);
                idsArray.forEach((id, index) => {
                    setTimeout(async () => {
                        await ban(this.sock, this.blacklist, this.lock, msg.key.participant!.trim(), id, usuario, msg, motivo)
                            .catch(console.error);
                        if (index === idsArray.length - 1) res();
                    }, 5000 * (index + 1));
                });
            }).catch(console.error);
        }

        await ban(this.sock, this.blacklist, this.lock, msg.key.participant!.trim(), groupJid, usuario, msg, motivo)
            .catch(async (e: unknown) => {
                await this.reactError(jid, key);
                console.error(e);
            });
    }

    async handleGroupParticipantUpdate({ id, participants, action }: BaileysEventMap['group-participants.update']): Promise<void> {
        try {
            if (id === '120363138200204540@g.us') return;
            if (!participants?.length) return;

            // Compatível com string[] (v6) e GroupParticipant[] (v7)
            const participantId: string = typeof participants[0] === 'string'
                ? participants[0]
                : (participants[0] as { id: string }).id;

            if (action === 'add') {
                if (this.blacklist.list.includes(participantId)) {
                    await ban(
                        this.sock,
                        this.blacklist,
                        this.lock,
                        this.sock.user!.id.replace(/:\d+/, ''),
                        id,
                        participantId,
                        undefined,
                        'Black List.'
                    ).catch(console.error);
                    return;
                }

                const metadata = await this.sock.groupMetadata(id);
                const description = metadata.desc ? '\n\n' + metadata.desc : '';

                await rules(
                    this.sock,
                    id,
                    `Olá ${participantId.split('@')[0]}! Seja bem vindo a All Stack!${description}`
                ).catch(console.error);
                return;
            }

            if (id === '120363084400589228@g.us' && action === 'remove') {
                await demoteFrom(this.sock, participantId);
            }
        } catch (err) {
            console.error('[handleGroupParticipantUpdate] erro:', err);
        }
    }
}
