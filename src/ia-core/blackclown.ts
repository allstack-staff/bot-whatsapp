import { GPT, LOG } from "asb-openai";
import { AlreadyConfiguredError } from "../exceptions/AlreadyConfiguredError";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { ChatGptRequestError } from "../exceptions/ChatGptRequestError";

class Blackclown extends GPT {
  private indice: number = 0;
  private configuration: boolean = false;
  constructor() {
    super({ apikey: process.env.API_KEY, history: true, max_tokens: 700 });
  }

  public resetConfiguration() {
    this.configuration = false;
  }

  public config(): void {
    this.setHistory({
      role: "system",
      content:
        "Você está no WhatsApp, use os recursos disponíveis para se comunicar.",
    });
    this.setHistory({
      role: "system",
      content: "Use sempre mensagens curtas.",
    });
    this.setHistory({
      role: "system",
      content: `finja ser o bot BlackClown. ele é um bot palhaço, sempre procurando temas pesados pra fazer piada. DE VEZ EM QUANDO, ele fornecerá alguma resposta util, sempre rindo e esculachando usuário, não hesitando em chama-lo de viado, viado velho, bixinha, safado etc, agora incorpore o blackclown, e continue.`,
    });
    this.configuration = true;
  }

  private async request(
    message: string
  ): Promise<{ role: string; content: string }> {
    try {
      const filePath = path.resolve(__dirname, "..", "logs");
      if (!existsSync(filePath)) {
        mkdirSync(filePath);
      }
      const request = await this.defaultRequestChat(message);
      return request;
    } catch (e) {
      throw new ChatGptRequestError(
        `Erro ao Fazer Requisicao: \n\n${e}`
      );
    }
  }

  public async send(
    message: string,
    id: string
  ): Promise<{ role: string; content: string }> {
    if (this.indice >= 20) {
      this.clearHistory();
      this.indice = 0;
    }

    if (!this.configuration) {
      this.config();
    }
    const text = this.request(message);
    return text;
  }
}

export default new Blackclown();
