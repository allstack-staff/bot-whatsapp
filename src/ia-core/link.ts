import { GPT } from 'asb-openai'
import 'dotenv/config'

class Link extends GPT {

  constructor() {
    super({ apikey: process.env.API_KEY })
  }

  async request(text: string): Promise<string | undefined> {

    const config = {
      "model": "gpt-3.5-turbo",
      "messages": [
        {
          "role": "system",
          "content": "we are on whatsapp the link is related to it"

        },
        {
          "role": "system",
          "content": "Does this text contain a request for a link to a group? (Respond with 'false' or 'true')"

        },
        {
          "role": "system",
          "content": "Analyze the text and answer true if it asks for a link and false otherwise"

        },
        {
          "role": "user",
          "content": text
        }
      ],
      "temperature": 0.2
    }

    // const request = await this.gpt_instance.requestChat(config)
    const request = await this.requestChat(config)
    

    return request.data.choices[0].message.content.toLowerCase()

  }

}
export default new Link()