const path = require('path');

const typescript = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const terser = require('@rollup/plugin-terser');
const json = require('@rollup/plugin-json');
const del = require('rollup-plugin-delete');
const license = require('rollup-plugin-license');

const { TscAlias } = require('./node_modules/@loftyshaky/shared-app/js/tsc_alias');
const copy = require('./node_modules/@loftyshaky/shared-app/js/package/plugins/rollup-plugin-copy');
const { Terser } = require('./node_modules/@loftyshaky/shared-app/js/package/terser');

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
        replace({
            'window.location.protocol': 'null',
            "document.querySelector('title');": 'null',
            "require('supports-color')": 'null',
            "require('bufferutil')": 'null',
            "require('utf-8-validate')": 'null',
            delimiters: ['', ''],
        }),
        typescript({ tsconfig: `./tsconfig_${format}.json` }),
        tsc_alias.transform_aliases_to_relative_paths(),
        commonjs(),
        json({
            compact: true,
        }),
        resolve(),
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

module.exports = [
    generate_config(['src/ts/reloader.ts', 'src/ts/listener.ts'], 'es', undefined, true, true),
    generate_config('src/ts/reloader.ts', 'umd', 'Reloader', false, false),
    generate_config('src/ts/listener.ts', 'umd', 'Listener', false, false),
];
