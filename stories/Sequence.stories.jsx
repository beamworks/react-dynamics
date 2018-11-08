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

        return <MemoryRouter><Route>{({ location: refreshLocation }) => <Op action={v => v}>{(currentOp, lastOp) => <Sequence
            step={(prompt, next, previousBreadcrumbs) => {
                const [ stepKey, stepContents ] = prompt;

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
                    const allValues = lastOp && !lastOp.isError && lastOp.value || {};

                    const stepHasValue = Object.prototype.hasOwnProperty.call(allValues, stepKey);
                    const stepValue = allValues[stepKey];

                    const breadcrumbs = (previousBreadcrumbs || []).concat([ [
                        stepKey,
                        <span>{stepContents} [{stepHasValue ? stepValue : '<empty>'}]</span>,
                        match
                    ] ]);

                    // keep recursing while we can
                    if (stepHasValue) {
                        return next(stepValue, breadcrumbs);
                    }

                    // show the currently-matched step
                    return <div>
                        <div>{breadcrumbs.map(([ breadcrumbKey, breadcrumbContents, breadcrumbMatch ]) => <button
                            key={breadcrumbKey}
                            type="button"
                            style={breadcrumbMatch && { fontWeight: 'bold' }}
                            onClick={() => history.push(`/${breadcrumbKey}`)}
                        >[{breadcrumbKey}]</button>)}</div>

                        {breadcrumbs.map(([ breadcrumbKey, breadcrumbContents, breadcrumbMatch ]) => breadcrumbMatch && <div key={0}>
                            Step {breadcrumbContents} | <button
                                type="button"
                                onClick={() => {
                                    // start redirection right away
                                    // (pass new step value directly to avoid state change timing issues)
                                    const updatedStepValue = `answer for '${breadcrumbKey}'`;
                                    //startRedirect(updatedStepValue);

                                    // store the step value for later re-renders
                                    currentOp.invoke({
                                        ...allValues,
                                        [breadcrumbKey]: updatedStepValue
                                    });
                                }}
                            >NEXT</button>
                        </div>)}
                    </div>;

                    if (match) {
                        // display current prompt
                        return <Task>{(redirectState, startRedirect) => redirectState ? next(redirectState.source, true) : <div>
                            Step {stepContents} [
                            {stepHasValue ? stepValue : '<empty>'}
                            ] | <button
                                type="button"
                                onClick={() => {
                                    // start redirection right away
                                    // (pass new step value directly to avoid state change timing issues)
                                    const updatedStepValue = `answer for ${stepContents}`;
                                    startRedirect(updatedStepValue);

                                    // store the step value for later re-renders
                                    currentOp.invoke({
                                        ...allValues,
                                        [stepKey]: updatedStepValue
                                    });
                                }}
                            >NEXT</button>
                        </div>}</Task>;
                    } else if (stepHasValue) {
                        // recurse into next step
                        return next(stepValue, false);
                    } else {
                        // stale navigation, redirect to start
                        return <button
                            type="button"
                            onClick={() => history.push('/')}
                        >Go to start, nothing on /{stepKey}</button>;
                    }
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
