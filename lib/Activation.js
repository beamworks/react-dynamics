const React = require('react');

const StatusTracker = require('./StatusTracker');

class Activation extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            activationState: null
        };

        // @todo track own "on" property?
        this._statusTracker = new StatusTracker(
            () => this.setState({ activationState: true }),
            () => this.setState({ activationState: null })
        );
    }

    render() {
        return this.props.children(
            this.state.activationState,
            this._statusTracker.Component
        );
    }
}

module.exports = Activation;
