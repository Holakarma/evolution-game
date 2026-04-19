import type { BotContext } from './types';

const UNKNOWN_USER_NAME = 'unknown';

const resolveTelegramName = (ctx: BotContext): string => {
    if (!ctx.from) {
        return UNKNOWN_USER_NAME;
    }

    if (ctx.from.username) {
        return ctx.from.username;
    }

    const fullName = [ctx.from.first_name, ctx.from.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();

    return fullName || UNKNOWN_USER_NAME;
};

export const ensureUser = async (ctx: BotContext): Promise<number> => {
    if (!ctx.from) {
        throw new Error('Telegram user is missing in context');
    }

    const tgId = String(ctx.from.id);

    const { data: existingUser, error: selectError } = await ctx.supabaseClient
        .from('users')
        .select('id')
        .eq('tg_id', tgId)
        .maybeSingle();

    if (selectError) {
        throw new Error(`Failed to fetch user: ${selectError.message}`);
    }

    if (existingUser) {
        return existingUser.id;
    }

    const { data: insertedUser, error: insertError } = await ctx.supabaseClient
        .from('users')
        .insert({
            tg_id: tgId,
            tg_name: resolveTelegramName(ctx),
        })
        .select('id')
        .single();

    if (insertError || !insertedUser) {
        throw new Error(`Failed to create user: ${insertError?.message ?? 'unknown error'}`);
    }

    return insertedUser.id;
};
