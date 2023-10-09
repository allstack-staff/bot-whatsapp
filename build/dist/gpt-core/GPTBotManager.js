"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPTBotManager = void 0;
class GPTBotManager {
    constructor(bot) {
        this.bot = null;
        if (bot) {
            this.use(bot);
        }
    }
    use(bot) {
        if (!(this.bot)) {
            bot.config();
            this.bot = bot;
        }
    }
}
exports.GPTBotManager = GPTBotManager;
