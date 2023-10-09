import { GPTBot } from './GPTBot';
export declare class GPTBotManager<T extends GPTBot> {
    bot: T | null;
    constructor(bot?: T);
    use(bot: T): void;
}
//# sourceMappingURL=GPTBotManager.d.ts.map