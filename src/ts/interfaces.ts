export interface Options {
    ext_id?: string;
    hard?: boolean;
    all_tabs?: boolean;
    play_notifications?: boolean;
    reload_throttle_delay?: number;
    after_reload_delay?: number;
    between_reloads_delay?: number;
    listen_message_response_timeout?: number;
    manifest_path?: boolean | string;
    hard_paths?: string[];
    soft_paths?: string[];
    all_tabs_paths?: string[];
    one_tab_paths?: string[];
}
