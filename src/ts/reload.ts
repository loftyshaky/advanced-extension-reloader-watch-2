import { isNil } from 'lodash';
import nodeWatch from 'node-watch';
import { createServer } from 'http';
import { Server } from 'socket.io';

// eslint-disable-next-line import/extensions
import { Options } from './interfaces';

export default class Reload {
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
        play_sound = true,
        full_reload_timeout = 300,
        hard_dirs = [],
        soft_dirs = [],
        all_tabs_dirs = [],
        one_tab_dirs = [],
    }: Options = {}): void => {
        const hard_final = hard
            ? this.check_if_matched_filename({
                  val: hard,
                  paths: soft_dirs,
              })
            : this.check_if_matched_filename({
                  val: hard,
                  paths: hard_dirs,
              });

        const all_tabs_final = all_tabs
            ? this.check_if_matched_filename({
                  val: all_tabs,
                  paths: one_tab_dirs,
              })
            : this.check_if_matched_filename({
                  val: all_tabs,
                  paths: all_tabs_dirs,
              });
        this.io.sockets.emit('reload_app', {
            ext_id,
            hard: hard_final,
            all_tabs: all_tabs_final,
            play_sound,
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
