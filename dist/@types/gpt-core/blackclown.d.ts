import { GPT } from "asb-gpt";
import { GPTBot } from "./GPTBot";
export declare class BlackClown implements GPTBot {
    #private;
    gpt_instance: GPT;
    constructor(gpt: GPT);
    config(): void;
    send(text: string): Promise<{
        role: string;
        content: string;
    }>;
}
//# sourceMappingURL=blackclown.d.ts.map