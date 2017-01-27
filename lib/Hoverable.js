const React = require('react');
const ReactDOM = require('react-dom');

class HoverState {
    constructor(domNode, domEnterEvent) {
        this.domNode = domNode;
        this.domEvent = domEnterEvent;
        this.domPosition = domEnterEvent; // event object itself has position (match convention of e.g. movable)
    }
}

class Hoverable extends React.PureComponent {
    constructor(props) {
        super();

        this._enterListener = null;
        this._enterListenerNode = null;

        this.state = {
            hoverState: null
        };
    }

    onMouseEnter(domNode, domEnterEvent) {
        domEnterEvent.preventDefault(); // prevent default, in hopes to make mobile less sluggish

        const hoverState = new HoverState(domNode, domEnterEvent);

        const onLeave = (leaveEvent) => {
            leaveEvent.preventDefault();

            domNode.removeEventListener('mouseleave', onLeave);
            this.setState((state) => (state.hoverState === hoverState ? { hoverState: null } : {}));
        };

        domNode.addEventListener('mouseleave', onLeave, false);
        this.setState({ hoverState: hoverState });
    }

    // @todo add an "active" parameter!
    componentDidMount() {
        const domNode = ReactDOM.findDOMNode(this);

        this._setNode(domNode);
    }

    // @todo: this does not detect standalone child re-renders?
    componentDidUpdate() {
        const domNode = ReactDOM.findDOMNode(this);

        if (domNode !== this._enterListenerNode) {
            this._setNode(domNode);
        }
    }

    componentWillUnmount() {
        this._setNode(null);
    }

    _setNode(domNode) {
        if (this._enterListenerNode) {
            this._enterListenerNode.removeEventListener('mouseenter', this._enterListener);

            this._enterListener = null;
            this._enterListenerNode = null;
        }

        if (domNode) {
            this._enterListener = this.onMouseEnter.bind(this, domNode);
            this._enterListenerNode = domNode;

            this._enterListenerNode.addEventListener('mouseenter', this._enterListener, false);
        }
    }

    render() {
        return this.props.children(this.state.hoverState);
    }
}

module.exports = Hoverable;
