import path from 'path';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { createServer } from 'http';
import { Server } from 'socket.io';
import kill from 'kill-port';
import { redBright } from 'colorette';

import { Options } from './interfaces';
import { allowed_advanced_extension_reloader_origins } from './allowed_advanced_extension_reloader_ids';

export default class Reloader {
    private port: number = 7220;
    private watch_dir: string = 'src';

    private httpserver = createServer();
    private io = new Server(this.httpserver, {
        cors: {
            origin: allowed_advanced_extension_reloader_origins,
        },
    });

    private changed_files: string[] = [];
    private first_reload_completed = false;
    private reload_attempts: number = 0;
    private listening: boolean = false;
    private attempted_to_reload_once_while_listening = false;
    private reload_delay = 750;

    public constructor(options?: { port?: number; watch_dir?: string }) {
        this.port = options && options.port ? options.port : this.port;
        this.watch_dir = options && options.watch_dir ? options.watch_dir : this.watch_dir;
        // kill process running on port
        kill(this.port, 'tcp')
            .then(() => {
                this.listen();
            })
            .catch(() => {
                // Fix crash on linux due to "kill" method's promise from the "kill-port" package being rejected. See https://github.com/loftyshaky/clear-new-tab/issues/14 and https://github.com/loftyshaky/advanced-extension-reloader/issues/3

                this.listen();
            });
    }

    private listen = (): void => {
        const io = this.httpserver.listen(this.port, () => {
            this.listening = true;

            setTimeout(() => {
                this.reload_delay = 100;
            }, this.reload_delay); // Delay is 1.5 the reconnectionDelayMax: 500 in the Advanced Extension Reloader extension. It's needed to make sure that the Advanced Extension Reloader is connected to server before sending a reload message.
        });

        //> probably never get to this point since now I use kill-port above
        io.on('error', (error) => {
            // eslint-disable-next-line no-console
            console.log(
                redBright(
                    `[Advanced Extension Reloader Watch 2 error] Unable to connect to port ${this.port}.`,
                ),
            );
            // eslint-disable-next-line no-console
            console.log(error);

            process.exit(1);
        });
        //< probably never get to this point since now I use kill-port above;
    };

    public watch = ({
        callback,
    }: {
        callback?: () => void; // Used in advanced-extension-reloader-watch-1
    } = {}): void => {
        try {
            const watch_callback = (file_path: string | undefined): void => {
                if (!isNil(file_path)) {
                    this.changed_files.push(path.resolve(file_path));

                    if (!isNil(callback)) {
                        callback();
                    }
                }
            };

            const watcher = chokidar.watch(this.watch_dir, { ignoreInitial: true });

            watcher
                .on('add', watch_callback)
                .on('change', watch_callback)
                .on('unlink', watch_callback);
        } catch {
            // eslint-disable-next-line no-console
            console.log(
                redBright(
                    "[Advanced Extension Reloader Watch 2 error] Directory provided in the watch_dir property doesn't exist.",
                ),
            );

            process.exit(1);
        }
    };

    public reload = (
        {
            extension_id,
            hard = true,
            all_tabs = false,
            always_open_popup = false,
            play_notifications = false,
            min_interval_between_extension_reloads = 500,
            delay_after_extension_reload = 1000,
            delay_after_tab_reload = 2000,
            listen_message_response_timeout = 400,
            manifest_path = false,
            hard_paths = [],
            soft_paths = [],
            all_tabs_paths = [],
            one_tab_paths = [],
            always_open_popup_paths = [],
        }: Options = {},
        reloading_from_advanced_extension_reloader_watch_1: boolean = false,
    ): boolean => {
        let manifest_json_is_valid: boolean = false;

        if (
            !reloading_from_advanced_extension_reloader_watch_1 &&
            this.reload_attempts <= 50 &&
            ((isEmpty(this.changed_files) && this.first_reload_completed) ||
                !this.listening ||
                !this.attempted_to_reload_once_while_listening)
        ) {
            this.reload_attempts += 1;
            this.attempted_to_reload_once_while_listening = this.listening;

            setTimeout(() => {
                this.reload({
                    extension_id,
                    hard,
                    all_tabs,
                    always_open_popup,
                    play_notifications,
                    min_interval_between_extension_reloads,
                    delay_after_extension_reload,
                    delay_after_tab_reload,
                    listen_message_response_timeout,
                    manifest_path,
                    hard_paths,
                    soft_paths,
                    all_tabs_paths,
                    one_tab_paths,
                    always_open_popup_paths,
                });
            }, this.reload_delay);
        } else {
            this.first_reload_completed = true;
            this.reload_attempts = 0;

            // eslint-disable-next-line no-loop-func
            const check_if_manifest_json_is_valid = (): boolean => {
                let manifest_json_is_valid_2: boolean = true;

                if (manifest_path !== false) {
                    const manifest_path_absolute: string =
                        typeof manifest_path === 'string'
                            ? manifest_path
                            : path.resolve(this.watch_dir, 'manifest.json');
                    const files: string[] = isEmpty(this.changed_files)
                        ? [manifest_path_absolute]
                        : this.changed_files;
                    const changed_manifest_json: boolean = files.includes(manifest_path_absolute);

                    if (changed_manifest_json) {
                        const manifest_json: any = fs.readJsonSync(manifest_path_absolute, {
                            throws: false,
                        });

                        manifest_json_is_valid_2 = manifest_json !== null;

                        if (!manifest_json_is_valid_2) {
                            if (play_notifications) {
                                this.play_manifest_error_notification({ extension_id });
                            }

                            // eslint-disable-next-line no-console
                            console.log(
                                redBright(
                                    '[Advanced Extension Reloader Watch 2 error] manifest.json is not valid. Extension was not reloaded.',
                                ),
                            );
                        }
                    }
                }

                return manifest_json_is_valid_2;
            };

            const hard_final = hard
                ? this.check_if_matched_filename({
                      val: hard,
                      paths: soft_paths,
                  })
                : this.check_if_matched_filename({
                      val: hard,
                      paths: hard_paths,
                  });

            const all_tabs_final = all_tabs
                ? this.check_if_matched_filename({
                      val: all_tabs,
                      paths: one_tab_paths,
                  })
                : this.check_if_matched_filename({
                      val: all_tabs,
                      paths: all_tabs_paths,
                  });

            const always_open_popup_final = this.check_if_need_to_open_popup({
                val: always_open_popup,
                paths: always_open_popup_paths,
            });

            manifest_json_is_valid = check_if_manifest_json_is_valid();

            if (manifest_json_is_valid) {
                this.io.sockets.emit('reload_app', {
                    extension_id,
                    hard: hard_final,
                    all_tabs: all_tabs_final,
                    always_open_popup: always_open_popup_final,
                    play_notifications,
                    min_interval_between_extension_reloads,
                    delay_after_extension_reload,
                    delay_after_tab_reload,
                    listen_message_response_timeout,
                });
            }

            this.changed_files = [];
        }

        return manifest_json_is_valid;
    };

    public play_error_notification = ({ extension_id }: { extension_id?: string } = {}): void => {
        this.io.sockets.emit('play_error_notification', {
            extension_id,
        });
    };

    private play_manifest_error_notification = ({
        extension_id,
    }: { extension_id?: string } = {}): void => {
        this.io.sockets.emit('play_manifest_error_notification', {
            extension_id,
        });
    };

    private check_if_matched_filename = ({
        val,
        paths,
    }: {
        val: boolean;
        paths: string[];
    }): boolean => {
        const match_val = this.match_val({ paths });

        if (match_val && paths.length !== 0) {
            return !val;
        }

        return val;
    };

    private check_if_need_to_open_popup = ({
        val,
        paths,
    }: {
        val: boolean;
        paths: string[];
    }): boolean => {
        const match_val = this.match_val({ paths });
        const open_popup_on_cond: boolean = val && paths.length !== 0;

        if (open_popup_on_cond) {
            return val && match_val && paths.length !== 0;
        }

        return val;
    };

    private match_val = ({ paths }: { paths: string[] }): boolean => {
        const match_val = this.changed_files.some((file) =>
            paths.some((file_name) => file.includes(file_name)),
        );

        return match_val;
    };
}
