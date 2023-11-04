import { GPT, LOG, type ChatConfig, ChatMessage } from "asb-gpt";
import { AlreadyConfiguredError } from "../exceptions/AlreadyConfiguredError";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { ChatGptRequestError } from "../exceptions/ChatGptRequestError";
import 'dotenv/config'
import { readFile } from "fs/promises";

class Gpt extends GPT {
  private configuration: boolean = false
  private log = new LOG()
  constructor() {
    super({ apikey: process.env.API_KEY, history: true, max_tokens: 700, model: "gpt-4" })
  }

  public resetConfiguration() {
    this.configuration = false
  }

  private config() {
    return [
      {
        role: "system",
        content:
          "Você é um assistente prestativo que fala tudo de forma didática e um pouco verbosa.",
      },
      {
        role: "system",
        content:
          "Seja direto ao ponto e nunca fale que é um assistente virtual.",
      },
      {
        role: "system",
        content:
          "Você está no WhatsApp, use os recursos disponíveis para se comunicar.",
      },
      {
        role: "system",
        content:
          "Use mensagens curtas sempre que possível.",
      },
    ]
  }

  private async request(message: string, id: string,): Promise<{ role: string; content: string }> {
    try {
      const filePath = path.resolve(__dirname, '..', 'logs');
      const jsonPath = path.resolve(__dirname, filePath, `${id}.json`)
      if (!existsSync(filePath)) {
        mkdirSync(filePath);
      }

      const logCache = [{ role: "user", content: message }]
      this.log.saveMessagesToJSON(jsonPath, logCache)

      const history = JSON.parse(await readFile(jsonPath, "utf-8"));

      const count = history.length >= 20 ? 10 : 0 

      const config: ChatConfig = {
        model: 'gpt-4',
        messages: [...this.config(), ...history.slice(count, history.length) ],
        temperature: 0.6,
        max_tokens: 500,
      }

      const request = await this.requestChat(config);


      this.log.saveMessagesToJSON(jsonPath, [request.data.choices[0].message])
      return request.data.choices[0].message
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
      const text = await this.request(message, id)
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