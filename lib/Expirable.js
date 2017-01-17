const React = require('react');

class ExpirableState {
    constructor(source, onDismiss) {
        this.source = source;

        this.dismiss = () => {
            onDismiss();
        };
    }
}

// @todo default missing active to true
// @todo report state, including start time
class Expirable extends React.PureComponent {
    constructor(props) {
        super();

        if (!props.hasOwnProperty('on')) {
            throw new Error('the "on" property is required');
        }

        this._isUnmounted = false;

        this.state = {
            expirableState: null
        };
    }

    componentWillMount() {
        // set up initial "leading" timeout
        if (this.props.on) {
            this.setState({ expirableState: this._createExpirableState(this.props.on) });
        }
    }

    componentWillReceiveProps(nextProps) {
        // when transitioning to active, or when active value changes, set up new "leading" timeout
        // (no need to detect transition to inactive, any pre-existing timeout will be ignored/overridden anyway)
        if (nextProps.on && (this.props.on !== nextProps.on)) {
            this.setState({ expirableState: this._createExpirableState(nextProps.on) });
        }
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    _createExpirableState(source) {
        var expirableState = new ExpirableState(source, () => {
            // ignore if entire instance is obsolete
            if (this._isUnmounted) {
                return;
            }

            // deactivate timeout status if we are still the active one
            this.setState((state) => (state.expirableState === expirableState ? { expirableState: null } : {}));
        });

        if (this.props.delayMs) {
            setTimeout(() => {
                expirableState.dismiss();
            }, this.props.delayMs);
        }

        return expirableState;
    }

    render() {
        // we are active if parent status is active and our "leading" timeout is still going
        return this.props.contents(this.props.on ? this.state.expirableState : null);
    }
}

module.exports = Expirable;
