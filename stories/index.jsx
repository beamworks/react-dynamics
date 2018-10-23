import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Timeout from '!babel-loader!../lib/Timeout';

storiesOf('react-dynamics', module)
    .add('Timeout', () => {
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
    });
