import { Telegraf } from 'telegraf';
import { Command } from './register-commands';
import { BotContext } from '../types';
import { ensureUser } from '../ensure-user';

export const START_MESSAGE =
    'Ты в игре! Просто отправь слово, а я скажу, было ли оно уже)';

export class StartCommand implements Command {
    static command = 'start';

    constructor(private readonly bot: Telegraf<BotContext>) { }

    get description() {
        return {
            command: StartCommand.command,
            description: 'Зарегистрироваться'
        };
    }

    handle() {
        this.bot.start(async (ctx) => {
            try {
                await ensureUser(ctx);
                await ctx.reply(START_MESSAGE);
            } catch (error) {
                console.error('Failed to register user on /start', error);
                await ctx.reply('Не удалось зарегистрировать пользователя');
            }
        });
    }
}
