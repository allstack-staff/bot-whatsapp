"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const asb_gpt_1 = require("asb-gpt");
require("dotenv/config");
class Link extends asb_gpt_1.GPT {
    constructor() {
        super({ apikey: process.env.API_KEY });
    }
    request(text) {
        return __awaiter(this, void 0, void 0, function* () {
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
            };
            const request = yield this.requestChat(config);
            return request.data.choices[0].message.content.toLowerCase();
        });
    }
}
exports.default = new Link();
