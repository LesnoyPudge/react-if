import * as t from '@babel/types';
import * as babel from '@babel/core';
import { invariant } from '@lesnoypudge/utils';
import { T } from '@lesnoypudge/types-utils-base/namespace';



export const babelPluginReactIf = (): babel.PluginObj => {
    return {
        name: 'react-if',
        visitor: {
            JSXElement: (path, _state) => {
                const node = path.node;

                const { openingElement, closingElement } = node;

                if (!t.isJSXIdentifier(openingElement.name)) return;
                if (openingElement.name.name !== 'If') return;

                invariant(closingElement);

                const [condition] = (
                    openingElement.attributes.filter((v) => {
                        return t.isJSXAttribute(v);
                    }).filter((v) => {
                        return t.isJSXIdentifier(v.name);
                    }).filter((v) => {
                        return (
                            v.name.name === 'condition'
                            && t.isJSXExpressionContainer(v.value)
                        );
                    }).map((v) => {
                        invariant(t.isJSXExpressionContainer(v.value));
                        invariant(!t.isJSXEmptyExpression(v.value.expression));

                        return v.value.expression;
                    })
                );

                invariant(condition);

                const [propsChild] = (
                    openingElement.attributes.filter((v) => {
                        return t.isJSXAttribute(v);
                    }).filter((v) => {
                        return t.isJSXIdentifier(v.name);
                    }).filter((v) => {
                        return (
                            v.name.name === 'children'
                            && !t.isStringLiteral(v.value)
                        );
                    }).map((v) => {
                        invariant(!t.isStringLiteral(v.value));
                        return v.value;
                    })
                );

                const nestedChildren = node.children;

                let children: NonNullable<
                    typeof propsChild
                    | T.ArrayValues<typeof nestedChildren>
                >[] | undefined;

                if (propsChild) {
                    children = [propsChild];
                }

                const isRenderChildrenCase = !nestedChildren.some((v) => {
                    return (
                        !t.isJSXText(v)
                        && !t.isJSXExpressionContainer(v)
                    );
                });

                if (!propsChild && !isRenderChildrenCase) {
                    children = nestedChildren;
                }

                if (!propsChild && isRenderChildrenCase) {
                    const expressionContainer = nestedChildren.find((v) => {
                        return t.isJSXExpressionContainer(v);
                    });
                    invariant(expressionContainer);

                    const { expression } = expressionContainer;

                    const shouldInline = t.isArrowFunctionExpression(
                        expression,
                    );

                    if (!shouldInline) {
                        children = [expressionContainer];
                    }

                    if (shouldInline) {
                        invariant(t.isArrowFunctionExpression(expression));

                        const { body } = expression;
                        invariant(!t.isBlockStatement(body));

                        if (t.isJSXElement(body)) {
                            children = [body];
                        }

                        if (!t.isJSXElement(body)) {
                            children = [t.jSXExpressionContainer(body)];
                        }
                    }
                }

                invariant(children, 'Found unhandled children');

                const fragment = t.jSXFragment(
                    t.jSXOpeningFragment(),
                    t.jSXClosingFragment(),
                    children,
                );

                const newNode = t.jSXFragment(
                    t.jSXOpeningFragment(),
                    t.jSXClosingFragment(),
                    [
                        t.jSXExpressionContainer(
                            t.conditionalExpression(
                                condition,
                                fragment,
                                t.nullLiteral(),
                            ),
                        ),
                    ],
                );

                path.replaceWith(newNode);
            },
        },
    };
};