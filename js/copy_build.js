import path from 'path';
import fs from 'fs-extra';

import { ProjectName } from './loftyshaky/package/project_name';
import { absolute_paths } from '../../../absolute_paths';

const project_name = new ProjectName();

export class CopyBuild {
    copy = () => {
        const apps = [
            'Extension Reloader Watch 1',
            'Base64 font-face',
        ];
        const extension_reloader_watch_paths = apps.map((project) => path.join(
            absolute_paths.q,
            project,
            project_name.transform({ project }),
            'node_modules',
            'extension-reloader-watch-2',
        ));
        const build_path = path.join(
            __dirname,
            'build',
        );

        extension_reloader_watch_paths.forEach((dest_extension_reloader_watch_path) => {
            fs.removeSync(dest_extension_reloader_watch_path);

            fs.copySync(
                build_path,
                dest_extension_reloader_watch_path,
            );
        });
    }
}
