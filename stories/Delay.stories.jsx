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
            <span>Delay (0.5s): </span>
            <Delay seconds={0.5} onComplete={() => {
                reportFinish();
            }}>{timeoutState => {
                reportRender(timeoutState);

                return timeoutState
                    ? '...waiting'
                    : 'finished!';
            }}</Delay>
        </div>;
    })
    .add('with disabled state', () => {
        const reportOuterRender = action('render parent');
        const reportRender = action('render with timeout state');
        const reportFinish = action('timeout onComplete call');

        reportOuterRender();

        return <div>
            <span>Delay (1s before start, then 2s): </span>
            <Delay millis={1000}>{outerTimeoutState => {
                // interrupt the first timeout via the observed-prop
                return <Delay disabled={outerTimeoutState} millis={2000} onComplete={() => {
                    reportFinish();
                }}>{timeoutState => {
                    reportRender(new Date(), timeoutState);

                    if (outerTimeoutState) {
                        return 'waiting to enable...';
                    }

                    return timeoutState
                        ? '...enabled, waiting'
                        : 'finished!';
                }}</Delay>;
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
            <Delay millis={500}>{outerTimeoutState => {
                // interrupt the first timeout via the observed-prop
                return <Delay observe={outerTimeoutState} millis={1000} onComplete={() => {
                    reportFinish();
                }}>{timeoutState => {
                    reportRender(timeoutState);

                    return timeoutState
                        ? '...waiting for ' + timeoutState.key
                        : 'finished!';
                }}</Delay>;
            }}</Delay>
        </div>;
    });
