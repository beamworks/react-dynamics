const React = require('react');
const ReactDOM = require('react-dom');

// @todo pointer events support for IE/Surface/etc
// @todo touchcancel support
class PressState {
    constructor(domNode, domDownEvent, domPosition) {
        this.node = domNode;
        this.event = domDownEvent;
        this.position = domPosition;
    }
}

class Pressable extends React.PureComponent {
    constructor(props) {
        super();

        this._downListener = null;
        this._touchStartListener = null;
        this._listenerNode = null;

        this.state = {
            pressState: null,
            moveState: null
        };

        this._isUnmounted = false;
    }

    _onMouseDown(domNode, domDownEvent) {
        // ignore non-left-click
        if (domDownEvent.button !== 0) {
            return;
        }

        domDownEvent.preventDefault();

        // mouse event contains the DOM position itself
        const pressState = new PressState(domNode, domDownEvent, domDownEvent);

        const onMove = (moveEvent) => {
            // prevent unwanted text selection/etc
            moveEvent.preventDefault();

            const movedPressState = new PressState(domNode, moveEvent, moveEvent);

            if (!this._isUnmounted) {
                this.setState((state) => (state.pressState === pressState ? { moveState: movedPressState } : {}));
            }
        };

        const onUp = (upEvent) => {
            // ignore non-left-click
            if (upEvent.button !== 0) {
                return;
            }

            upEvent.preventDefault();

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);

            if (!this._isUnmounted) {
                this.setState((state) => (state.pressState === pressState ? { pressState: null, moveState: null } : {}));
            }
        };

        // listen on document, as most reliable way to catch "up"
        if (this.props.movement) {
            document.addEventListener('mousemove', onMove, false);
        }

        document.addEventListener('mouseup', onUp, false);

        this.setState({ pressState: pressState, moveState: pressState });
    }

    _onTouchStart(domNode, domTouchStartEvent) {
        domTouchStartEvent.preventDefault();

        // touch object has the position info
        const pressState = new PressState(domNode, domTouchStartEvent, domTouchStartEvent.changedTouches[0]);
        const touchId = domTouchStartEvent.changedTouches[0].identifier; // track first activated touch

        const onMove = (moveEvent) => {
            // ignore unrelated touch events
            const changedTouchesList = Array.prototype.slice.call(moveEvent.changedTouches);
            const matchingTouch = changedTouchesList.find((touch) => touch.identifier === touchId); // @todo browser support

            if (!matchingTouch) {
                return;
            }

            // prevent unwanted text selection/etc
            moveEvent.preventDefault();

            const movedPressState = new PressState(domNode, moveEvent, matchingTouch);

            if (!this._isUnmounted) {
                this.setState((state) => (state.pressState === pressState ? { moveState: movedPressState } : {}));
            }
        };

        const onEnd = (endEvent) => {
            // ignore unrelated touch events
            const changedTouchesList = Array.prototype.slice.call(endEvent.changedTouches);
            if (!changedTouchesList.some((touch) => touch.identifier === touchId)) {
                return;
            }

            endEvent.preventDefault();

            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);

            if (!this._isUnmounted) {
                this.setState((state) => (state.pressState === pressState ? { pressState: null, moveState: null } : {}));
            }
        };

        // listen on document, as most reliable way to catch "end"
        if (this.props.movement) {
            document.addEventListener('touchmove', onMove, false);
        }

        document.addEventListener('touchend', onEnd, false);

        this.setState({ pressState: pressState, moveState: pressState });
    }

    // @todo add an "active" parameter! would ignore already-started gestures
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
        this._isUnmounted = true;

        this._setNode(null);
    }

    _setNode(domNode) {
        if (this._listenerNode) {
            // if user already had pressed down, the existing up-handlers will clean up as needed
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
        return this.props.children(this.state.pressState, this.state.moveState);
    }
}

module.exports = Pressable;
