import nodeWatch from 'node-watch';
import io from 'socket.io';

import { t } from '@loftyshaky/shared';

const server = io.listen(7220);

export class Reload {
    private watch_dirs: string[] = ['src'];
    private hard_dirs: string[] = [];
    private changed_files: string[] = [];

    constructor(
        {
            watch_dirs = ['src'],
            hard_dirs = [],
        }:
        {
            watch_dirs?: string[];
            hard_dirs?: string[];
        } = {},
    ) {
        this.watch_dirs = watch_dirs;
        this.hard_dirs = hard_dirs;
    }

    public watch = (
        {
            callback,
        }: {
            callback?: t.CallbackVariadicVoid | undefined
        } = {},
    ): void => err(() => {
        nodeWatch(
            this.watch_dirs,
            { recursive: true },
            (e, file_path: string) => {
                this.changed_files.push(file_path);

                if (n(callback)) {
                    callback();
                }
            },
        );
    },
    1001);

    public reload = (
        {
            hard = 'conditional',
            all_tabs = false,
        }: {
            hard?: boolean | 'conditional';
            all_tabs?: boolean;
        } = {},
    ): void => err(() => {
        const hard_final = hard === 'conditional'
            ? this.changed_files.some((file) => (
                this.hard_dirs.some((file_name) => (
                    file.includes(file_name)
                ))
            ))
            : hard;

        server.sockets.emit(
            'reload_app',
            {
                hard: hard_final,
                all_tabs,
            },
        );

        this.changed_files = [];
    },
    1002);
}
