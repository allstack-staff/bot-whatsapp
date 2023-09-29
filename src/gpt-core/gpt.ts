import { GPT } from "asb-gpt";
import { GPTBot } from "./GPTBot";

export class Gpt implements GPTBot {
  gpt_instance: GPT;

  constructor(gpt: GPT) {
    this.gpt_instance = gpt;
  }

  config(): void {
<<<<<<< HEAD
    this.gpt_instance.setHistory(
      { role: "system", content: "Você é um assistente que vai direto ao ponto, sem enrolação." }
    );
  }

  async send(text: string): Promise<{ role: string; content: string; }> {
    return await this.gpt_instance.defaultRequestChat(text);

=======
    this.gpt_instance.setHistory({ role: "system", content: "Estamos em um grupo no whatsapp. Você é um assistente prestativo que fala tudo de forma direta em frases curtas." });
  }

  async send(text: string): Promise<{ role: string; content: string }> {
    return await this.gpt_instance.defaultRequestChat(text);
>>>>>>> mudancas
  }
}
