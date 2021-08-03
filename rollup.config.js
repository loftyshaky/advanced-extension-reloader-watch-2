import replace from '@rollup/plugin-replace';
import typescript2 from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import transformPaths from 'ts-transform-paths';
import nodeExternals from 'rollup-plugin-node-externals';
import del from 'rollup-plugin-delete';
import { terser } from 'rollup-plugin-terser';

const copy = require('./node_modules/@loftyshaky/shared/js/package/plugins/rollup-plugin-copy');
const { Terser } = require('./node_modules/@loftyshaky/shared/js/package/terser');

const terserInst = new Terser();

const config = {
    input: 'src/ts/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'cjs',
            exports: 'named',
            sourcemap: false,
            intro: 'const chrome = {runtime: {id: 1}};',
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
            'window.': 'global.',
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
        del({
            targets: 'dist',
        }),
        copy({
            targets: [
                {
                    src: 'package.json',
                    dest: 'dist',
                },
            ],
            hook: 'writeBundle',
        }),
        process.env.mode === 'production' ? terser(terserInst.config) : undefined,
    ],
};

export default config;
