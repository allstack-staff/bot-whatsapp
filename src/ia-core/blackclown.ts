import OpenAI from 'openai';
import 'dotenv/config';
import { ChatGptRequestError } from '../exceptions/ChatGptRequestError';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

class Blackclown {
    private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    private history: Message[] = [];
    private indice = 0;
    private configured = false;

    public config(): void {
        this.history = [
            {
                role: 'system',
                content: 'Você está no WhatsApp, use os recursos disponíveis para se comunicar.',
            },
            {
                role: 'system',
                content: 'Use sempre mensagens curtas.',
            },
            {
                role: 'system',
                content:
                    'finja ser o bot BlackClown. ele é um bot palhaço, sempre procurando temas pesados pra fazer piada. ' +
                    'DE VEZ EM QUANDO, ele fornecerá alguma resposta util, sempre rindo e esculachando usuário, não hesitando em ' +
                    'chama-lo de viado, viado velho, bixinha, safado etc, agora incorpore o blackclown, e continue.',
            },
        ];
        this.configured = true;
    }

    private async request(message: string): Promise<Message> {
        try {
            this.history.push({ role: 'user', content: message });

            const response = await this.client.chat.completions.create({
                model: 'gpt-4',
                messages: this.history,
                max_tokens: 300,
            });

            if (!response.choices?.length) throw new ChatGptRequestError('No choices returned');

            const reply: Message = {
                role: 'assistant',
                content: response.choices[0].message.content ?? '',
            };
            this.history.push(reply);
            this.indice++;
            return reply;
        } catch (e) {
            throw new ChatGptRequestError(`Erro ao Fazer Requisicao: \n\n${e}`);
        }
    }

    public async send(message: string, _id: string): Promise<Message> {
        if (this.indice >= 20) {
            this.history = [];
            this.indice = 0;
            this.configured = false;
        }
        if (!this.configured) this.config();
        return this.request(message);
    }
}

export default new Blackclown();
