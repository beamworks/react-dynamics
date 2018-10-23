import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Op from '!babel-loader!../lib/Op';

storiesOf('Op', module)
    .add('basic usage (synchronous)', () => {
        const reportAction = action('op action called with input');
        const reportThen = action('op then-prop called');
        const reportRenderWithoutLastOp = action('render without lastOp');
        const reportRenderWithLastOp = action('render with lastOp');

        return <Op
            action={value => {
                reportAction(value);
                return `output for ${value}`;
            }}
            then={reportThen}
        >{(currentOp, lastOp) => {
            if (lastOp) {
                reportRenderWithLastOp(lastOp.value);
            } else {
                reportRenderWithoutLastOp();
            }

            return <div>
                <button type="button" onClick={() => currentOp.invoke('TEST1')}>
                    Invoke with: TEST1
                </button>
            </div>;
        }}</Op>;
    });
