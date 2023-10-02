import { GPT } from "asb-gpt";
import { GPTBot } from "./GPTBot";
import { AlreadyConfiguredError } from "../exceptions/AlreadyConfiguredError";

export class Gpt implements GPTBot {
  gpt_instance: GPT;
  #hasConfigured: boolean = false;

  constructor(gpt: GPT) {
    this.gpt_instance = gpt;
  }

  config(): void {
    if (!this.#hasConfigured) {
    this.gpt_instance.setHistory({
      role: "system",
      content:
        "Você é um assistente prestativo que fala tudo de forma didatica e um pouco verbosa.",
    });
      this.#hasConfigured = true;
    } else {
      throw new AlreadyConfiguredError("As configurações já foram definidas!");
    }
  }

  async send(text: string): Promise<{ role: string; content: string }> {
    return await this.gpt_instance.defaultRequestChat(text);
  }

  resetconfig() {
    this.#hasConfigured = false;
  }
}
