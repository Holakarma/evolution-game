import type { Telegraf } from 'telegraf';
import { escapeMarkdownV2 } from '../../../shared/escape-markdown-v2';
import { ensureUser } from '../ensure-user';
import type { BotContext } from '../types';

const NEW_WORD_BROADCAST_TEMPLATE = '*@%s*: ✅ *%s*';
const LOADING_INDICATOR = '🔍';
const WORD_ADDED_TEMPLATE = '✅ %s';
const WORD_REJECTED_TEMPLATE = '❌ %s';
const WORD_ALREADY_EXISTS_REASON_TEMPLATE = 'слово уже забито @%s';
const WORD_NOT_FOUND_REASON = 'слова не существует';
const NOT_A_SINGLE_WORD = 'Отправь одно слово';
const INCORRENT_WORD = 'Слово должно заканчиваться на «ция»';

const isSingleWord = (value: string): boolean => {
    return value.split(/\s+/u).filter(Boolean).length === 1;
};

const formatRejectedMessage = (word: string, reason: string): string => {
    return `${WORD_REJECTED_TEMPLATE.replace('%s', word)}\n${reason}`;
};

const getUserNameById = async (
    ctx: BotContext,
    userId: number,
): Promise<string> => {
    const { data: author, error } = await ctx.supabaseClient
        .from('users')
        .select('tg_name')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to fetch user name: ${error.message}`);
    }

    return author?.tg_name ?? 'unknown';
};

const broadcastNewWord = async (
    ctx: BotContext,
    authorName: string,
    word: string,
): Promise<void> => {
    const { data: users, error } = await ctx.supabaseClient
        .from('users')
        .select('tg_id');

    if (error) {
        throw new Error(`Failed to fetch users for broadcast: ${error.message}`);
    }

    const message = NEW_WORD_BROADCAST_TEMPLATE
        .replace('%s', escapeMarkdownV2(authorName))
        .replace('%s', escapeMarkdownV2(word));

    const results = await Promise.allSettled(
        (users ?? []).map((user) =>
            ctx.telegram.sendMessage(user.tg_id, message, {
                parse_mode: 'MarkdownV2',
            }),
        ),
    );

    for (const result of results) {
        if (result.status === 'rejected') {
            console.error('Failed to send broadcast message', result.reason);
        }
    }
};

export const registerTextHandler = (bot: Telegraf<BotContext>): void => {
    bot.on('text', async (ctx) => {
        const text = ctx.message.text.trim();
        if (!text || text.startsWith('/')) {
            return;
        }

        const normalizedWord = text.toLowerCase();

        let loadingMessageId: number | null = null;
        const deleteLoadingIndicator = async (): Promise<void> => {
            if (loadingMessageId === null) {
                return;
            }

            try {
                await ctx.deleteMessage(loadingMessageId);
            } catch (error) {
                console.error('Failed to delete loading indicator', error);
            } finally {
                loadingMessageId = null;
            }
        };

        const replyAfterLoading = async (
            message: string,
            extra?: Parameters<BotContext['reply']>[1],
        ): Promise<void> => {
            await deleteLoadingIndicator();
            await ctx.reply(message, extra);
        };

        const loadingMessage = await ctx.reply(LOADING_INDICATOR);
        loadingMessageId = loadingMessage.message_id;

        if (!isSingleWord(text)) {
            await replyAfterLoading(NOT_A_SINGLE_WORD);
            return;
        }
        if (!normalizedWord.endsWith('ция')) {
            await replyAfterLoading(INCORRENT_WORD);
            return;
        }

        try {
            const { data: existingWord, error: existingWordError } =
                await ctx.supabaseClient
                    .from('words')
                    .select('author_id')
                    .eq('word', normalizedWord)
                    .maybeSingle();

            if (existingWordError) {
                throw new Error(
                    `Failed to check existing word: ${existingWordError.message}`,
                );
            }

            if (existingWord) {
                const authorName = await getUserNameById(ctx, existingWord.author_id);
                await replyAfterLoading(
                    formatRejectedMessage(
                        normalizedWord,
                        WORD_ALREADY_EXISTS_REASON_TEMPLATE.replace('%s', authorName),
                    ),
                );
                return;
            }

            const relycappLookupResult = await ctx.relycappService.lookup(
                normalizedWord,
            );

            let wordExists = relycappLookupResult.entries.length > 0;
            if (!wordExists) {
                const yandexLookupResult = await ctx.yandexDictionaryService.lookup(
                    normalizedWord,
                );
                wordExists = yandexLookupResult.def.length > 0;
            }

            if (!wordExists) {
                await replyAfterLoading(
                    formatRejectedMessage(normalizedWord, WORD_NOT_FOUND_REASON),
                );
                return;
            }

            const userId = await ensureUser(ctx);
            const { error: insertWordError } = await ctx.supabaseClient
                .from('words')
                .insert({
                    author_id: userId,
                    word: normalizedWord,
                });

            if (insertWordError) {
                throw new Error(`Failed to save word: ${insertWordError.message}`);
            }

            await replyAfterLoading(
                WORD_ADDED_TEMPLATE.replace('%s', normalizedWord),
            );

            const authorName = await getUserNameById(ctx, userId);
            await broadcastNewWord(ctx, authorName, normalizedWord);
        } catch (error) {
            console.error('Failed to process user word', error);
            await replyAfterLoading(
                WORD_REJECTED_TEMPLATE.replace('%s', normalizedWord),
            );
        }
    });
};
