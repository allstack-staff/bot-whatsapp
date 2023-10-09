import { GPT } from 'asb-gpt';
import 'dotenv/config';
declare class Link extends GPT {
    constructor();
    request(text: string): Promise<string | undefined>;
}
declare const _default: Link;
export default _default;
//# sourceMappingURL=link.d.ts.map