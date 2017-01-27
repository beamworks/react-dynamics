const React = require('react');

class ToggleableState {
    constructor(source) {
        this.source = source;
    }
}

// @todo default missing active to true
// @todo report state, including start time
class Toggleable extends React.PureComponent {
    constructor(props) {
        super();

        if (!props.hasOwnProperty('on')) {
            throw new Error('the "on" property is required');
        }

        this.state = {
            toggleState: null
        };
    }

    _toggle() {
        // @todo ignore instead of error? should force dev to check first though?
        if (!this.props.on) {
            throw new Error('cannot toggle while inactive');
        }

        this.setState((state) => ({
            toggleState: state.toggleState ? null : new ToggleableState(this.props.on)
        }));
    }

    componentWillReceiveProps(nextProps) {
        // when transitioning to inactive, or when active value changes, clear existing toggle state
        if (this.props.on && (this.props.on !== nextProps.on)) {
            this.setState({ toggleState: null });
        }
    }

    render() {
        return this.props.children(this.state.toggleState, this._toggle.bind(this));
    }
}

module.exports = Toggleable;
