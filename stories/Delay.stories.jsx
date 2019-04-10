import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Delay from '!babel-loader!../lib/Delay';

storiesOf('Delay', module)
    .add('basic usage', () => {
        const reportOuterRender = action('render parent');
        const reportRender = action('render with timeout state');
        const reportFinish = action('timeout onComplete call');

        reportOuterRender();

        return <div>
            <span>Delay (500ms): </span>
            <Delay on delayMs={500} onComplete={() => {
                reportFinish();
            }}>{timeoutState => {
                reportRender(timeoutState);

                return timeoutState
                    ? '...waiting'
                    : 'finished!';
            }}</Delay>
        </div>;
    })
    .add('with mid-way reset', () => {
        const reportOuterRender = action('render parent');
        const reportRender = action('render with timeout state');
        const reportFinish = action('timeout onComplete call');

        reportOuterRender();

        return <div>
            <span>Delay (500ms): </span>
            <Delay on delayMs={500}>{outerTimeoutState => {
                // interrupt the first timeout via the on-prop
                return <Delay on={outerTimeoutState ? 'first' : 'second'} delayMs={1000} onComplete={() => {
                    reportFinish();
                }}>{timeoutState => {
                    reportRender(timeoutState);

                    return timeoutState
                        ? '...waiting for ' + timeoutState.source
                        : 'finished!';
                }}</Delay>;
            }}</Delay>
        </div>;
    });
