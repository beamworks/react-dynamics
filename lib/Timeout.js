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
        // when transitioning to active, or when active value changes, set up new "leading" timeout
        // (no need to detect transition to inactive, any pre-existing timeout will be ignored/overridden anyway)
        if (nextProps.on && (this.props.on !== nextProps.on)) {
            this.setState({ timeoutState: this._createTimeoutState(nextProps.on) });
        }
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _createTimeoutState(source) {
        var timeoutState = new TimeoutState(source);

        setTimeout(() => {
            // ignore if entire instance is obsolete
            if (this._isUnmounted) {
                return;
            }

            // deactivate timeout status if we are still the active one
            this.setState((state) => (state.timeoutState === timeoutState ? { timeoutState: null } : {}));
        }, this.props.delayMs);

        return timeoutState;
    }

    render() {
        // we are active if parent status is active and our "leading" timeout is still going
        return this.props.children(this.props.on ? this.state.timeoutState : null);
    }
}

module.exports = Timeout;
