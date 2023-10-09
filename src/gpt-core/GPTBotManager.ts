import { GPTBot } from './GPTBot';


export class GPTBotManager<T extends GPTBot> {
  bot: T | null = null;

  constructor(bot?: T) {
    if (bot) {
      this.use(bot);
    }
  }

  use(bot: T) {
    if (!(this.bot)) {
      bot.config();
      this.bot = bot;
    }
  }


}
