import map from 'lodash/map';

export const allowed_advanced_extension_reloader_ids: string[] = [
    'hmhmmmajoblhmohkmfjeoamhdpodihlg',
    'hagknokdofkmojolcpbddjfdjhnjdkae',
    'bcpgohifjmmcoiemghdamamlkbcbgifg',
];

export const allowed_advanced_extension_reloader_origins: string[] = map(
    allowed_advanced_extension_reloader_ids,
    (id) => `chrome-extension://${id}`,
);
