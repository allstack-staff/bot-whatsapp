import { GPT } from "asb-gpt";
import { BlackClown } from "./gpt-core/blackclown";
import { Gpt } from "./gpt-core/gpt";
;
require("dotenv").config();
/*
 * Configuração dos bots GPT
 */
export const blackclown = () => {
  const instance = new BlackClown(new GPT({ apikey: process.env.API_KEY }));
  return instance;
};

export const gpt = () => {
  const instance = new Gpt(new GPT({ apikey: process.env.API_KEY }));
  return instance;
};


