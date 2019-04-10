const React = require('react');

class OpState {
    constructor(parentNode) {
        this.key = parentNode._generateOpKey();
        this.isPending = false;
        this.isComplete = false;
        this.isError = false;
        this.isInputError = false;
        this.value = null;
        this.input = null;

        this._parentNode = parentNode;
    }

    // invocation handler is not pre-bound: wanting to discourage direct usage of function reference
    // because e.g. form onSubmit passes the DOM event, etc, which is something the developer should know
    invoke(input) {
        if (this.isPending || this.isComplete) {
            throw new Error('already invoked');
        }

        // mark internal state, before reporting to anyone else
        this.isPending = true;

        // report the input
        this._parentNode._invoke(this, input, (isError, isInputError, value, input) => {
            // record action result
            this.isPending = false;
            this.isComplete = true;
            this.isError = isError;
            this.isInputError = isInputError;
            this.value = value;
            this.input = input;
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
            // check if still relevant (no need to check state)
            if (this._isUnmounted) {
                throw new Error('not active');
            }

            const whenActionFinished = Promise.resolve(action(inputValue));

            // mark op state result before render updates
            // (not checking for relevance here yet)
            return whenActionFinished.then(value => {
                resultCb(false, false, value, inputValue);
            }, error => {
                resultCb(true, false, error, inputValue);
            });
        }, inputError => {
            resultCb(true, true, inputError, null);
        });

        // set up new op state if still not stale
        whenUpdatedOpState.then(() => {
            // check if still relevant (no need to check state)
            if (this._isUnmounted) {
                return;
            }

            // notify parent callback before re-rendering
            if (!op.isError) {
                this._notifyCompletion(op.value, op.input);
            } else {
                this._notifyError(op.value, op.isInputError);
            }

            // check if still relevant after parent callback (no need to check state)
            if (this._isUnmounted) {
                return;
            }

            this.setState({
                currentOp: new OpState(this),
                lastOp: op
            });
        }, () => {
            // ignore if rejected due to irrelevance
        });
    }

    _notifyCompletion(result, input) {
        if (this.props.onComplete) {
            this.props.onComplete(result, input);
        }

        // @todo deprecate
        if (this.props.then) {
            this.props.then(result, input);
        }
    }

    _notifyError(error, isInputError) {
        if (this.props.onError) {
            this.props.onError(error, isInputError);
        }
    }

    render() {
        return this.props.children(this.state.currentOp, this.state.lastOp);
    }
}

module.exports = Op;
