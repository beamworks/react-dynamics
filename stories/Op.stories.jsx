import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Op from '!babel-loader!../lib/Op';

storiesOf('Op', module)
    .add('basic usage (synchronous)', () => {
        const reportAction = action('op action called with input');
        const reportCompletion = action('op onComplete called');
        const reportRenderWithoutLastOp = action('render without lastOp');
        const reportRenderWithLastOp = action('render with lastOp');

        return <Op
            action={value => {
                reportAction(value);
                return `output for ${value}`;
            }}
            onComplete={reportCompletion}
        >{(currentOp, lastOp) => {
            if (lastOp) {
                reportRenderWithLastOp(lastOp.value);
            } else {
                reportRenderWithoutLastOp();
            }

            return <div>
                <button type="button" onClick={() => currentOp.invoke('TEST' + currentOp.key)}>
                    Invoke with: TEST{currentOp.key}
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
            autoInvoke={() => Promise.resolve(new Date())}
            action={value => {
                reportAction(value);
                return `output for ${value}`;
            }}
            onComplete={reportCompletion}
        >{(currentOp, lastOp) => {
            if (currentOp.isPending) {
                reportRenderPending();
            } else if (lastOp) {
                reportRenderWithLastOp(lastOp.value);
            } else {
                // this should never fire
                reportRenderWithoutLastOp();
            }

            return <div>
                <i>(auto-invoked)</i>
            </div>;
        }}</Op>;
    });
