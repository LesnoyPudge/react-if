import { pluginTester } from 'babel-plugin-tester';
import { babelPluginReactIf } from '../src';
import { describe, it } from 'node:test';
import * as babel from '@babel/core';
import { generate } from '@babel/generator';
import { invariant } from '@lesnoypudge/utils';


// @ts-ignore
globalThis.describe = describe;
// @ts-ignore
globalThis.it = it;
// @ts-ignore
globalThis.it.only = (...args) => it(args[0], { only: true }, args[1]);


const createCode = (text: string) => {
    const ast = babel.template.ast(text, {
        plugins: ['typescript', 'jsx'],
    });
    invariant(!Array.isArray(ast));

    const code = generate(ast).code;

    return code;
};

pluginTester({
    plugin: babelPluginReactIf,
    formatResult: (code) => code,
    babelOptions: {
        presets: [
            [
                '@babel/preset-typescript',
                { isTSX: true, allExtensions: true },
            ],
            // '@babel/preset-react',
        ],
        parserOpts: {
            plugins: ['typescript', 'jsx'],
        },
    },
    tests: [
        {
            code: createCode(`
                const Qwe = () => {
                    const val = 1;
                    return (
                        <If condition={val}>
                            {(value) => 'someString'}
                        </If>
                    );
                };
            `),
            output: createCode(`
                const Qwe = () => {
                    const val = 1;
                    return <>{val ? <>{'someString'}</> : null}</>;
                };
            `),
        },

        {
            code: createCode(`
                function Foo({ flag }) {
                    return (
                        <div>
                            <If condition={flag === true}>
                                {(ok) => <span>{ok.toString()}</span>}
                            </If>
                        </div>
                    );
                }
            `),
            output: createCode(`
                function Foo({ flag }) {
                    return (
                        <div>
                            <>{flag === true ? <><span>{ok.toString()}</span></> : null}</>
                        </div>
                    );
                }
            `),
        },

        {
            code: createCode(`
                const Bar = () => {
                    const count = 0;
                    return (
                        <If condition={!!count}>
                            {(c) => <strong>{c}</strong>}
                        </If>
                    );
                };
            `),
            output: createCode(`
                const Bar = () => {
                    const count = 0;
                    return <>{!!count ? <><strong>{c}</strong></> : null}</>;
                };
            `),
        },

        {

            code: createCode(`
                const Baz = () => {
                    const obj = { ready: false };
                    return (
                        <>
                            <If condition={obj.ready}>
                                {(r) => (
                                    <Component a={r} b={'static'} />
                                )}
                            </If>
                        </>
                    );
                };
            `),

            output: createCode(`
                const Baz = () => {
                    const obj = {
                        ready: false
                    };
                    return <>
                        <>{obj.ready ? <><Component a={r} b={'static'} /></> : null}</>
                    </>;
                };
            `),
        },

        {
            code: createCode(`
                const Multi = () => {
                    const show = 'yes';
                    return (
                        <If condition={show}>
                            {(s) => [
                                <p key="1">{s}</p>,
                                <p key="2">{s.length}</p>,
                            ]}
                        </If>
                    );
                };
            `),
            output: createCode(`
                const Multi = () => {
                    const show = 'yes';
                    return <>{show ? <>{[
                        <p key="1">{s}</p>,
                        <p key="2">{s.length}</p>,
                    ]}</> : null}</>;
                };
            `),
        },

        {
            code: createCode(`
                const Nested = () => {
                    const val = true;
                    return (
                        <div>
                            <If condition={val}>
                                {(v) => (
                                    <If condition={!v}>
                                        {(nv) => 'wont render'}
                                    </If>
                                )}
                            </If>
                        </div>
                    );
                };
            `),
            output: createCode(`
                const Nested = () => {
                    const val = true;
                    return (
                        <div>
                            <>{val ? <><>{!v ? <>{'wont render'}</> : null}</></> : null}</>
                        </div>
                    );
                };
            `),
        },
    ],
});