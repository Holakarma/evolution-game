import { config as loadDotenv } from 'dotenv';

export interface AppConfig {
    botToken: string;
    yaDictToken: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    domain?: string;
    port: number;
}

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
};

const parsePort = (value: string): number => {
    const port = Number(value);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value: ${value}`);
    }
    return port;
};

export const loadConfig = (): AppConfig => {
    if (process.env.RENDER !== 'true') {
        const { error } = loadDotenv();
        if (error) {
            throw new Error(`Failed to load .env: ${error.message}`);
        }
    }

    const domain =
        process.env.RENDER === 'true'
            ? process.env.RENDER_EXTERNAL_URL
            : process.env.DOMAIN;

    return {
        botToken: requireEnv('BOT_TOKEN'),
        yaDictToken: requireEnv('YA_DICT_API_TOKEN'),
        supabaseUrl: requireEnv('SUPABASE_URL'),
        supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
        domain,
        port: parsePort(process.env.PORT ?? '3000'),
    };
};
