const React = require('react');
const ReactDOM = require('react-dom');

class MoveState {
    constructor(source, domMoveEvent, domPosition) {
        this.source = source;
        this.domEvent = domMoveEvent;
        this.domPosition = domPosition;
    }
}

function getStartMoveStateFromSourceState(source) {
    // perform sanity checks on source events
    const sourceEvent = source.domEvent;

    if (!sourceEvent) {
        throw new Error('source state must contain domEvent property');
    }

    if (
        !(
            // @todo check source DOM position to be the same mouse event
            (sourceEvent.type === 'mousedown' || sourceEvent.type === 'mouseenter') &&
            (typeof sourceEvent.pageX === 'number') &&
            (typeof sourceEvent.pageY === 'number')
        ) &&
        !(
            // @todo check source DOM position to be a matching touch
            sourceEvent.type === 'touchstart' &&
            sourceEvent.changedTouches &&
            sourceEvent.changedTouches[0] &&
            (typeof sourceEvent.changedTouches[0].pageX === 'number') &&
            (typeof sourceEvent.changedTouches[0].pageY === 'number')
        )
    ) {
        throw new Error('source domEvent must be a mouse or touch start event');
    }

    return new MoveState(source, sourceEvent, source.domPosition);
}

// @todo this has some lag when moving? is it due to render?
class Movable extends React.PureComponent {
    constructor(props) {
        super();

        this._moveListener = this._onMove.bind(this);
        this._touchMoveListener = this._onTouchMove.bind(this);

        this.state = {
            moveState: null
        };
    }

    _onMove(event) {
        if (this.state.moveState) {
            // ignore events that do not match source event
            const sourceEvent = this.state.moveState.source.domEvent;
            if (sourceEvent.type !== 'mousedown' && sourceEvent.type !== 'mouseenter') {
                return;
            }

            // prevent unwanted text selection/etc
            event.preventDefault();

            // this obviously triggers a lot of renders, but the refresh can be very well-contained
            // mouse event itself contains position info
            this.setState({ moveState: new MoveState(this.state.moveState.source, event, event) });
        }
    }

    _onTouchMove(event) {
        if (this.state.moveState) {
            // ignore events that do not match source event
            const sourceEvent = this.state.moveState.source.domEvent;
            if (sourceEvent.type !== 'touchstart') {
                return;
            }

            // @todo use the domPosition from source state instead of assuming it is the first touch
            const sourceTouchId = sourceEvent.changedTouches[0].identifier; // match first activated touch
            const changedTouchesList = Array.prototype.slice.call(event.changedTouches);
            const changedTouch = changedTouchesList.filter((touch) => touch.identifier === sourceTouchId)[0];

            if (!changedTouch) {
                return;
            }

            // prevent unwanted text selection/etc
            event.preventDefault();

            // this obviously triggers a lot of renders, but the refresh can be very well-contained
            // report the changed touch as having positional info
            this.setState({ moveState: new MoveState(this.state.moveState.source, event, changedTouch) });
        }
    }

    componentDidMount() {
        // @todo initial state
        // @todo only listen on given event?
        document.addEventListener('mousemove', this._moveListener, false);
        document.addEventListener('touchmove', this._touchMoveListener, false);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.on && (this.props.on !== nextProps.on)) {
            // when activating or re-activating, immediately use given event
            // @todo locally save original source event reference?
            this.setState({ moveState: getStartMoveStateFromSourceState(nextProps.on) });
        } else if (this.props.on && !nextProps.on) {
            this.setState({ moveState: null });
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this._moveListener);
        document.removeEventListener('touchmove', this._touchMoveListener);
    }

    render() {
        return this.props.children(this.state.moveState);
    }
}

module.exports = Movable;
