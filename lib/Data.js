const React = require('react');

class Data extends React.PureComponent {
    constructor(props) {
        super();

        this.state = {
            pendingRequest: null,
            response: null
        };

        this._isUnmounted = false;

        this._refreshHandler = this._refresh.bind(this);
    }

    // @todo deal with the case when the data is pre-fetched and in fact synchronous?
    // ... makes sense to always assume a pending state first
    // ... and then if there is pre-fetch, make a HoC wrapper that helps guarantee sync operation
    componentWillMount() {
        // set up with an initial dummy promise
        // so that server-side rendering just shows pending state
        const dummyPromise = new Promise(() => {
            // never resolve initial promise
        });

        this.setState({
            pendingRequest: dummyPromise
        });
    }

    componentDidMount() {
        this._refresh();
    }

    _refresh() {
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
            // @todo this inside a reducer style callback
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
            this.state.pendingRequest !== null,
            this._refreshHandler
        );
    }
}

module.exports = Data;
