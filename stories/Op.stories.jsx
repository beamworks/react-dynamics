import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Op from '!babel-loader!../lib/Op';

storiesOf('Op', module)
    .add('basic usage (synchronous)', () => {
        const reportAction = action('op action called with input');
        const reportCompletion = action('op onComplete called');
        const reportRenderWithoutLastOp = action('render without lastOp');
        const reportRenderPending = action('render pending state');
        const reportRenderWithLastOp = action('render with lastOp');

        return <Op
            action={value => {
                reportAction(value);
                return `output for ${value}`;
            }}
            onComplete={reportCompletion}
        >{(invoke, isPending, lastOp) => {
            if (isPending) {
                reportRenderPending();
            } else if (!lastOp) {
                reportRenderWithoutLastOp();
            } else {
                reportRenderWithLastOp(lastOp);
            }

            return <div>
                <button type="button" onClick={() => invoke(new Date())}>
                    Invoke
                </button>
            </div>;
        }}</Op>;
    })
    .add('error reporting', () => {
        const reportAction = action('op action called with input');
        const reportRenderWithoutLastOp = action('render without lastOp');
        const reportRenderPending = action('render pending state');
        const reportRenderWithLastOp = action('render with lastOp');

        return <Op
            action={value => {
                reportAction(value);
                throw new Error(`error for ${value}`);
            }}
        >{(invoke, isPending, lastOp) => {
            if (isPending) {
                reportRenderPending();
            } else if (!lastOp) {
                reportRenderWithoutLastOp();
            } else {
                reportRenderWithLastOp(lastOp, lastOp.error.message);
            }

            return <div>
                <button type="button" onClick={() => invoke(new Date())}>
                    Invoke
                </button>
            </div>;
        }}</Op>;
    })
    .add('immediate (autorun) invocation', () => {
        const reportAction = action('op action called with input');
        const reportCompletion = action('op onComplete called');
        const reportRenderPending = action('render pending state');
        const reportRenderWithoutLastOp = action('render without lastOp');
        const reportRenderWithLastOp = action('render with lastOp');

        return <Op
            autoInvoke={() => new Date()}
            action={value => {
                reportAction(value);
                return `output for ${value}`;
            }}
            onComplete={reportCompletion}
        >{(invoke, isPending, lastOp) => {
            if (isPending) {
                reportRenderPending();
            } else if (lastOp) {
                reportRenderWithLastOp(lastOp);
            } else {
                // this should never fire
                reportRenderWithoutLastOp();
            }

            return <div>
                <i>(auto-invoked)</i>
            </div>;
        }}</Op>;
    });
