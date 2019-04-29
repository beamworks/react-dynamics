const React = require('react');

class OpState {
    constructor(key, inputValue, isError, value) {
        this.key = key;
        this.isError = isError;
        this.input = inputValue;
        this.result = isError ? null : value;
        this.error = isError ? value : null;
    }
}

class Op extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            pendingRequest: null,
            lastOp: null
        };

        this._opCount = 0;
        this._isUnmounted = false;

        this._invokeHandler = this._invokeOp.bind(this);
    }

    componentWillMount() {
        // auto-start the op before first render
        // @todo server-side support
        if (this.props.autoInvoke) {
            const input = (
                typeof this.props.autoInvoke === 'function'
                    ? this.props.autoInvoke()
                    : this.props.autoInvoke
            );

            this._invokeOp(input);
        }
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    invoke(inputValue) {
        // public instance-accessible wrapper around internal invoker
        this._invokeOp(inputValue);
    }

    _generateOpKey() {
        this._opCount += 1;

        return this._opCount;
    }

    _invokeOp(inputValue) {
        if (this._isUnmounted) {
            throw new Error('not mounted');
        }

        // @todo put inside setState
        if (this.state.pendingRequest) {
            throw new Error('already pending');
        }

        // catch synchronous exceptions using promise wrapper
        const action = this.props.action || (value => value); // using pass-through if none specified

        const whenActionFinished = new Promise((resolve) => {
            resolve(action(inputValue));
        }).then(
            value => new OpState(this._generateOpKey(), inputValue, false, value),
            error => new OpState(this._generateOpKey(), inputValue, true, error)
        );

        const request = whenActionFinished.then(op => {
            // silently return if unmounted (no need to check state)
            if (this._isUnmounted) {
                return;
            }

            // notify parent callback before re-rendering
            if (op.isError) {
                this._notifyError(op.error, op.input);
            } else {
                this._notifyCompletion(op.result, op.input);
            }

            // state update with safety check in case parent callback caused changes
            if (!this._isUnmounted) {
                this.setState({
                    pendingRequest: null,
                    lastOp: op
                });
            }
        });

        // mark pending state
        this.setState({
            pendingRequest: request
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
        return this.props.children(
            this._invokeHandler,
            !!this.state.pendingRequest,
            this.state.lastOp
        );
    }
}

module.exports = Op;
