import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Timeout from '!babel-loader!../lib/Timeout';

storiesOf('Timeout', module)
    .add('basic usage', () => {
        const reportOuterRender = action('render parent');
        const reportRender = action('render with timeout state');
        const reportFinish = action('timeout then-prop call');

        reportOuterRender();

        return <div>
            <span>Timeout (500ms): </span>
            <Timeout on delayMs={500} then={() => {
                reportFinish();
            }}>{timeoutState => {
                reportRender(timeoutState);

                return timeoutState
                    ? '...waiting'
                    : 'finished!';
            }}</Timeout>
        </div>;
    })
    .add('with mid-way reset', () => {
        const reportOuterRender = action('render parent');
        const reportRender = action('render with timeout state');
        const reportFinish = action('timeout then-prop call');

        reportOuterRender();

        return <div>
            <span>Timeout (500ms): </span>
            <Timeout on delayMs={500}>{outerTimeoutState => {
                // interrupt the first timeout via the on-prop
                return <Timeout on={outerTimeoutState ? 'first' : 'second'} delayMs={1000} then={() => {
                    reportFinish();
                }}>{timeoutState => {
                    reportRender(timeoutState);

                    return timeoutState
                        ? '...waiting for ' + timeoutState.source
                        : 'finished!';
                }}</Timeout>;
            }}</Timeout>
        </div>;
    });
