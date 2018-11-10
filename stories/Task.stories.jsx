import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Task from '!babel-loader!../lib/Task';

storiesOf('Task', module)
    .add('simple dropdown toggle', () => {
        const reportStart = action('started task');
        const reportResolution = action('resolved task');
        const reportRender = action('rendered with task state');

        return <Task then={reportResolution}>{(taskState, activate) => reportRender(!!taskState) || <div>
            <button type="button" onClick={() => {
                activate();
                reportStart();
            }}>Activate</button>

            <hr />

            {taskState
                ? <div style={{ display: 'inline-block', padding: '10px', background: '#f0f0f0' }}>
                    Task active: {''}
                    <button type="button" onClick={() => taskState.resolve(new Date())}>Resolve</button>
                    <button type="button" onClick={() => taskState.cancel()}>Cancel</button>
                </div>
                : <div><i>(inactive)</i></div>
            }
        </div>}</Task>;
    });
