export const RUNTIME_MODE = Object.freeze({
    POLLING: 'polling',
    WEBHOOK: 'webhook',
});

export type RuntimeMode = (typeof RUNTIME_MODE)[keyof typeof RUNTIME_MODE];

interface ResolveRuntimeModeInput {
    nodeEnv?: string;
    lifecycleEvent?: string;
}

export const resolveRuntimeMode = ({
    nodeEnv = process.env.NODE_ENV,
}: ResolveRuntimeModeInput = {}): RuntimeMode => {
    const isProduction = nodeEnv === 'production';

    if (isProduction) {
        return RUNTIME_MODE.WEBHOOK;
    }

    return RUNTIME_MODE.POLLING;
};
