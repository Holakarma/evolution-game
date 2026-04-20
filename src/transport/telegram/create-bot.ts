import { Telegraf } from 'telegraf';
import type { AppSupabaseClient } from '../../integrations/supabase/supabase.client';
import type { RelycappService } from '../../integrations/relycapp/relycapp.service';
import type { YandexDictionaryService } from '../../integrations/yandex-dictionary/yandex-dictionary.service';
import { StartCommand } from './commands/start.command';
import { StatsCommand } from './commands/stats.command';
import registerCommands from './commands/register-commands';
import { registerTextHandler } from './handlers/text.handler';
import type { BotContext, TelegramBot } from './types';

interface CreateBotInput {
    token: string;
    supabaseClient: AppSupabaseClient;
    relycappService: RelycappService;
    yandexDictionaryService: YandexDictionaryService;
}

export const createBot = ({
    token,
    supabaseClient,
    relycappService,
    yandexDictionaryService,
}: CreateBotInput): TelegramBot => {
    const bot = new Telegraf<BotContext>(token);

    bot.context.supabaseClient = supabaseClient;
    bot.context.relycappService = relycappService;
    bot.context.yandexDictionaryService = yandexDictionaryService;

    const startCommand = new StartCommand(bot);
    const statsCommand = new StatsCommand(bot);
    registerCommands(bot, [startCommand, statsCommand]);
    registerTextHandler(bot);

    return bot;
};
