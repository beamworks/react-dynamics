import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Task from '!babel-loader!../lib/Task';
import Sequence from '!babel-loader!../lib/Sequence';

storiesOf('Sequence', module)
    .add('simple progression using Task', () => {
        const reportStepYield = action('yielding on step');
        const reportStepAnswer = action('resulting answer');

        return <Sequence
            step={(prompt, next) => {
                if (!next) {
                    return <div>Finish {prompt}</div>;
                }

                return <Task>{(doneStep, startNextStep) =>
                    !doneStep
                        ? <div>Step {prompt} | <button
                            type="button"
                            onClick={() => startNextStep(`answer for ${prompt}`)}
                        >NEXT</button></div>
                        : next(doneStep.source)
                }</Task>;
            }}
        >{function* () {
            let step = 1;

            while (step < 3) {
                reportStepYield(step);

                const answer = yield `STEP ${step}`;
                reportStepAnswer(answer);

                step += 1;
            }

            reportStepYield(step);
            return `FINAL STEP ${step}`;
        }}</Sequence>;
    });
