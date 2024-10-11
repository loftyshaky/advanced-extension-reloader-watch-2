export const allowed_advanced_extension_reloader_ids: string[] = [
    'hmhmmmajoblhmohkmfjeoamhdpodihlg',
    'hagknokdofkmojolcpbddjfdjhnjdkae',
    'bcpgohifjmmcoiemghdamamlkbcbgifg',
];

export const allowed_advanced_extension_reloader_origins: string[] =
    allowed_advanced_extension_reloader_ids.map((id) => `chrome-extension://${id}`);
