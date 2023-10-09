import { GPT } from "asb-gpt";
import { GPTBot } from "./GPTBot";
export declare class Gpt implements GPTBot {
    #private;
    gpt_instance: GPT;
    constructor(gpt: GPT);
    config(): void;
    send(text: string): Promise<{
        role: string;
        content: string;
    }>;
    resetconfig(): void;
}
//# sourceMappingURL=gpt.d.ts.map