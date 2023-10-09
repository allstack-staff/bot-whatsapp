"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpt = exports.blackclown = void 0;
const asb_gpt_1 = require("asb-gpt");
const blackclown_1 = require("./gpt-core/blackclown");
const gpt_1 = require("./gpt-core/gpt");
;
require("dotenv").config();
const blackclown = () => {
    const instance = new blackclown_1.BlackClown(new asb_gpt_1.GPT({ apikey: process.env.API_KEY }));
    return instance;
};
exports.blackclown = blackclown;
const gpt = () => {
    const instance = new gpt_1.Gpt(new asb_gpt_1.GPT({ apikey: process.env.API_KEY }));
    return instance;
};
exports.gpt = gpt;
