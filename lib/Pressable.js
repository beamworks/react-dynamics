const React = require('react');
const ReactDOM = require('react-dom');

// @todo pointer events support for IE/Surface/etc
// @todo touchcancel support
class PressState {
    constructor(domNode, domDownEvent, domPosition, initialEvent, initialPosition, sourceValue) {
        this.node = domNode;
        this.event = domDownEvent;
        this.position = domPosition;

        this.initialEvent = initialEvent;
        this.initialPosition = initialPosition;

        this.source = sourceValue;
    }
}

function createPressAreaComponent(parentNode) {
    return class PressArea extends React.PureComponent {
        constructor(props) {
            super();

            this._downListener = null;
            this._touchStartListener = null;
            this._listenerNode = null;
        }

        _onMouseDown(domNode, domDownEvent) {
            // ignore non-left-click
            if (domDownEvent.button !== 0) {
                return;
            }

            domDownEvent.preventDefault();

            parentNode._startMousePress(this.props.value, domNode, domDownEvent);
        }

        _onTouchStart(domNode, domTouchStartEvent) {
            domTouchStartEvent.preventDefault();

            parentNode._startTouchPress(this.props.value, domNode, domTouchStartEvent);
        }

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
            return React.Children.only(this.props.children);
        }
    };
}

// @todo add a "disabled" prop for press areas, also add "cancel" to the ongoing state
class Pressable extends React.PureComponent {
    constructor(props) {
        super();

        this.state = {
            initialPressState: null,
            currentPressState: null
        };

        this._pressAreaComponent = createPressAreaComponent(this);
        this._isUnmounted = false;
    }

    _updatePressState(initialPressState, nextPressState) {
        if (this._isUnmounted) {
            return;
        }

        this.setState((state) => state.initialPressState === initialPressState
            ? { currentPressState: nextPressState }
            : {}
        );
    }

    _clearPressState(initialPressState) {
        if (this._isUnmounted) {
            return;
        }

        this.setState((state) => state.initialPressState === initialPressState
            ? {
                initialPressState: null,
                currentPressState: null
            }
            : {}
        );
    }

    _startMousePress(sourceValue, domNode, domDownEvent) {
        // mouse event contains the DOM position itself
        const pressState = new PressState(
            domNode,
            domDownEvent,
            domDownEvent,
            domDownEvent,
            domDownEvent,
            sourceValue
        );

        const onMove = (moveEvent) => {
            // completely ignore if simple mode
            if (!this.props.withMovement) {
                return;
            }

            // prevent unwanted text selection/etc
            moveEvent.preventDefault();

            this._updatePressState(
                pressState,
                new PressState(
                    domNode,
                    moveEvent,
                    moveEvent,
                    domDownEvent,
                    domDownEvent,
                    sourceValue
                )
            );
        };

        const onUp = (upEvent) => {
            // ignore non-left-click
            if (upEvent.button !== 0) {
                return;
            }

            upEvent.preventDefault();

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);

            this._clearPressState(pressState);
        };

        this.setState({
            initialPressState: pressState,
            currentPressState: pressState
        }, () => {
            // after state is set, listen on document, as most reliable way to catch "up"
            document.addEventListener('mousemove', onMove, false);
            document.addEventListener('mouseup', onUp, false);
        });
    }

    _startTouchPress(sourceValue, domNode, domTouchStartEvent) {
        // touch object has the position info
        const domTouchStartPosition = domTouchStartEvent.changedTouches[0]; // track first activated touch
        const touchId = domTouchStartPosition.identifier;

        const pressState = new PressState(
            domNode,
            domTouchStartEvent,
            domTouchStartPosition,
            domTouchStartEvent,
            domTouchStartPosition,
            sourceValue
        );

        const onMove = (moveEvent) => {
            if (!this.props.withMovement) {
                return;
            }

            // ignore unrelated touch events
            const changedTouchesList = Array.prototype.slice.call(moveEvent.changedTouches);
            const matchingTouch = changedTouchesList.find((touch) => touch.identifier === touchId); // @todo browser support

            if (!matchingTouch) {
                return;
            }

            // prevent unwanted text selection/etc
            moveEvent.preventDefault();

            this._updatePressState(
                pressState,
                new PressState(
                    domNode,
                    moveEvent,
                    matchingTouch,
                    domTouchStartEvent,
                    domTouchStartPosition,
                    sourceValue
                )
            );
        };

        const onEnd = (endEvent) => {
            // ignore unrelated touch events
            const changedTouchesList = Array.prototype.slice.call(endEvent.changedTouches);
            const matchingTouch = changedTouchesList.find((touch) => touch.identifier === touchId); // @todo browser support

            if (!matchingTouch) {
                return;
            }

            endEvent.preventDefault();

            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);

            this._clearPressState(pressState);
        };

        this.setState({
            initialPressState: pressState,
            currentPressState: pressState
        }, () => {
            // after state is set, listen on document, as most reliable way to catch "end"
            document.addEventListener('touchmove', onMove, false);
            document.addEventListener('touchend', onEnd, false);
        });
    }

    componentWillUnmount() {
        this._isUnmounted = true;
    }

    render() {
        return this.props.children(this.state.pressState, this._pressAreaComponent);
    }
}

module.exports = Pressable;
