import express from 'express';
import type { Server } from 'node:http';
import type { Logger } from '../../shared/logger';
import type { TelegramBot } from '../telegram/types';

interface RunWebhookServerInput {
    bot: TelegramBot;
    domain?: string;
    token: string;
    port: number;
    logger: Logger;
}

const normalizeDomain = (domain: string): string =>
    domain.endsWith('/') ? domain.slice(0, -1) : domain;

export const runWebhookServer = async ({
    bot,
    domain,
    token,
    port,
    logger,
}: RunWebhookServerInput): Promise<Server> => {
    if (!domain) {
        throw new Error('DOMAIN is required for webhook mode');
    }

    const app = express();
    const secretPath = `/telegraf/${token}`;
    const webhookUrl = `${normalizeDomain(domain)}${secretPath}`;

    app.use(express.json());
    app.use(secretPath, (req, res) => {
        bot.handleUpdate(req.body, res);
    });
    app.get('/', (_req, res) => {
        res.send('OK');
    });

    await bot.telegram.setWebhook(webhookUrl);

    return await new Promise<Server>((resolve) => {
        const server = app.listen(port, () => {
            logger.info(`Server started on port ${port}`);
            logger.info(`Webhook mode enabled: ${webhookUrl}`);
            resolve(server);
        });
    });
};
