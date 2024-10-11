export interface Options {
    extension_id?: string;
    hard?: boolean;
    all_tabs?: boolean;
    open_popup?: boolean;
    play_notifications?: boolean;
    min_interval_between_extension_reloads?: number;
    delay_after_extension_reload?: number;
    delay_after_tab_reload?: number;
    listen_message_response_timeout?: number;
    manifest_path?: boolean | string;
    hard_paths?: string[];
    soft_paths?: string[];
    all_tabs_paths?: string[];
    one_tab_paths?: string[];
    open_popup_paths?: string[];
}
