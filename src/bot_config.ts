import { GPT } from "asb-gpt";
import { BlackClown } from './gpt-core/blackclown';
import { Gpt } from "./gpt-core/gpt";
import { GPTBot } from "./gpt-core/GPTBot";
require("dotenv").config();

export const blackclown = () => {


  const instance = new BlackClown(new GPT(
  {apikey: process.env.API_KEY}
))
instance.config();
return instance;
}

export const gpt = () => {
  const instance = new Gpt(new GPT(
    {apikey: process.env.API_KEY}
  ));

  instance.config();
  return instance;
}

export async function send(bot: GPTBot, text: string) {
  return (await bot.send(text)).content;
}

