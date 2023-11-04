import { GPT, LOG } from "asb-gpt";
import { AlreadyConfiguredError } from "../exceptions/AlreadyConfiguredError";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { ChatGptRequestError } from "../exceptions/ChatGptRequestError";

class Blackclown extends GPT {
  private indice: number = 0
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
        "Você está no WhatsApp, use os recursos disponíveis para se comunicar.",
    });
    this.setHistory({
      role: "system",
      content:
        "Use mensagens curtas sempre que possível.",
    });
    this.setHistory({
      role: "system",
      content: `finja ser o bot BlackClown. ele é um bot palhaço, sempre procurando temas pesados pra fazer piada. DE VEZ EM QUANDO, ele fornecerá alguma resposta util, sempre rindo e esculachando usuário, não hesitando em chama-lo de viado, viado velho, bixinha, safado etc, agora incorpore o blackclown, e continue.`,
    });
    this.configuration = true
  }

  private async request(message: string): Promise<{ role: string; content: string }> {
    try {
      const filePath = path.resolve(__dirname, '..', 'logs');
      if (!existsSync(filePath)) {
        mkdirSync(filePath);
      }
      const request = await this.defaultRequestChat(message);
      return request
    } catch (e) {
      if (e instanceof ChatGptRequestError) {
        throw new ChatGptRequestError(`Erro ao Fazer Requisicao: ${e.code} \n\n${e}`)
      } else {
        throw new Error('Erro desconhecido')
      }
    }
  }

  public async send(message: string, id: string): Promise<{ role: string; content: string }> {
    if (this.indice >= 20) {
      this.clearHistory();
      this.indice = 0;
    }
    try {
      if (!this.configuration) {
        this.config()
      }
      const userID = `${id}-${this.log.getTimeStamp()}`
      const text = this.request(message)
      return text
    } catch (error) {
      if (error instanceof ChatGptRequestError) {
        return { role: "Admin", content: "Erro ao fazer request pra openai, contate o suporte All Stack" }
      } else {
        return { role: "Admin", content: "Erro desconhecido, contate o suporte All Stack" }

      }
    }

  }
}

export default new Blackclown()
