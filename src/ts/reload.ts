import { isNil } from 'lodash';
import nodeWatch from 'node-watch';
import io from 'socket.io';

export class Reload {
    private server: any;
    private watch_dirs: string[] = ['src'];
    private hard_dirs: string[] = [];
    private changed_files: string[] = [];

    constructor(
        {
            port = 7220,
            watch_dirs = ['src'],
            hard_dirs = [],
        }:
        {
            port?: number,
            watch_dirs?: string[];
            hard_dirs?: string[];
        } = {},
    ) {
        this.server = io.listen(port);
        this.watch_dirs = watch_dirs;
        this.hard_dirs = hard_dirs;
    }

    public watch = (
        {
            callback,
        }: {
            callback?: () => void
        } = {},
    ): void => {
        nodeWatch(
            this.watch_dirs,
            { recursive: true },
            (e, file_path: string) => {
                this.changed_files.push(file_path);

                if (!isNil(callback)) {
                    callback();
                }
            },
        );
    };

    public reload = (
        {
            hard = 'conditional',
            all_tabs = false,
        }: {
            hard?: boolean | 'conditional';
            all_tabs?: boolean;
        } = {},
    ): void => {
        const hard_final = hard === 'conditional'
            ? this.changed_files.some((file) => (
                this.hard_dirs.some((file_name) => (
                    file.includes(file_name)
                ))
            ))
            : hard;

        this.server.sockets.emit(
            'reload_app',
            {
                hard: hard_final,
                all_tabs,
            },
        );

        this.changed_files = [];
    }
}
