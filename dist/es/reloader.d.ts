import { Options } from './interfaces';
export default class Reloader {
    private port;
    private watch_dir;
    private httpserver;
    private io;
    private changed_files;
    constructor(obj: any);
    watch: ({ callback, }?: {
        callback?: (() => void) | undefined;
    }) => void;
    reload: ({ ext_id, hard, all_tabs, play_sound, after_enable_delay, full_reload_timeout, hard_paths, soft_paths, all_tabs_paths, one_tab_paths, }?: Options) => void;
    private check_if_matched_filename;
}
