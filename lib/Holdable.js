const React = require('react');

// @todo report start time? and also original "on" start time, even?
class HoldState {
    constructor(source) {
        // not reporting delay because not relevant (and easy to confuse with fade state)
        this.source = source;
    }
}

class Holdable extends React.PureComponent {
    constructor(props) {
        super();

        this._isUnmounted = false;

        // @todo initial state? in willMount, likely
        this.state = {
            activeTimeoutId: null,
            holdState: null
        };
    }

    componentWillReceiveProps(nextProps) {
        // when transitioning to active, or changing the identity of "on" value
        // set up new "leading" timeout
        // (no need to detect transition to inactive, any pre-existing timeout will be ignored/overridden anyway)
        if (nextProps.on && (this.props.on !== nextProps.on)) {
            this.setState({
                activeTimeoutId: this._createTimeout(nextProps.on),
                holdState: null
            });
        }
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _createTimeout(source) {
        const delayMs = this.props.delayMs;

        const timeoutId = setTimeout(() => {
            // ignore if entire instance is obsolete
            if (this._isUnmounted) {
                return;
            }

            // deactivate timeout status if we are still the active one
            this.setState((state) => (
                state.activeTimeoutId === timeoutId
                    ? {
                        activeTimeoutId: null,
                        holdState: new HoldState(source)
                    }
                    : {}
            ));
        }, delayMs);

        return timeoutId;
    }

    render() {
        // we are active if parent status is active and our "leading" timeout is already finished
        return this.props.children(this.props.on ? this.state.holdState : null);
    }
}

module.exports = Holdable;
