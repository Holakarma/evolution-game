export interface Logger {
    info: (message: string) => void;
    error: (message: string, error?: unknown) => void;
}

export const createLogger = (): Logger => ({
    info: (message: string) => {
        console.log(message);
    },
    error: (message: string, error?: unknown) => {
        console.error(message, error);
    },
});
