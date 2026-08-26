import { GroupMetadata, GroupParticipant, WASocket, isLidUser, isPnUser, jidNormalizedUser } from '@whiskeysockets/baileys';

/**
 * Finds a group participant by any of their known identity forms (lid, pn, or
 * whichever id WhatsApp is currently addressing them with in that group).
 */
export function findParticipant(metadata: GroupMetadata, jid: string): GroupParticipant | undefined {
    const target = jidNormalizedUser(jid);
    return metadata.participants.find(
        (p) =>
            jidNormalizedUser(p.id) === target ||
            (p.lid && jidNormalizedUser(p.lid) === target) ||
            (p.phoneNumber && jidNormalizedUser(p.phoneNumber) === target),
    );
}

/**
 * Resolves any jid (lid or pn) to its canonical phone-number jid, so bans are
 * always keyed on a stable identity regardless of whether WhatsApp handed us
 * a @lid or @s.whatsapp.net address for the mention/reply.
 *
 * Prefers the phone number already present on group metadata (cheap, no
 * network round-trip); falls back to Baileys' own LID<->PN mapping store,
 * which is the persisted source of truth Signal itself uses.
 */
export async function resolvePnJid(sock: WASocket, jid: string, metadata?: GroupMetadata): Promise<string> {
    const normalized = jidNormalizedUser(jid);
    if (isPnUser(normalized)) return normalized;

    if (metadata) {
        const participant = findParticipant(metadata, normalized);
        if (participant?.phoneNumber) return jidNormalizedUser(participant.phoneNumber);
    }

    if (isLidUser(normalized)) {
        const pn = await sock.signalRepository.lidMapping.getPNForLID(normalized);
        if (pn) return jidNormalizedUser(pn);
    }

    return normalized;
}

export function isGroupAdmin(participant: GroupParticipant | undefined): boolean {
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}
