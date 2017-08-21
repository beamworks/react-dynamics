const React = require('react');

class OpState {
    constructor(parentNode) {
        this.isPending = false;
        this.isComplete = false;
        this.isError = false;
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
        this._parentNode._invoke(this, input, (isError, value) => {
            // record action result
            this.isPending = false;
            this.isComplete = true;
            this.isError = isError;
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

    _invoke(op, input, resultCb) {
        // check if still relevant (@todo check atomicity)
        if (this._isUnmounted || this.state.currentOp !== op) {
            throw new Error('not active');
        }

        // trigger redraw
        // @todo a better way?
        this.forceUpdate();

        // kick off the action itself
        const whenFinished = Promise.resolve(
            input
        ).then((inputValue) => {
            return this.props.action(inputValue);
        });

        // filter through the convenience-then handler before marking complete and re-rendering
        const whenThenFinished = whenFinished.then(value => {
            // check if still relevant (@todo check atomicity)
            if (this._isUnmounted || this.state.currentOp !== op) {
                return;
            }

            if (this.props.then) {
                return this.props.then(value);
            } else {
                return value;
            }
        });

        // mark op state result before render updates
        const whenUpdatedOpState = whenThenFinished.then(value => {
            resultCb(false, value);
        }, error => {
            resultCb(true, error);
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
