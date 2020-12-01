import { isNil } from 'lodash';
import nodeWatch from 'node-watch';
import io from 'socket.io';

export class Reload {
    private port: number = 7220;
    private watch_paths: string[] = ['src'];

    private server: any;
    private changed_files: string[] = [];

    public constructor(obj: any) {
        Object.assign(
            this,
            obj,
        );
        this.server = io.listen(this.port);
    }

    public watch = (
        {
            callback,
        }: {
            callback?: () => void
        } = {},
    ): void => {
        nodeWatch(
            this.watch_paths,
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
            hard = true,
            all_tabs = false,
            hard_paths = [],
            soft_paths = [],
            all_tabs_paths = [],
            one_tab_paths = [],
        }: {
            hard?: boolean;
            all_tabs?: boolean;
            hard_paths?: string[];
            soft_paths?: string[];
            all_tabs_paths?: string[];
            one_tab_paths?: string[];
        },
    ): void => {
        const hard_final = hard
            ? this.check_if_matched_filename(
                {
                    val: hard,
                    paths: soft_paths,
                },
            )
            : this.check_if_matched_filename(
                {
                    val: hard,
                    paths: hard_paths,
                },
            );

        const all_tabs_final = all_tabs
            ? this.check_if_matched_filename(
                {
                    val: all_tabs,
                    paths: one_tab_paths,
                },
            )
            : this.check_if_matched_filename(
                {
                    val: all_tabs,
                    paths: all_tabs_paths,
                },
            );

        this.server.sockets.emit(
            'reload_app',
            {
                hard: hard_final,
                all_tabs: all_tabs_final,
            },
        );

        this.changed_files = [];
    }

    private check_if_matched_filename = (
        {
            val,
            paths,
        }:
        {
            val: boolean;
            paths: string[]
        },
    ): boolean => {
        const match_val = this.changed_files.some((file) => (
            paths.some((file_name) => (
                file.includes(file_name)
            ))
        ));

        if (match_val && paths.length !== 0) {
            return !val;
        }

        return val;
    };
}
