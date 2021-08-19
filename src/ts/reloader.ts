import { isNil } from 'lodash';
import nodeWatch from 'node-watch';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
                'chrome-extension://hagknokdofkmojolcpbddjfdjhnjdkae',
            ],
        },
    });

    private changed_files: string[] = [];

    public constructor(obj: any) {
        Object.assign(this, obj);
        this.httpserver.listen(this.port);
    }

    public watch = ({
        callback,
    }: {
        callback?: () => void;
    } = {}): void => {
        nodeWatch(this.watch_dir, { recursive: true }, (e, file_path: string | undefined): void => {
            if (!isNil(file_path)) {
                this.changed_files.push(file_path);

                if (!isNil(callback)) {
                    callback();
                }
            }
        });
    };

    public reload = ({
        ext_id,
        hard = true,
        all_tabs = false,
        play_sound = false,
        after_enable_delay = 300,
        full_reload_timeout = 300,
        hard_paths = [],
        soft_paths = [],
        all_tabs_paths = [],
        one_tab_paths = [],
    }: Options = {}): void => {
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
        this.io.sockets.emit('reload_app', {
            ext_id,
            hard: hard_final,
            all_tabs: all_tabs_final,
            play_sound,
            after_enable_delay,
            full_reload_timeout,
        });

        this.changed_files = [];
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
