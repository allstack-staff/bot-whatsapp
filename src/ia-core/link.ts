import OpenAI from 'openai';
import 'dotenv/config';

class Link {
    private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    async request(text: string): Promise<string | undefined> {
        const response = await this.client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'we are on whatsapp the link is related to it' },
                {
                    role: 'system',
                    content: "Does this text contain a request for a link to a group? (Respond with 'false' or 'true')",
                },
                {
                    role: 'system',
                    content: 'Analyze the text and answer true if it asks for a link and false otherwise',
                },
                { role: 'user', content: text },
            ],
            temperature: 0.2,
        });

        return response.choices[0]?.message.content?.toLowerCase();
    }
}

export default new Link();
