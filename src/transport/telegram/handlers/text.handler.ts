import type { Telegraf } from 'telegraf';
import { escapeMarkdownV2 } from '../../../shared/escape-markdown-v2';
import { ensureUser } from '../ensure-user';
import type { BotContext } from '../types';

const SINGLE_WORD_ERROR = 'должно быть одно слово';
const WORD_ENDING_ERROR = 'слово должно заканчиваться на «ция»';
const WORD_NOT_FOUND_ERROR = 'такого слова нет';
const WORD_ALREADY_EXISTS_TEMPLATE = 'уже забито *@%s*';
const WORD_ACCEPTED_MESSAGE = '🔥';
const NEW_WORD_BROADCAST_TEMPLATE = '*@%s*: новое слово *%s*';
const WORD_PROCESSING_ERROR = 'Произошла ошибка при обработке слова';
const LOADING_INDICATOR = '🔍';

const isSingleWord = (value: string): boolean => {
    return value.split(/\s+/u).filter(Boolean).length === 1;
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
            await replyAfterLoading(SINGLE_WORD_ERROR);
            return;
        }

        const normalizedWord = text.toLowerCase();
        if (!normalizedWord.endsWith('ция')) {
            await replyAfterLoading(WORD_ENDING_ERROR);
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
                const message = WORD_ALREADY_EXISTS_TEMPLATE.replace(
                    '%s',
                    escapeMarkdownV2(authorName),
                );
                await replyAfterLoading(message, { parse_mode: 'MarkdownV2' });
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
                await replyAfterLoading(WORD_NOT_FOUND_ERROR);
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
                throw new Error(
                    `Failed to save word: ${insertWordError.message}`,
                );
            }

            await replyAfterLoading(WORD_ACCEPTED_MESSAGE);

            const authorName = await getUserNameById(ctx, userId);
            await broadcastNewWord(ctx, authorName, normalizedWord);
        } catch (error) {
            console.error('Failed to process user word', error);
            await replyAfterLoading(WORD_PROCESSING_ERROR);
        }
    });
};
