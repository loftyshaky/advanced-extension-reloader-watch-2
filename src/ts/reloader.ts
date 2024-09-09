import path from 'path';
import isNil from 'lodash/isNil';
import isEmpty from 'lodash/isEmpty';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { createServer } from 'http';
import { Server } from 'socket.io';
import kill from 'kill-port';
import { redBright } from 'colorette';

// eslint-disable-next-line import/extensions
import { Options } from './interfaces';

export default class Reloader {
    private port: number = 7220;
    private watch_dir: string = 'src';

    private httpserver = createServer();
    private io = new Server(this.httpserver, {
        cors: {
            origin: [
                'chrome-extension://hmhmmmajoblhmohkmfjeoamhdpodihlg',
                'chrome-extension://hagknokdofkmojolcpbddjfdjhnjdkae', // chrome
                'chrome-extension://bcpgohifjmmcoiemghdamamlkbcbgifg', // edge
            ],
        },
    });

    private changed_files: string[] = [];
    private first_reload_completed = false;
    private reload_attempts: number = 0;
    private listening: boolean = false;
    private attempted_to_reload_once_while_listening = false;
    private reload_delay = 750;

    public constructor(obj: any) {
        Object.assign(this, obj);

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
        callback?: () => void;
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
            ext_id,
            hard = true,
            all_tabs = false,
            play_notifications = false,
            reload_throttle_delay = 500,
            after_reload_delay = 1000,
            between_reloads_delay = 1000,
            listen_message_response_timeout = 400,
            manifest_path = false,
            hard_paths = [],
            soft_paths = [],
            all_tabs_paths = [],
            one_tab_paths = [],
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
                    ext_id,
                    hard,
                    all_tabs,
                    play_notifications,
                    reload_throttle_delay,
                    after_reload_delay,
                    between_reloads_delay,
                    listen_message_response_timeout,
                    manifest_path,
                    hard_paths,
                    soft_paths,
                    all_tabs_paths,
                    one_tab_paths,
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
                                this.play_manifest_error_notification({ ext_id });
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

            manifest_json_is_valid = check_if_manifest_json_is_valid();

            if (manifest_json_is_valid) {
                this.io.sockets.emit('reload_app', {
                    ext_id,
                    hard: hard_final,
                    all_tabs: all_tabs_final,
                    play_notifications,
                    reload_throttle_delay,
                    after_reload_delay,
                    between_reloads_delay,
                    listen_message_response_timeout,
                });
            }

            this.changed_files = [];
        }

        return manifest_json_is_valid;
    };

    public play_error_notification = ({ ext_id }: { ext_id?: string } = {}): void => {
        this.io.sockets.emit('play_error_notification', {
            ext_id,
        });
    };

    public play_manifest_error_notification = ({ ext_id }: { ext_id?: string } = {}): void => {
        this.io.sockets.emit('play_manifest_error_notification', {
            ext_id,
        });
    };

    private check_if_matched_filename = ({
        val,
        paths,
    }: {
        val: boolean;
        paths: string[];
    }): boolean => {
        const match_val = this.changed_files.some((file) =>
            paths.some((file_name) => file.includes(file_name)),
        );

        if (match_val && paths.length !== 0) {
            return !val;
        }

        return val;
    };
}
