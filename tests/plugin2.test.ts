import { TransformOptions, transformSync } from '@babel/core';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { babelPluginReactIf } from '../src';
import { invariant } from '@lesnoypudge/utils';
import { generate } from '@babel/generator';



const transformOptions: TransformOptions = {
    ast: true,
    code: false,
    babelrc: false,
    configFile: false,
    presets: [
        [
            '@babel/preset-typescript',
            { isTSX: true, allExtensions: true },
        ],
    ],
    parserOpts: {
        plugins: ['typescript', 'jsx'],
    },
    plugins: [babelPluginReactIf],
};

const getAst = (code: string) => {
    const result = transformSync(code, transformOptions);

    invariant(result?.ast);

    const tmp = generate(result.ast, {
        minified: true, concise: true, comments: false,
    });

    let codeWithoutSpaces = tmp.code;

    while (codeWithoutSpaces.includes('  ')) {
        codeWithoutSpaces = codeWithoutSpaces.replaceAll('  ', ' ');
    }

    const result2 = transformSync(
        codeWithoutSpaces,
        transformOptions,
    );

    invariant(result2?.ast);

    return result2.ast;
};

void test('transforms simple <If> to ternary fragment', () => {
    const actual = getAst(`
        const Qwe = () => {
            const val = 1;
            return (
                <If condition={val}>
                    {(value) => 'someString'}
                </If>
            );
        };
    `);

    const expected = getAst(`
        const Qwe = () => {
            const val = 1;
            return <>{val ? <>{'someString'}</> : null}</>;
        };
    `);

    assert.deepStrictEqual(actual, expected);
});

void test('transforms <If> inside JSX element', () => {
    const actual = getAst(`
        function Foo({ flag }) {
            return (
                <div>
                    <If condition={flag === true}>
                        {(ok) => <span>{ok.toString()}</span>}
                    </If>
                </div>
            );
        }
    `);

    const expected = getAst(`
        function Foo({ flag }) {
            return (
                <div>
                    <>{flag === true ? <><span>{ok.toString()}</span></> : null}</>
                </div>
            );
        }
    `);

    assert.deepStrictEqual(actual, expected);
});

void test('handles boolean coercion', () => {
    const actual = getAst(`
        const Bar = () => {
            const count = 0;
            return (
                <If condition={!!count}>
                    {(c) => <strong>{c}</strong>}
                </If>
            );
        };
    `);

    const expected = getAst(`
        const Bar = () => {
            const count = 0;
            return <>{!!count ? <><strong>{c}</strong></> : null}</>;
        };
    `);

    assert.deepStrictEqual(actual, expected);
});

void test('transforms nested fragment with component', () => {
    const actual = getAst(`
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
    `);

    const expected = getAst(`
        const Baz = () => {
            const obj = { ready: false };
            return <>
                <>{obj.ready ? <><Component a={r} b={'static'} /></> : null}</>
            </>;
        };
    `);

    assert.deepStrictEqual(actual, expected);
});

void test('handles array children', () => {
    const actual = getAst(`
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
    `);

    const expected = getAst(`
        const Multi = () => {
            const show = 'yes';
            return <>{show ? <>{[
                <p key="1">{s}</p>,
                <p key="2">{s.length}</p>,
            ]}</> : null}</>;
        };
    `);

    assert.deepStrictEqual(actual, expected);
});

void test('transforms nested <If> correctly', () => {
    const actual = getAst(`
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
    `);

    const expected = getAst(`
        const Nested = () => {
            const val = true;
            return (
                <div>
                    <>{val ? <><>{!v ? <>{'wont render'}</> : null}</></> : null}</>
                </div>
            );
        };
    `);

    assert.deepStrictEqual(actual, expected);
});