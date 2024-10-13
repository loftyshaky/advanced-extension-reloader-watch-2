import path from 'path';

// eslint-disable-next-line import/no-extraneous-dependencies
import appRoot from 'app-root-path';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import del from 'rollup-plugin-delete';
import license from 'rollup-plugin-license';

// eslint-disable-next-line import/extensions
import { TscAlias } from '@loftyshaky/shared-app/js/tsc_alias.js';
// eslint-disable-next-line import/extensions
import copy from '@loftyshaky/shared-app/js/package/plugins/rollup-plugin-copy.js';
// eslint-disable-next-line import/extensions
import { Terser } from '@loftyshaky/shared-app/js/package/terser.js';

const app_root = appRoot.path;

const tsc_alias = new TscAlias();
const terserInst = new Terser();

const generate_config = (input, format, name, delete_dist, generate_dependencies_file) => ({
    input,
    output: [
        {
            dir: `dist/${format}`,
            format,
            name: format === 'umd' ? name : undefined,
            sourcemap: false,
        },
    ],
    treeshake: process.env.mode === 'production',
    watch: {
        clearScreen: false,
    },
    onwarn(warning, warn) {
        if (
            warning.code !== 'CIRCULAR_DEPENDENCY' &&
            warning.code === 'NON_EXISTENT_EXPORT' &&
            !warning.source.includes('\\interfaces\\')
        ) {
            warn(warning);
        }
    },
    external: ['supports-color', 'bufferutil', 'utf-8-validate'],
    plugins: [
        typescript({ tsconfig: `./tsconfig_${format}.json` }),
        commonjs(),
        resolve(),
        replace({
            'window.location.protocol': 'null',
            "document.querySelector('title');": 'null',
            "require('supports-color')": 'null',
            "require('bufferutil')": 'null',
            "require('utf-8-validate')": 'null',
            delimiters: ['', ''],
        }),
        tsc_alias.transform_aliases_to_relative_paths(),
        json({
            compact: true,
        }),
        copy({
            targets: [
                {
                    src: 'json/es/package.json',
                    dest: 'dist',
                },
                {
                    src: `json/${format}/package.json`,
                    dest: `dist/${format}`,
                },
                {
                    src: 'src/ts/index.d.ts',
                    dest: 'dist',
                },
                {
                    src: 'LICENSE.md',
                    dest: 'dist',
                },
                {
                    src: 'README.md',
                    dest: 'dist',
                },
            ],
            hook: 'writeBundle',
        }),
        process.env.mode === 'production' ? terser(terserInst.config) : undefined,
        ...[
            delete_dist
                ? del({
                      targets: 'dist',
                  })
                : undefined,
        ],
        ...[
            generate_dependencies_file
                ? license({
                      cwd: path.join(app_root),
                      banner: "Copyright <%= moment().format('YYYY') %>",
                      thirdParty: {
                          includePrivate: true,
                          output: {
                              file: path.join(app_root, 'dist', 'dependencies.txt'),
                          },
                      },
                  })
                : undefined,
        ],
    ],
});

export default [
    generate_config('src/ts/reloader.ts', 'umd', 'Reloader', true, true),
    generate_config('src/ts/listener.ts', 'umd', 'Listener', false, false),
    generate_config('src/ts/reloader.ts', 'es', undefined, false, false),
    generate_config('src/ts/listener.ts', 'es', undefined, false, false),
];
