import OpenAI from 'openai';
import { resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import { SendDalleGenerateImage } from '../exceptions/SendDalleGenerateImage';

export class Dalle {
    private client: OpenAI;

    constructor(apiKey?: string) {
        this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
    }

    private async request(message: string, id: string): Promise<string> {
        const dirPath = resolve(__dirname, '..', 'imagens');
        const logPath = resolve(__dirname, '..', 'logs', 'dalle');
        const imageName = `${id}_${uuidv4()}.png`;

        if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
        if (!existsSync(logPath)) mkdirSync(logPath, { recursive: true });

        const response = await this.client.images.generate({
            model: 'dall-e-3',
            prompt: message,
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json',
        });

        const imageData = response.data?.[0];
        if (!imageData?.b64_json) throw new SendDalleGenerateImage('No image data returned');

        const logFilePath = `${logPath}/${id}.json`;
        const existing = existsSync(logFilePath)
            ? JSON.parse(readFileSync(logFilePath, 'utf-8'))
            : [];
        existing.push({ role: message, content: imageName });
        writeFileSync(logFilePath, JSON.stringify(existing, null, 2));

        writeFileSync(`${dirPath}/${imageName}`, imageData.b64_json, 'base64');

        return imageName;
    }

    public async send(message: string, id: string): Promise<string> {
        return this.request(message, id);
    }
}
