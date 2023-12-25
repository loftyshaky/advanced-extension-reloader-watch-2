import path from 'path';

import replace from '@rollup/plugin-replace';
import typescript2 from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import transformPaths from 'ts-transform-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import del from 'rollup-plugin-delete';
import { terser } from 'rollup-plugin-terser';
import license from 'rollup-plugin-license';

const copy = require('./node_modules/@loftyshaky/shared-app/js/package/plugins/rollup-plugin-copy');
const { Terser } = require('./node_modules/@loftyshaky/shared-app/js/package/terser');

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
        replace({
            'window.location.protocol': 'null',
            "document.querySelector('title');": 'null',
            "require('supports-color')": 'null',
            "require('bufferutil')": 'null',
            "require('utf-8-validate')": 'null',
            delimiters: ['', ''],
        }),
        typescript2({
            rollupCommonJSResolveHack: true,
            clean: true,
            transformers: [transformPaths],
        }),
        commonjs(),
        json({
            compact: true,
        }),
        resolve(),
        nodeExternals(),
        copy({
            targets: [
                {
                    src: 'json/package.json',
                    dest: 'dist',
                },
                {
                    src: 'LICENSE.md',
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
                      cwd: path.join(__dirname),
                      banner: "Copyright <%= moment().format('YYYY') %>",
                      thirdParty: {
                          includePrivate: true,
                          output: {
                              file: path.join(__dirname, 'dist', 'dependencies.txt'),
                          },
                      },
                  })
                : undefined,
        ],
    ],
});

export default [
    generate_config(['src/ts/reloader.ts', 'src/ts/listener.ts'], 'es', undefined, true, true),
    generate_config('src/ts/reloader.ts', 'umd', 'Reloader', false, false),
    generate_config('src/ts/listener.ts', 'umd', 'Listener', false, false),
];
