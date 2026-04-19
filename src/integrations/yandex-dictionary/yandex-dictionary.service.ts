const YA_DICTIONARY_LOOKUP_URL =
    'https://dictionary.yandex.net/api/v1/dicservice.json/lookup';
const DEFAULT_LANG = 'ru-ru';

export interface YandexDictionarySynonym {
    text: string;
    pos?: string;
    fr?: number;
}

export interface YandexDictionaryTranslation {
    text: string;
    pos?: string;
    fr?: number;
    syn?: YandexDictionarySynonym[];
}

export interface YandexDictionaryDefinition {
    text: string;
    pos?: string;
    tr?: YandexDictionaryTranslation[];
}

export interface YandexDictionaryLookupResponse {
    head: Record<string, unknown>;
    def: YandexDictionaryDefinition[];
    nmt_code: number;
    code: number;
}

export interface YandexDictionaryService {
    lookup: (text: string) => Promise<YandexDictionaryLookupResponse>;
}

export interface CreateYandexDictionaryServiceOptions {
    apiToken: string;
    lang?: string;
    fetchFn?: typeof fetch;
}

export const createYandexDictionaryService = ({
    apiToken,
    lang = DEFAULT_LANG,
    fetchFn = fetch,
}: CreateYandexDictionaryServiceOptions): YandexDictionaryService => {
    if (!apiToken) {
        throw new Error('YA_DICT_API_TOKEN is required');
    }

    const lookup = async (
        text: string,
    ): Promise<YandexDictionaryLookupResponse> => {
        const trimmedText = text.trim();
        if (!trimmedText) {
            throw new Error('Text for dictionary lookup is required');
        }

        const query = new URLSearchParams({
            key: apiToken,
            lang,
            text: trimmedText,
        });

        const response = await fetchFn(`${YA_DICTIONARY_LOOKUP_URL}?${query}`);
        if (!response.ok) {
            throw new Error(
                `Yandex Dictionary request failed with status ${response.status}`,
            );
        }

        const payload =
            (await response.json()) as YandexDictionaryLookupResponse;
        if (payload.code !== 200) {
            throw new Error(
                `Yandex Dictionary API returned code ${payload.code}`,
            );
        }

        return payload;
    };

    return { lookup };
};
