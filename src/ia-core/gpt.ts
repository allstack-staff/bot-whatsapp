import OpenAI from 'openai';
import path from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import 'dotenv/config';
import { ChatGptRequestError } from '../exceptions/ChatGptRequestError';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

function appendToLog(filePath: string, messages: Message[]): void {
    const existing: Message[] = existsSync(filePath)
        ? JSON.parse(readFileSync(filePath, 'utf-8'))
        : [];
    writeFileSync(filePath, JSON.stringify([...existing, ...messages], null, 2));
}

function readLog(filePath: string): Message[] {
    if (!existsSync(filePath)) return [];
    return JSON.parse(readFileSync(filePath, 'utf-8'));
}

class Gpt {
    private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    private systemMessages(): Message[] {
        return [
            {
                role: 'system',
                content:
                    'Você é um assistente prestativo. Fale sempre com linguagem simples.\n\n' +
                    'Nunca fale que é um assistente virtual.\n\n' +
                    'Você está no WhatsApp, use os recursos disponíveis para se comunicar.\n\n' +
                    'Sempre use mensagens curtas.',
            },
        ];
    }

    private async request(message: string, id: string): Promise<Message> {
        const logsDir = path.resolve(__dirname, '..', 'logs');
        const jsonPath = path.resolve(logsDir, `${id}.json`);

        if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });

        appendToLog(jsonPath, [{ role: 'user', content: message }]);
        const history = readLog(jsonPath);
        const offset = history.length >= 20 ? 10 : 0;

        const response = await this.client.chat.completions.create({
            model: 'gpt-4',
            messages: [...this.systemMessages(), ...history.slice(offset)],
            temperature: 0.9,
            max_tokens: 600,
        });

        if (!response.choices?.length) throw new ChatGptRequestError('No choices returned');

        const reply: Message = {
            role: 'assistant',
            content: response.choices[0].message.content ?? '',
        };
        appendToLog(jsonPath, [reply]);
        return reply;
    }

    public async send(message: string, id: string): Promise<Message> {
        return this.request(message, id);
    }
}

export default new Gpt();
