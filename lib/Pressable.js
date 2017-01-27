const React = require('react');
const ReactDOM = require('react-dom');

// @todo pointer events support for IE/Surface/etc
// @todo touchcancel support
class PressState {
    constructor(domNode, domDownEvent, domPosition) {
        this.domNode = domNode;
        this.domEvent = domDownEvent;
        this.domPosition = domPosition;
    }
}

class Pressable extends React.PureComponent {
    constructor(props) {
        super();

        this._downListener = null;
        this._touchStartListener = null;
        this._listenerNode = null;

        this.state = {
            pressState: null
        };
    }

    _onMouseDown(domNode, domDownEvent) {
        // ignore non-left-click
        if (domDownEvent.button !== 0) {
            return;
        }

        domDownEvent.preventDefault();

        // mouse event contains the DOM position itself
        const pressState = new PressState(domNode, domDownEvent, domDownEvent);

        const onUp = (upEvent) => {
            // ignore non-left-click
            if (upEvent.button !== 0) {
                return;
            }

            upEvent.preventDefault();

            document.removeEventListener('mouseup', onUp);
            this.setState((state) => (state.pressState === pressState ? { pressState: null } : {}));
        };

        // listen on document, as most reliable way to catch "up"
        document.addEventListener('mouseup', onUp, false);
        this.setState({ pressState: pressState });
    }

    _onTouchStart(domNode, domTouchStartEvent) {
        domTouchStartEvent.preventDefault();

        // touch object has the position info
        const pressState = new PressState(domNode, domTouchStartEvent, domTouchStartEvent.changedTouches[0]);
        const touchId = domTouchStartEvent.changedTouches[0].identifier; // track first activated touch

        const onEnd = (endEvent) => {
            // ignore unrelated touch events
            const changedTouchesList = Array.prototype.slice.call(endEvent.changedTouches);
            if (!changedTouchesList.some((touch) => touch.identifier === touchId)) {
                return;
            }

            endEvent.preventDefault();

            document.removeEventListener('touchend', onEnd);
            this.setState((state) => (state.pressState === pressState ? { pressState: null } : {}));
        };

        // listen on document, as most reliable way to catch "end"
        document.addEventListener('touchend', onEnd, false);
        this.setState({ pressState: pressState });
    }

    // @todo add an "active" parameter!
    componentDidMount() {
        const domNode = ReactDOM.findDOMNode(this);

        this._setNode(domNode);
    }

    // @todo: this does not detect standalone child re-renders?
    componentDidUpdate() {
        const domNode = ReactDOM.findDOMNode(this);

        if (domNode !== this._listenerNode) {
            this._setNode(domNode);
        }
    }

    componentWillUnmount() {
        this._setNode(null);
    }

    _setNode(domNode) {
        if (this._listenerNode) {
            this._listenerNode.removeEventListener('mousedown', this._downListener);
            this._listenerNode.removeEventListener('touchstart', this._touchStartListener);

            this._downListener = null;
            this._touchStartListener = null;
            this._listenerNode = null;
        }

        if (domNode) {
            this._downListener = this._onMouseDown.bind(this, domNode);
            this._touchStartListener = this._onTouchStart.bind(this, domNode);
            this._listenerNode = domNode;

            this._listenerNode.addEventListener('mousedown', this._downListener, false);
            this._listenerNode.addEventListener('touchstart', this._touchStartListener, false);
        }
    }

    render() {
        return this.props.children(this.state.pressState);
    }
}

module.exports = Pressable;
