export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelayMs(minMs: number, maxMs: number): number {
    return minMs + Math.floor(Math.random() * (maxMs - minMs));
}

/** Pausa curta e aleatória antes de uma resposta, pra evitar timing robótico (sempre instantâneo). */
export function humanReplyDelay(): Promise<void> {
    return sleep(randomDelayMs(800, 2000));
}

/** Pausa maior entre ações de remoção em massa (ex: ban de comunidade em vários grupos). */
export function humanBulkActionDelay(): Promise<void> {
    return sleep(randomDelayMs(1500, 4000));
}
