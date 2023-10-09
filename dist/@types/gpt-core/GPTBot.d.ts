export interface GPTBot {
    send(text: string): Promise<{
        role: string;
        content: string;
    }>;
    config(): void;
}
//# sourceMappingURL=GPTBot.d.ts.map