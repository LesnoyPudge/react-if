import { T } from '@lesnoypudge/types-utils-base/namespace';
import React from 'react';



type RenderChildren<_Value> = (value: T.Truthy<_Value>) => React.ReactNode;

type Props<_Value> = {
    children: React.ReactNode | RenderChildren<_Value>;
    condition: T.Narrow<_Value>;
    key?: never;
};

export const If = <_Value>(_: Props<_Value>): React.ReactNode => {
    throw new Error('Should not exist in runtime');
};