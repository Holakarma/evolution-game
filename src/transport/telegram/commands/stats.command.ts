import { Telegraf } from 'telegraf';
import { Command } from './register-commands';
import { BotContext } from '../types';
import { ensureUser } from '../ensure-user';

const STATS_HEADER = 'Статистика слов:';
const STATS_EMPTY_USERS = 'Пока нет пользователей.';
const STATS_FAILED_MESSAGE = 'Не удалось получить статистику';

interface UserStatsEntry {
    name: string;
    wordsCount: number;
}

const normalizeUserName = (name: string): string => {
    const normalized = name.trim().replace(/\s+/gu, ' ');
    return normalized || 'unknown';
};

const formatStatsMessage = (stats: UserStatsEntry[]): string => {
    if (stats.length === 0) {
        return STATS_EMPTY_USERS;
    }

    const lines = stats.map(
        (entry, index) => `${index + 1}. @${entry.name}: ${entry.wordsCount}`,
    );

    return lines.join('\n');
};

export class StatsCommand implements Command {
    static command = 'stats';

    constructor(private readonly bot: Telegraf<BotContext>) { }

    get description() {
        return {
            command: StatsCommand.command,
            description: 'Показать статистику слов',
        };
    }

    handle() {
        this.bot.command(StatsCommand.command, async (ctx) => {
            try {
                await ensureUser(ctx);

                const { data: users, error: usersError } = await ctx.supabaseClient
                    .from('users')
                    .select('id,tg_name');

                if (usersError) {
                    throw new Error(`Failed to fetch users: ${usersError.message}`);
                }

                const { data: words, error: wordsError } = await ctx.supabaseClient
                    .from('words')
                    .select('author_id');

                if (wordsError) {
                    throw new Error(`Failed to fetch words: ${wordsError.message}`);
                }

                const wordsCountByUserId = new Map<number, number>();
                for (const word of words ?? []) {
                    const currentCount = wordsCountByUserId.get(word.author_id) ?? 0;
                    wordsCountByUserId.set(word.author_id, currentCount + 1);
                }

                const stats = (users ?? [])
                    .map((user) => ({
                        name: normalizeUserName(user.tg_name),
                        wordsCount: wordsCountByUserId.get(user.id) ?? 0,
                    }))
                    .sort(
                        (left, right) =>
                            right.wordsCount - left.wordsCount ||
                            left.name.localeCompare(right.name, 'ru'),
                    );

                await ctx.reply(formatStatsMessage(stats));
            } catch (error) {
                console.error('Failed to process /stats command', error);
                await ctx.reply(STATS_FAILED_MESSAGE);
            }
        });
    }
}
