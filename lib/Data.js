const React = require('react');

class Data extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            pendingRequest: null,
            response: null
        };

        // get observed props at start time to simplify logic
        this._observedPropList = Object.keys(this.props).filter(propName => (/^observe/).exec(propName));

        this._isUnmounted = false;

        // stable reference to refresh handler to avoid triggering prop changes for children
        // @todo add story to test
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

    componentWillReceiveProps(nextProps) {
        const observedPropsChanged = this._observedPropList.some(propName =>
            this.props[propName] !== nextProps[propName]
        );

        // trigger refresh right away, using the up-to-date source reference
        if (observedPropsChanged) {
            this._refreshWithSource(nextProps.source);
        }
    }

    refresh() {
        // public instance-based access to refresh data
        // @todo add story to test
        this._refresh();
    }

    _refresh() {
        // use the source from current props
        this._refreshWithSource(this.props.source);
    }

    _refreshWithSource(recentSource) {
        // catch synchronous exceptions using promise wrapper
        const request = new Promise((resolve) => {
            resolve(recentSource());
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

            // report result unless stale request
            this.setState(currentState => {
                if (currentState.pendingRequest !== request) {
                    return null;
                }

                return {
                    pendingRequest: null,
                    response: response
                };
            });
        }, (error) => {
            // ignore if stale instance
            if (this._isUnmounted) {
                return;
            }

            // ignore if stale request (@todo do this inside state change job queue?)
            if (this.state.pendingRequest !== request) {
                return;
            }

            this._notifyError(error);
        });
    }

    _notifyError(error) {
        if (this.props.onError) {
            this.props.onError(error);
        }
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
