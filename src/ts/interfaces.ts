export interface Options {
    ext_id?: string;
    hard?: boolean;
    all_tabs?: boolean;
    play_notifications?: boolean;
    after_reload_delay?: number;
    manifest_path?: boolean | string;
    hard_paths?: string[];
    soft_paths?: string[];
    all_tabs_paths?: string[];
    one_tab_paths?: string[];
}
