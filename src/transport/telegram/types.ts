import type { Context, Telegraf } from 'telegraf';
import type { AppSupabaseClient } from '../../integrations/supabase/supabase.client';
import type { RelycappService } from '../../integrations/relycapp/relycapp.service';
import type { YandexDictionaryService } from '../../integrations/yandex-dictionary/yandex-dictionary.service';

export interface BotContext extends Context {
    relycappService: RelycappService;
    yandexDictionaryService: YandexDictionaryService;
    supabaseClient: AppSupabaseClient;
}

export type TelegramBot = Telegraf<BotContext>;

