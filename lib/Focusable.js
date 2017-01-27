const React = require('react');
const ReactDOM = require('react-dom');

function containsDom(parent, domNode) {
    while (domNode) {
        if (domNode === parent) {
            return true;
        }

        domNode = domNode.parentNode;
    }

    return false;
}

class FocusState {
    constructor(domNode, domEnterEvent) {
        this.domNode = domNode;
        this.domEvent = domEnterEvent;
    }
}

// this defines a "focus root" - which does not have to be focusable itself, just track *any* focus inside
// @todo IE/etc fixes (see https://github.com/myplanet/angular-deep-blur et al)
// @todo track window focus as well (e.g. for dropdowns/etc? or maybe that case deserves its own tracker for state consistency?)
class Focusable extends React.PureComponent {
    constructor(props) {
        super();

        this._focusListener = null;
        this._focusListenerNode = null;

        this.state = {
            focusState: null
        };
    }

    onFocus(domNode, domEnterEvent) {
        // if already active, ignore further focus events
        if (this.state.focusState) {
            return;
        }

        const focusState = new FocusState(domNode, domEnterEvent);

        const onLeave = (leaveEvent) => {
            // e.relatedTarget for Chrome
            // document.activeElement for IE 11
            var targetElement = leaveEvent.relatedTarget || document.activeElement;

            if (containsDom(domNode, targetElement)) {
                return;
            }

            // process the lost focus
            domNode.removeEventListener('blur', onLeave, true);
            this.setState((state) => (state.focusState === focusState ? { focusState: null } : {}));
        };

        domNode.addEventListener('blur', onLeave, true);
        this.setState({ focusState: focusState });
    }

    componentDidMount() {
        const domNode = ReactDOM.findDOMNode(this);

        this._setNode(domNode);
    }

    // @todo: this does not detect standalone child re-renders?
    componentDidUpdate() {
        const domNode = ReactDOM.findDOMNode(this);

        if (domNode !== this._focusListenerNode) {
            this._setNode(domNode);
        }
    }

    componentWillUnmount() {
        this._setNode(null);
    }

    _setNode(domNode) {
        if (this._focusListenerNode) {
            this._focusListenerNode.removeEventListener('focus', this._focusListener, true);

            this._focusListener = null;
            this._focusListenerNode = null;
        }

        if (domNode) {
            this._focusListener = this.onFocus.bind(this, domNode);
            this._focusListenerNode = domNode;

            this._focusListenerNode.addEventListener('focus', this._focusListener, true);
        }
    }

    render() {
        return this.props.children(this.state.focusState);
    }
}

module.exports = Focusable;
