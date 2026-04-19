import { Context, Telegraf } from "telegraf";

export interface Command {
    description: { command: string, description: string },
    handle: () => void;
}

function registerCommands<C extends Context>(bot: Telegraf<C>, commands: Command[]) {
    bot.telegram.setMyCommands(commands.map(c => c.description));
    for (let command of commands) {
        command.handle()
    }
}

export default registerCommands;