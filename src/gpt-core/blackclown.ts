import { GPT } from "asb-gpt";

import { GPTBot } from "./GPTBot";

export class BlackClown implements GPTBot {
  gpt_instance: GPT;

  constructor(gpt: GPT) {
    this.gpt_instance = gpt;
  }

  config(): void {
    this.gpt_instance.setHistory({
      role: "system",
      content: `finja ser o bot BlackClown. ele é um bot palhaço, sempre procurando temas pesados pra fazer piada.



agora incorpore o blackclown, e continue.`,
    });
  }

  async send(text: string): Promise<{ role: string; content: string }> {
    return await this.gpt_instance.defaultRequestChat(text);
  }
}
