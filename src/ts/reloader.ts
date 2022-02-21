import path from 'path';
import { isNil, isEmpty } from 'lodash';
import fs from 'fs-extra';
import nodeWatch from 'node-watch';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

    public constructor(obj: any) {
        Object.assign(this, obj);

        const io = this.httpserver.listen(this.port);

        io.on('error', () => {
            // eslint-disable-next-line no-console
            console.log(
                redBright('[Advanced Extension Reloader Watch 2 error] Port already in use.'),
            );

            process.exit(1);
        });
    }

    public watch = ({
        callback,
    }: {
        callback?: () => void;
    } = {}): void => {
        try {
            nodeWatch(
                this.watch_dir,
                { recursive: true },
                (e, file_path: string | undefined): void => {
                    if (!isNil(file_path)) {
                        this.changed_files.push(file_path);

                        if (!isNil(callback)) {
                            callback();
                        }
                    }
                },
            );
        } catch (error_object) {
            // eslint-disable-next-line no-console
            console.log(
                redBright(
                    "[Advanced Extension Reloader Watch 2 error] Directory provided in the watch_dir property doesn't exist.",
                ),
            );

            process.exit(1);
        }
    };

    public reload = ({
        ext_id,
        hard = true,
        all_tabs = false,
        play_sound = false,
        after_reload_delay = 0,
        manifest_path = false,
        hard_paths = [],
        soft_paths = [],
        all_tabs_paths = [],
        one_tab_paths = [],
    }: Options = {}): boolean => {
        const check_if_manifest_json_is_valid = (): boolean => {
            let manifest_json_is_valid: boolean = true;

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

                    manifest_json_is_valid = manifest_json !== null;

                    if (!manifest_json_is_valid) {
                        // eslint-disable-next-line no-console
                        console.log(
                            redBright(
                                '[Advanced Extension Reloader Watch 2 error] manifest.json is not valid. Extension was not reloaded.',
                            ),
                        );
                    }
                }
            }

            return manifest_json_is_valid;
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

        const manifest_json_is_valid: boolean = check_if_manifest_json_is_valid();

        if (manifest_json_is_valid) {
            this.io.sockets.emit('reload_app', {
                ext_id,
                hard: hard_final,
                all_tabs: all_tabs_final,
                play_sound,
                after_reload_delay,
            });
        }

        this.changed_files = [];

        return manifest_json_is_valid;
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
