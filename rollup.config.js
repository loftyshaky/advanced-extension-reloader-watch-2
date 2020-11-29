import replace from '@rollup/plugin-replace';
import typescript2 from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import transformPaths from 'ts-transform-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import del from 'rollup-plugin-delete';
import copy from './node_modules/@loftyshaky/shared/js/shared/plugins/rollup-plugin-copy';

const config = {
    input: 'src/ts/index.ts',
    output: [{
        file: 'build/index.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: false,
        intro: 'const chrome = {runtime: {id: 1}};',
    }],
    treeshake: true,
    watch: {
        clearScreen: false,
    },
    external: [
        'supports-color',
        'bufferutil',
        'utf-8-validate',
    ],
    plugins: [
        replace({
            'window.location.protocol': 'null',
            "document.querySelector('title');": 'null',
            'window.': 'global.',
            "require('supports-color')": 'null',
            "require('bufferutil')": 'null',
            "require('utf-8-validate')": 'null',
            delimiters: [
                '',
                '',
            ],
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
        del({
            targets: 'build',
        }),
        copy(
            {
                targets: [{
                    src: 'package.json',
                    dest: 'build',
                }],
                hook: 'writeBundle',
            },
        ),
    ],
};

export default config;
