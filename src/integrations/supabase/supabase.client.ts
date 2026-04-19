import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

export interface SupabaseClientOptions {
    url: string;
    anonKey: string;
}

export type AppSupabaseClient = SupabaseClient<Database>;

export const createSupabaseClient = ({
    url,
    anonKey,
}: SupabaseClientOptions): AppSupabaseClient => {
    if (!url) {
        throw new Error('SUPABASE_URL is required');
    }

    if (!anonKey) {
        throw new Error('SUPABASE_ANON_KEY is required');
    }

    return createClient<Database>(url, anonKey);
};
