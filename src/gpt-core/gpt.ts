import { GPT, LOG } from "asb-gpt";
import { AlreadyConfiguredError } from "../exceptions/AlreadyConfiguredError";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { ChatGptRequestError } from "../exceptions/ChatGptRequestError";
import 'dotenv/config'

class Gpt extends GPT {
  private configuration: boolean = false
  private log = new LOG()
  constructor() {
    super({ apikey: process.env.API_KEY, history: true, max_tokens: 700 })
  }

  public resetConfiguration() {
    this.configuration = false
  }

  public config(): void {
    if (this.configuration) throw new AlreadyConfiguredError('Bot ja configurado, resete as configuracoes e tente novamente');
    this.setHistory({
      role: "system",
      content:
        "Você é um assistente prestativo que fala tudo de forma didática e um pouco verbosa.",
    });
    this.setHistory({
      role: "system",
      content:
        "Seja direto ao ponto e nunca fale que é um assistente virtual.",
    });
    this.setHistory({
      role: "system",
      content:
        "Você está no WhatsApp, use os recursos disponíveis para se comunicar.",
    });
    this.setHistory({
      role: "system",
      content:
        "Use mensagens curtas sempre que possível.",
    });
    this.configuration = true
  }

  private async request(message: string, id: string, name: string): Promise<{ role: string; content: string }> {
    try {
      const filePath = path.resolve(__dirname, '..', 'logs');
      if (!existsSync(filePath)) {
        mkdirSync(filePath);
      }
      const request = await this.defaultRequestChat(message);
      const jsonPath = path.resolve(__dirname, `${filePath}`, `${`${name}.json`}`)
      this.log.SaveMessageToJSON(id, message, request, `${jsonPath}`)
      return request
    } catch (e) {
      if (e instanceof ChatGptRequestError) {
        throw new ChatGptRequestError(`Erro ao Fazer Requisicao: ${e.code} \n\n${e}`)
      }
      else {
        throw new Error(`Erro desconhecido em:\n ${__dirname} : ${__filename} \n\n ${e}`)
      }
    }
  }

  public async send(message: string, id: string): Promise<{ role: string; content: string }> {
    try {
      if (!this.configuration) {
        this.config()
      }
      const userID = `${id}-${this.log.getTimeStamp()}`
      const text = await this.request(message, id, userID)
      return text
    } catch (error) {
      if (error instanceof ChatGptRequestError) {
        return { role: "Admin", content: "Erro ao fazer request pra openai, contate o suporte All Stack" }
      } else {
        console.error(error)
        return { role: "Admin", content: "Erro desconhecido, contate o suporte All Stack" }

      }
    }

  }
}

export default new Gpt()