const React = require('react');

class DelayState {
    constructor(key) {
        this.key = key; // unique key

        this._start = null; // filled in inside promise
        this._whenStarted = new Promise(resolve => {
            this._start = resolve;
        });
    }
}

// @todo report delay
// @todo default missing active to true
// @todo report state, including start time
class Delay extends React.PureComponent {
    constructor(props) {
        super(props);

        // get observed props at start time to simplify logic
        this._observedPropList = Object.keys(this.props).filter(propName => (/^observe/).exec(propName));

        this._delayCount = 0;
        this._isUnmounted = false;

        this.state = {
            timeoutState: null
        };
    }

    componentWillMount() {
        // set up initial timeout state, but keep it dormant until after render cycle
        // (this helps pass the state down even on initial render, but still lets server-side mode do nothing else)
        if (!this.props.disabled) {
            this.setState({ timeoutState: this._createTimeoutState(this.props, true) });
        }
    }

    componentDidMount() {
        // start the dormant initial timeout state since this is likely running in browser
        if (this.state.timeoutState) {
            this.state.timeoutState._start();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.disabled) {
            // stop current timeout
            if (!this.props.disabled) {
                this.setState({
                    timeoutState: null
                });
            }
        } else {
            if (this.props.disabled || this._getObservedPropsChanged(nextProps)) {
                // re-enable or refresh with new timeout
                this.setState({ timeoutState: this._createTimeoutState(nextProps, false) });
            }
        }
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _getObservedPropsChanged(nextProps) {
        return this._observedPropList.some(propName =>
            this.props[propName] !== nextProps[propName]
        )
    }

    _getDelayMillisFromProps(nextProps) {
        // millis (checking first as the most likely choice of prop for amount)
        if (Object.prototype.hasOwnProperty.call(nextProps, 'millis')) {
            return nextProps.millis;
        }

        // seconds
        if (Object.prototype.hasOwnProperty.call(nextProps, 'seconds')) {
            return nextProps.seconds * 1000;
        }

        // fall back to zero delay (wait till next tick)
        return 0;
    }

    _createTimeoutState(nextProps, isDormant) {
        this._delayCount += 1;
        var timeoutState = new DelayState(this._delayCount);

        // start the timeout immediately unless asked to wait until after render cycle
        if (!isDormant) {
            timeoutState._start();
        }

        // use most up-to-date delay amount
        const currentDelayMs = this._getDelayMillisFromProps(nextProps);

        const whenTimeoutDone = timeoutState._whenStarted.then(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, currentDelayMs);
            });
        });

        whenTimeoutDone.then(() => {
            // clear out current timeout reference if still relevant
            // (not using reducer-style setState because this is outside any update cycle)
            if (this._isUnmounted || this.state.timeoutState !== timeoutState) {
                return;
            }

            // notify parent callback before re-rendering
            this._notifyCompletion();

            // state update with safety check in case parent callback caused changes
            if (!this._isUnmounted) {
                this.setState((state) => state.timeoutState === timeoutState ? { timeoutState: null } : null);
            }
        });

        return timeoutState;
    }

    _notifyCompletion() {
        if (this.props.onComplete) {
            this.props.onComplete();
        }

        // @todo deprecate
        if (this.props.then) {
            this.props.then();
        }
    }

    render() {
        return this.props.children(this.state.timeoutState);
    }
}

module.exports = Delay;
