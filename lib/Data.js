const React = require('react');

class Data extends React.PureComponent {
    constructor(props) {
        super();

        this.state = {
            pendingRequest: null,
            response: null
        };

        this._isUnmounted = false;
    }

    componentWillMount() {
        // catch synchronous exceptions using promise wrapper
        const request = new Promise((resolve) => {
            resolve(this.props.source());
        });

        // request might be synchronously resolved
        this.setState({
            pendingRequest: request
        });

        // handle non-error response
        // (on error, pending status is preserved)
        // @todo error hook
        request.then((response) => {
            // ignore if stale instance
            if (this._isUnmounted) {
                return;
            }

            // ignore if stale request
            if (this.state.pendingRequest !== request) {
                return;
            }

            // report result
            this.setState({
                pendingRequest: null,
                response: response
            });
        });
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    render() {
        return this.props.children(
            this.state.response,
            this.state.pendingRequest !== null
        );
    }
}

module.exports = Data;
