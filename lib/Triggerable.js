const React = require('react');

// @todo is this needed? maybe more useful if we collect + report output of triggered action
class Triggerable extends React.PureComponent {
    constructor(props) {
        super();

        // @todo initial state? in willMount, likely
        this.state = {
            activationId: null
        };
    }

    componentWillReceiveProps(nextProps) {
        // when transitioning to active or changing active value, always schedule new action
        if (nextProps.on && (this.props.on !== nextProps.on)) {
            this.setState({ activationId: this._createActivation(this.props.onActivation, nextProps.on) });
        }
    }

    _createActivation(callback, value) {
        const timeoutId = setTimeout(() => {
            // avoid stale activations (in case of spurious props checks, etc)
            // (safe to check state directly because this is guaranteed to be outside of render cycle)
            if (this.state.activationId !== timeoutId) {
                return;
            }

            callback(value);
        }, 0);

        return timeoutId;
    }

    render() {
        return this.props.children ? this.props.children(!!this.props.activationId) : null;
    }
}

module.exports = Triggerable;
