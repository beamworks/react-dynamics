import React from 'react';
import { Route, Redirect, MemoryRouter } from 'react-router';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Task from '!babel-loader!../lib/Task';
import Op from '!babel-loader!../lib/Op';
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
    })
    .add('routes + breadcrumbs', () => {
        const reportStepYield = action('yielding on step');
        const reportStepAnswer = action('resulting answer');

        return <MemoryRouter><Route>{({ location: refreshLocation }) => <Op action={v => v}>{(stashUpdateOp, currentStashOp) => <Sequence
            step={(prompt, next, previousBreadcrumbs) => {
                const [ stepKey, stepContents ] = prompt;
                const allValues = currentStashOp && !currentStashOp.isError && currentStashOp.value || {};

                return <Route refreshLocation={refreshLocation} exact path={`/${stepKey}`}>{({ match, location, history }) => {
                    // redirect to current step if previous one is done
                    //if (previousStepComplete) {
                      //  return <Redirect push to={`/${stepKey}`} />;
                    //}

                    // final step never has a current value
                    if (!next) {
                        return <div>Finish {stepContents}</div>;
                    }

                    // normal step with possible stored value
                    return <Task>{(doneStep, startNextStep) => {
                        const stepHasValue = !!doneStep;
                        const stepValue = doneStep ? doneStep.source : null;

                        const breadcrumbs = (previousBreadcrumbs || []).concat([
                            match
                                ? [ stepKey, stepContents, startNextStep, doneStep ]
                                : [ stepKey ]
                        ]);

                        // keep recursing while we can
                        if (doneStep) {
                            return next(doneStep.source, breadcrumbs);
                        }

                        // reached end of the line, show the currently-matched step
                        const currentBreadcrumb = breadcrumbs.find(([ breadcrumbKey, breadcrumbContents ]) => {
                            return breadcrumbContents;
                        });

                        // if stale navigation, redirect to start
                        if (!currentBreadcrumb) {
                            return <button
                                type="button"
                                onClick={() => history.push('/')}
                            >Go to start, nothing on /{stepKey}</button>;
                        }

                        const [ currentKey, currentContents, currentActivate, currentState ] = currentBreadcrumb;

                        return <div>
                            <div>{breadcrumbs.map(([ breadcrumbKey, breadcrumbContents, breadcrumbMatch ]) => <button
                                key={breadcrumbKey}
                                type="button"
                                style={breadcrumbMatch && { fontWeight: 'bold' }}
                                onClick={() => history.push(`/${breadcrumbKey}`)}
                            >[{breadcrumbKey}]</button>)}</div>

                            <div>
                                Step <span>{currentContents} [{currentState ? currentState.source : '<empty>'}]</span> | <button
                                    type="button"
                                    onClick={() => {
                                        // start redirection right away
                                        // (pass new step value directly to avoid state change timing issues)
                                        const updatedStepValue = `answer for '${currentKey}'`;

                                        if (currentState) {
                                            currentState.cancel();
                                        }

                                        currentActivate(updatedStepValue);

                                        // store the step value for later re-renders
                                        //stashUpdateOp.invoke({
                                        //    ...allValues,
                                        //    [currentKey]: updatedStepValue
                                        //});
                                        //<Task>{(redirectState, startRedirect) => redirectState ? next(redirectState.source, true) : }</Task>

                                    }}
                                >NEXT</button>
                            </div>
                        </div>;
                    }}</Task>;
                }}</Route>;
            }}
        >{function* () {
            reportStepYield('FIRST');
            const firstAnswer = yield [ '', `FIRST STEP` ];
            reportStepAnswer('FIRST', firstAnswer);

            let step = 2;

            while (step < 4) {
                reportStepYield(step);
                const answer = yield [ `step${step}`, `STEP ${step}` ];
                reportStepAnswer(step, answer);

                step += 1;
            }

            reportStepYield('FINAL');
            return [ 'final', `FINAL STEP ${step}` ];
        }}</Sequence>}</Op>}</Route></MemoryRouter>;
    });
