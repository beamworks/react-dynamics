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

        // trigger redraw
        // @todo a better way?
        this.forceUpdate();

        // await input
        const whenInputFinished = Promise.resolve(input);

        // kick off the action itself
        const whenUpdatedOpState = whenInputFinished.then((inputValue) => {
            const whenActionFinished = Promise.resolve(this.props.action(inputValue));

            // filter through the convenience-then handler before marking complete and re-rendering
            const whenThenFinished = whenActionFinished.then(value => {
                // check if still relevant (@todo check atomicity)
                if (this._isUnmounted || this.state.currentOp !== op) {
                    return;
                }

                return this.props.then
                    ? this.props.then(value)
                    : value;
            });

            // mark op state result before render updates
            return whenThenFinished.then(value => {
                resultCb(false, false, value);
            }, error => {
                resultCb(true, false, error);
            });
        }, inputError => {
            resultCb(true, true, inputError);
        });

        // set up new op state if still not stale
        whenUpdatedOpState.then(() => {
            // check if still relevant (@todo check atomicity)
            if (this._isUnmounted || this.state.currentOp !== op) {
                return;
            }

            this.setState({
                currentOp: new OpState(this),
                lastOp: op
            });
        });
    }

    render() {
        return this.props.children(this.state.currentOp, this.state.lastOp);
    }
}

module.exports = Op;
