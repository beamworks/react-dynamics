const React = require('react');

class TimeoutState {
    constructor(source) {
        this.source = source;

        this._whenStarted = new Promise(resolve => {
            this._start = resolve;
        });
    }
}

// @todo report delay
// @todo default missing active to true
// @todo report state, including start time
class Timeout extends React.PureComponent {
    constructor(props) {
        super();

        if (!props.hasOwnProperty('on')) {
            throw new Error('the "on" property is required');
        }

        this._isUnmounted = false;

        this.state = {
            timeoutState: null
        };
    }

    componentWillMount() {
        // set up initial timeout state, but keep it dormant until after render cycle
        // (this helps pass the state down even on initial render, but still lets server-side mode do nothing else)
        if (this.props.on) {
            this.setState({ timeoutState: this._createTimeoutState(this.props.on, true) });
        }
    }

    componentDidMount() {
        // start the dormant initial timeout state since this is likely running in browser
        if (this.state.timeoutState) {
            this.state.timeoutState._start();
        }
    }

    componentWillReceiveProps(nextProps) {
        // when active value changes, set up new timeout or clear it
        const nextTimeoutState = nextProps.on
            ? (this.props.on === nextProps.on
                ? this.state.timeoutState // preserve current state
                : this._createTimeoutState(nextProps.on) // set up new one
            )
            : null;

        this.setState({ timeoutState: nextTimeoutState });
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _createTimeoutState(source, isDormant) {
        var timeoutState = new TimeoutState(source);

        // start the timeout immediately unless asked to wait until after render cycle
        if (!isDormant) {
            timeoutState._start();
        }

        const whenTimeoutDone = timeoutState._whenStarted.then(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, this.props.delayMs);
            });
        });

        const whenThenDone = whenTimeoutDone.then(() => {
            // check if still relevant (@todo check atomicity)
            if (this._isUnmounted || this.state.timeoutState !== timeoutState) {
                throw new Error('not active');
            }

            // notify after state is changed
            if (this.props.then) {
                return this.props.then();
            }

            // nothing to return if no then-callback
            return null;
        });

        // finally, clear the timeout state
        whenThenDone.catch(() => {
            // do nothing on then-callback error
        }).then(() => {
            // check if still relevant (@todo check atomicity)
            if (this._isUnmounted || this.state.timeoutState !== timeoutState) {
                throw new Error('not active');
            }

            // deactivate timeout status
            this.setState({ timeoutState: null });
        });

        return timeoutState;
    }

    render() {
        return this.props.children(this.state.timeoutState);
    }
}

module.exports = Timeout;
