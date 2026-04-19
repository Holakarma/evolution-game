const RELYCAPP_DICTIONARY_LOOKUP_URL =
    'https://dictionary.relycapp.com/api/v1/dictionary/lookup';

export interface RelycappDefinitionTranslation {
    locale: string;
    definitions: string[];
}

export interface RelycappWordForm {
    form: string;
    tag: string;
}

export interface RelycappEntry {
    lang: string;
    lemma: string;
    pos: string;
    ipa?: string;
    definitions: RelycappDefinitionTranslation[];
    forms: RelycappWordForm[];
}

export interface RelycappDictionarySource {
    name: string;
    url: string;
    license: string;
}

export interface RelycappLookupResponse {
    word: string;
    entries: RelycappEntry[];
    source: RelycappDictionarySource;
}

export interface RelycappService {
    lookup: (word: string) => Promise<RelycappLookupResponse>;
}

export interface CreateRelycappServiceOptions {
    fetchFn?: typeof fetch;
}

export const createRelycappService = ({
    fetchFn = fetch,
}: CreateRelycappServiceOptions = {}): RelycappService => {
    const lookup = async (word: string): Promise<RelycappLookupResponse> => {
        const trimmedWord = word.trim();
        if (!trimmedWord) {
            throw new Error('Word for dictionary lookup is required');
        }

        const query = new URLSearchParams({ word: trimmedWord });
        const response = await fetchFn(
            `${RELYCAPP_DICTIONARY_LOOKUP_URL}?${query}`,
        );

        if (!response.ok) {
            throw new Error(
                `Relycapp Dictionary request failed with status ${response.status}`,
            );
        }

        return (await response.json()) as RelycappLookupResponse;
    };

    return { lookup };
};
