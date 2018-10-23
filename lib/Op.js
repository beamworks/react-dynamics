const React = require('react');

class OpState {
    constructor(parentNode) {
        this.key = parentNode._generateOpKey();
        this.isPending = false;
        this.isComplete = false;
        this.isError = false;
        this.isInputError = false;
        this.value = null;

        this._parentNode = parentNode;
    }

    // invocation handler is not pre-bound: wanting to discourage direct usage of function reference
    // because e.g. form onSubmit passes the DOM event, etc, which is something the developer should know
    invoke(input) {
        if (this.isPending) {
            throw new Error('already invoked');
        }

        // mark internal state, before reporting to anyone else
        this.isPending = true;

        // report the input
        this._parentNode._invoke(this, input, (isError, isInputError, value) => {
            // record action result
            this.isPending = false;
            this.isComplete = true;
            this.isError = isError;
            this.isInputError = isInputError;
            this.value = value;
        });
    }
}

class Op extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            currentOp: null,
            lastOp: null
        };

        this._opCount = 0;
        this._isUnmounted = false;
    }

    componentWillMount() {
        this.setState({
            currentOp: new OpState(this)
        });
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _generateOpKey() {
        this._opCount += 1;

        return this._opCount;
    }

    _invoke(op, input, resultCb) {
        // check if still relevant (@todo check atomicity)
        if (this._isUnmounted || this.state.currentOp !== op) {
            throw new Error('not active');
        }

        // freeze current reference to action-prop callback @todo test
        // (however, NOT freezing current reference to then-prop callback)
        const action = this.props.action;

        // trigger redraw
        // @todo a better way?
        this.forceUpdate();

        // await input
        const whenInputFinished = Promise.resolve(input);

        // kick off the action itself
        const whenUpdatedOpState = whenInputFinished.then((inputValue) => {
            // check if still relevant (not checking state because only one op can be pending at a time)
            if (this._isUnmounted) {
                throw new Error('not active');
            }

            const whenActionFinished = Promise.resolve(action(inputValue));

            // mark op state result before render updates
            // (not checking for relevance here yet)
            return whenActionFinished.then(value => {
                resultCb(false, false, value);
            }, error => {
                resultCb(true, false, error);
            });
        }, inputError => {
            resultCb(true, true, inputError);
        });

        // set up new op state if still not stale
        const whenStateReset = whenUpdatedOpState.then(() => {
            return new Promise(resolve => {
                // check if still relevant (not checking state because only one op can be pending at a time)
                if (this._isUnmounted) {
                    throw new Error('not active');
                }

                this.setState({
                    currentOp: new OpState(this),
                    lastOp: op
                }, () => {
                    resolve();
                });
            });
        }, () => {
            // ignore if rejected due to irrelevance
        });

        // finally, notify the then-prop callback independently, if there was no error
        whenStateReset.then(() => {
            // notify after state is changed
            if (this.props.then && !op.isError) {
                return this.props.then(op.value);
            }
        }, () => {
            // do nothing if reset did not happen
        });
    }

    render() {
        return this.props.children(this.state.currentOp, this.state.lastOp);
    }
}

module.exports = Op;
