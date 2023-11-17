import { DALLE, LOG, type DalleCompletion } from "asb-openai";
import { resolve } from "path";
import { existsSync, writeFileSync, mkdirSync } from "fs";
import { v4 as uuidv4 } from 'uuid';
import "dotenv/config"
import { SendDalleGenerateImage } from "../exceptions/SendDalleGenerateImage";

export class Dalle extends DALLE {
  log = new LOG()
  constructor(key: string | undefined) {
    super(key)
  }

  private async request(message: string, id: string) {
    const dirPath = resolve(__dirname, '..', 'imagens')
    const imageName = `${id}_${uuidv4()}.png`
    const path = resolve(__dirname, '..', 'logs', 'dalle')
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }

    const params: DalleCompletion = {
      model: "dall-e-3",
      prompt: message,
      n: 1,
      size: "1024x1024",
      response_format: 'b64_json'
    }
    const request = await this.createImage(params)
    if (request.data.error) return request.data.error.message!;
    const logCache: Array<{
      role: string;
      content: string;
    }> = [{ role: message, content: imageName }]
    await this.log.saveMessagesToJSON(`${path}/${id}.json`, logCache)

    writeFileSync(`${dirPath}/${imageName}`, request.data.data[0].b64_json, 'base64')

    return imageName

  }

  public async send(message: string, id: string) {
    return await this.request(message, id)
  }
}