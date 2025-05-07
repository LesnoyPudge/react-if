import * as babel from '@babel/core';
import { invariant } from '@lesnoypudge/utils';
import fs from 'node:fs';
import path from 'node:path';
import { babelPluginReactIf } from '../src';



const code = `
    const Qwe = () => {
        const val = 1;
        return (
            <If condition={val}>
                {(value) => 'someString'}
            </If>
        );
    };
`;

const res = babel.transformSync(code, {
    babelrc: false,
    presets: [
        [
            '@babel/preset-typescript',
            { isTSX: true, allExtensions: true },
        ],
    ],
    plugins: [babelPluginReactIf],
    parserOpts: {
        plugins: [
            'typescript',
            'jsx',
        ],
    },
});

invariant(res?.code, 'Failed to transform');

fs.writeFileSync(
    path.join(process.cwd(), 'example/transformed.js'),
    res.code,
    'utf8',
);