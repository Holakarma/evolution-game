import type { Logger } from '../../shared/logger';
import type { TelegramBot } from '../telegram/types';

interface RunPollingInput {
    bot: TelegramBot;
    logger: Logger;
}

export const runPolling = async ({
    bot,
    logger,
}: RunPollingInput): Promise<void> => {
    await bot.telegram.deleteWebhook();
    await bot.launch();

    logger.info('Bot started in polling mode');
};
