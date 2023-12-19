import { GPT, LOG, type ChatConfig, ChatMessage } from "asb-openai";
import { AlreadyConfiguredError } from "../exceptions/AlreadyConfiguredError";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { ChatGptRequestError } from '../exceptions/ChatGptRequestError';
import "dotenv/config";
import { readFile } from "fs/promises";

class Gpt extends GPT {
  private log = new LOG();
  constructor() {
    super({
      apikey: 'add key aqui',
    });
  }

  private config() {
    return [
      {
        role: "system",
        content:
          "Você é um assistente prestativo. Fale sempre com linguagem simples. \n\n Nunca fale que é um assistente virtual. \n\n Você está no WhatsApp, use os recursos disponíveis para se comunicar. \n\n sempre use mensagens curtas.",
      },
    ];
  }

  private async request(
    message: string,
    id: string
  ): Promise<{ role: string; content: string }> {
    const filePath = path.resolve(__dirname, "..", "logs");
    const jsonPath = path.resolve(__dirname, filePath, `${id}.json`);
    if (!existsSync(filePath)) {
      mkdirSync(filePath);
    }

    const logCache = [{ role: "user", content: message }];
    this.log.saveMessagesToJSON(jsonPath, logCache);
    const history = JSON.parse(await readFile(jsonPath, "utf-8"));
    const count = history.length >= 20 ? 10 : 0;

    const config: ChatConfig = {
      model: "gpt-4",
      messages: [...this.config(), ...history.slice(count, history.length)],
      temperature: 0.9,
      max_tokens: 600,
    };
    const request = await this.requestChat(config);
    if (!request.data.choices) throw new ChatGptRequestError(request.toString());

    this.log.saveMessagesToJSON(jsonPath, [request.data.choices[0].message]);
    return request.data.choices[0].message;
  }

  public async send(
    message: string,
    id: string
  ): Promise<{ role: string; content: string }> {
    return await this.request(message, id);
  }
}

export default new Gpt();
