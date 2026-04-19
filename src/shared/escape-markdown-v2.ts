const MARKDOWN_V2_RESERVED_CHARS_REGEX = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

export const escapeMarkdownV2 = (value: string): string =>
    value.replace(MARKDOWN_V2_RESERVED_CHARS_REGEX, '\\$1');
