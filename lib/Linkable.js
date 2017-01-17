const React = require('react');
const ReactDOM = require('react-dom');

class NavigationState {
    constructor(path) {
        this.base = '#' + path;
    }
}

class Linkable extends React.PureComponent {
    constructor(props) {
        super();

        // @todo check path slashes as a safety net
        this._hashListener = null;

        // set at path parsing time
        this._linkComponent = null;

        this.state = {
            navigationState: null
        };
    }

    onNavigate(navPath, linkPath) {
        const navElements = navPath.split(/\//g);
        const linkElements = linkPath.split(/\//g);

        // @todo base should be treated as opaque (if pattern matching is implemented)
        var mismatchCount = 0;
        linkElements.forEach((linkElement, i) => mismatchCount += navElements[i] === linkElement ? 0 : 1);

        if (mismatchCount === 0) {
            // update to match active navigation path
            const matchPath = navElements.slice(0, linkElements.length).join('/');

            if (!this.state.navigationState || this.state.navigationState.base !== '#' + matchPath) {
                this.setState({ navigationState: new NavigationState(matchPath) });
            }
        } else if (this.state.navigationState) {
            // clear out navigation state
            this.setState({ navigationState: null });
        }
    }

    _getPathFromHref(href) {
        if (href.charAt(0) !== '#') {
            throw new Error('href should start with hash');
        }

        const path = href.substring(1);

        if (path.length > 0 && path.charAt(0) !== '/') {
            throw new Error('href path should start with slash after hash');
        }

        return path;
    }

    componentWillMount() {
        // @todo support changing the path live?
        const basePath = this.props.base ? this._getPathFromHref(this.props.base) : '';
        const linkPath = basePath + this.props.path;

        this._hashListener = () => {
            const hashMatch = /^#(\/.*)$/.exec(window.location.hash);

            const hashPath = hashMatch
                ? hashMatch[1]
                : '/';

            this.onNavigate(hashPath, linkPath);
        };

        window.addEventListener('hashchange', this._hashListener, false);

        // link affordance
        // @todo support for named parameters, etc
        this._linkComponent = class Link extends React.PureComponent {
            componentDidMount() {
                const domNode = ReactDOM.findDOMNode(this);

                if (!domNode) {
                    return; // @todo something?
                }

                if (domNode.nodeName === 'A') {
                    domNode.href = '#' + linkPath;
                } else {
                    // @todo stop listening on unmount?
                    domNode.addEventListener('click', () => {
                        window.location = '#' + linkPath;
                    }, false);
                }
            }

            render() {
                // @todo use contents/element prop convention?
                return React.Children.only(this.props.children);
            }
        };

        // do the initial check
        this._hashListener();
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this._hashListener);
    }

    render() {
        return this.props.contents(this.state.navigationState, this._linkComponent);
    }
}

module.exports = Linkable;
