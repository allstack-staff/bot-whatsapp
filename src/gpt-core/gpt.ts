import { GPT } from 'asb-gpt';
import { GPTBot } from './GPTBot';

export class Gpt implements GPTBot {
  gpt_instance: GPT;

  constructor(gpt: GPT) {
    this.gpt_instance = gpt;
  }

  config(): void {
    this.gpt_instance.setHistory(
      { role: "system", content: "oi ChatGPT!" }
    );
  }

  async send(text: string): Promise<{ role: string; content: string; }> {
    return await this.gpt_instance.defaultRequestChat(text);

  }
}
