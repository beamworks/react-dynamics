const React = require('react');

class TimeoutState {
    constructor(source) {
        this.source = source;
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
        // set up initial "leading" timeout
        if (this.props.on) {
            this.setState({ timeoutState: this._createTimeoutState(this.props.on) });
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

    _createTimeoutState(source) {
        var timeoutState = new TimeoutState(source);

        const whenTimeoutDone = new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, this.props.delayMs);
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
