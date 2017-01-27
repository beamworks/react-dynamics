var React = require('react');

class Submittable extends React.PureComponent {
    constructor() {
        super();

        this.state = {
            currentAction: null,
            errorValue: null
        };
    }

    _invoke(inputValue) {
        // @todo throw if already pending? hard to get it to be atomic, plus sometimes useful to let user retry
        const result = new Promise((resolve) => {
            resolve(inputValue);
        }).then((result) => {
            return this.props.action(result);
        });

        // not resetting error state, just in case errors are still shown during pending action
        this.setState({
            currentAction: result
        });

        // allow a re-do on error
        result.catch((e) => {
            this.setState((state) => (state.currentAction === result ? {
                currentAction: null,
                errorValue: e
            } : {}));
        });

        // on success, clear error and pass resulting value as one-time event
        result.then((v) => {
            this.setState((state) => (state.currentAction === result ? {
                currentAction: null,
                errorValue: null
            } : {}));

            // extra callback with already-resolved value
            this.props.onSuccess && this.props.onSuccess(v);
        });
    }

    render() {
        // args order is consistent with Collectable.Value
        return this.props.children(
            this.state.errorValue,
            this.state.currentAction !== null,
            (v) => this._invoke(v)
        );
    }
}

module.exports = Submittable;
